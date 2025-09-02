import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { QueueService } from "@core/queue/queue.service";
import { UploadService } from "@modules/web/upload/services/upload.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PROCESSING_STATUS } from "../constants/datasets.constants";
import {
    CreateDocumentDto,
    CreateDocumentResponseDto,
    QueryDocumentDto,
    RenameDocumentDto,
} from "../dto/documents.dto";
import {
    FileSegmentResultDto,
    IndexingSegmentsDto,
    ParentSegmentDto,
    SegmentResultDto,
} from "../dto/indexing-segments.dto";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsDocument } from "../entities/datasets-document.entity";
import { DatasetsSegments } from "../entities/datasets-segments.entity";
import { IndexingService } from "./indexing.service";

/**
 * 文档服务
 * 提供文档的查询、删除、重命名等功能
 */
@Injectable()
export class DocumentsService extends BaseService<DatasetsDocument> {
    protected readonly logger = new Logger(DocumentsService.name);

    constructor(
        @InjectRepository(DatasetsDocument)
        private readonly documentRepository: Repository<DatasetsDocument>,
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        private readonly indexingService: IndexingService,
        private readonly uploadService: UploadService,
        private readonly queueService: QueueService,
    ) {
        super(documentRepository);
    }

    /**
     * 创建文档并处理分段（支持多文件）
     */
    async createDocument(
        dto: CreateDocumentDto,
        user: UserPlayground,
    ): Promise<CreateDocumentResponseDto> {
        const startTime = Date.now();

        // 1. 验证知识库是否存在
        const dataset = await this.datasetsRepository.findOne({
            where: { id: dto.datasetId },
        });

        if (!dataset) {
            throw HttpExceptionFactory.notFound("知识库不存在");
        }

        // 2. 检查是否为知识库的第一个文档
        const existingDocumentsCount = await this.documentRepository.count({
            where: { datasetId: dto.datasetId },
        });

        const isFirstDocument = existingDocumentsCount === 0;

        // 3. 如果是第一个文档且传入了 embeddingModelId，更新知识库的向量模型
        if (isFirstDocument && dto.embeddingModelId) {
            await this.datasetsRepository.update(dto.datasetId, {
                embeddingModelId: dto.embeddingModelId,
            });
        }

        const { fileIds } = dto.indexingConfig;

        // 4. 检查文件是否上传
        if (!fileIds?.length) {
            throw HttpExceptionFactory.badRequest("请上传文件");
        }

        try {
            // 5. 文件分段处理
            const segmentsResult = await this.indexingService.indexingSegments(
                dto.indexingConfig as IndexingSegmentsDto,
            );
            this.logger.log(`[+] 文件分段完成，总分段数: ${segmentsResult.totalSegments}`);

            // 6. 创建文档并并发处理
            const fileResults =
                segmentsResult.fileResults?.filter((fr) => fr.segments?.length) ?? [];

            const documentPromises = fileResults.map(async (fileResult) => {
                const document = await this.createDocumentAndChunks(
                    dataset,
                    fileResult,
                    user,
                    dto.documentName,
                );
                this.logger.log(`[+] 文档已创建: ${fileResult.fileName}`);

                // 7. 异步队列向量化
                await this.queueService
                    .addVectorizationJob("document", {
                        datasetId: dataset.id,
                        documentId: document.id,
                    })
                    .catch((error) => {
                        this.logger.error(
                            `[!] 文档向量化任务添加失败: ${error.message}`,
                            error.stack,
                        );
                    });

                return document;
            });

            const createdDocuments = await Promise.all(documentPromises);
            this.logger.log(`[+] 所有向量化任务已启动`);

            const processingTime = Date.now() - startTime;

            return {
                documents: createdDocuments,
                createdCount: createdDocuments.length,
                totalSegments: segmentsResult.totalSegments,
                processingTime,
            };
        } catch (error) {
            this.logger.error(`[!] 创建文档失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`创建文档失败: ${error.message}`);
        }
    }

    /**
     * 创建单个文档和向量块
     */
    private async createDocumentAndChunks(
        dataset: Datasets,
        fileResult: FileSegmentResultDto,
        user: UserPlayground,
        customDocumentName?: string,
    ): Promise<DatasetsDocument> {
        const file = await this.uploadService.getFileById(fileResult.fileId);
        if (!file) {
            throw HttpExceptionFactory.badRequest(`文件未找到: ${fileResult.fileId}`);
        }

        const documentName = customDocumentName || fileResult.fileName;

        // 计算所有分段的字符总数
        const totalCharacterCount = fileResult.segments.reduce((total, segment) => {
            return total + segment.content.length;
        }, 0);

        const document = await this.documentRepository.save({
            datasetId: dataset.id,
            fileId: fileResult.fileId,
            fileName: documentName,
            fileType: file.extension?.toUpperCase() || "未知",
            fileSize: file.size,
            embeddingModelId: dataset.embeddingModelId,
            chunkCount: fileResult.segmentCount,
            characterCount: totalCharacterCount,
            status: PROCESSING_STATUS.PENDING,
            progress: 0,
            enabled: true,
            createdBy: user.id,
        });

        const vectorChunks = fileResult.segments.map((segment) => {
            const isParentSegment = (
                seg: SegmentResultDto | ParentSegmentDto,
            ): seg is ParentSegmentDto => "children" in seg;

            return {
                datasetId: dataset.id,
                documentId: document.id,
                content: segment.content,
                chunkIndex: segment.index,
                contentLength: segment.length,
                children: isParentSegment(segment)
                    ? segment.children.map((child) => child.content)
                    : undefined,
                metadata: {},
                embeddingModelId: dataset.embeddingModelId,
                status: PROCESSING_STATUS.PENDING,
                createdBy: user.id,
            };
        });

        await this.segmentsRepository.save(vectorChunks);

        // 更新知识库统计：文档数量、分段数量、存储空间
        const fileSizeInBytes = file.size; // 直接用字节

        await this.datasetsRepository.increment({ id: dataset.id }, "documentCount", 1);
        await this.datasetsRepository.increment(
            { id: dataset.id },
            "chunkCount",
            fileResult.segmentCount,
        );

        // 更新存储空间（字节）
        await this.datasetsRepository
            .createQueryBuilder()
            .update(Datasets)
            .set({
                storageSize: () => `storage_size + ${fileSizeInBytes}`,
            })
            .where("id = :id", { id: dataset.id })
            .execute();

        return document;
    }

    /**
     * 分页查询文档列表
     */
    async list(dto: QueryDocumentDto): Promise<{
        needPolling: boolean;
        items: DatasetsDocument[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const queryBuilder = this.documentRepository.createQueryBuilder("document");

        if (dto.datasetId) {
            queryBuilder.andWhere("document.datasetId = :datasetId", {
                datasetId: dto.datasetId,
            });
        }

        if (dto.keyword) {
            queryBuilder.andWhere("document.fileName ILIKE :keyword", {
                keyword: `%${dto.keyword}%`,
            });
        }

        if (dto.status) {
            queryBuilder.andWhere("document.status = :status", {
                status: dto.status,
            });
        }

        if (dto.fileType) {
            queryBuilder.andWhere("document.fileType = :fileType", {
                fileType: dto.fileType,
            });
        }

        if (dto.startTime && dto.endTime) {
            queryBuilder.andWhere("document.createdAt BETWEEN :startTime AND :endTime", {
                startTime: dto.startTime,
                endTime: dto.endTime,
            });
        }

        // 添加文件ID列表筛选
        if (dto.fileIds && dto.fileIds.length > 0) {
            queryBuilder.andWhere("document.fileId IN (:...fileIds)", {
                fileIds: dto.fileIds,
            });
        }

        queryBuilder.orderBy("document.createdAt", "DESC");

        const result = await this.paginateQueryBuilder(queryBuilder, dto);

        // 检查是否需要轮询 - 直接读取数据库中的状态
        const needPolling = result.items.some(
            (doc) =>
                doc.status === PROCESSING_STATUS.PROCESSING ||
                doc.status === PROCESSING_STATUS.PENDING,
        );

        return {
            ...result,
            needPolling,
        };
    }

    /**
     * 获取全部文档列表
     */
    async getAllDocuments(datasetId?: string): Promise<DatasetsDocument[]> {
        return await this.documentRepository.find({
            where: { datasetId },
            order: { createdAt: "DESC" },
        });
    }

    /**
     * 删除文档
     */
    async deleteDocument(id: string): Promise<boolean> {
        const document = await this.getDocumentById(id);

        try {
            // 获取文档的分段数量，用于更新知识库统计
            const segmentCount = await this.segmentsRepository.count({
                where: { documentId: id },
            });

            // 计算文档大小（字节）
            const fileSizeInBytes = document.fileSize;

            // 删除分段
            await this.segmentsRepository.delete({ documentId: id });

            // 删除文档
            await this.documentRepository.delete(id);

            // 更新知识库统计：文档数量、分段数量、存储空间
            await this.datasetsRepository.decrement({ id: document.datasetId }, "documentCount", 1);
            await this.datasetsRepository.decrement(
                { id: document.datasetId },
                "chunkCount",
                segmentCount,
            );

            // 更新存储空间（字节），确保不会小于0
            await this.datasetsRepository
                .createQueryBuilder()
                .update(Datasets)
                .set({
                    storageSize: () => `GREATEST(storage_size - ${fileSizeInBytes}, 0)`,
                })
                .where("id = :id", { id: document.datasetId })
                .execute();

            this.logger.log(
                `删除文档成功: ${id}, 知识库: ${document.datasetId}, 删除分段数: ${segmentCount}, 释放空间: ${fileSizeInBytes}字节`,
            );
            return true;
        } catch (error) {
            this.logger.error(`删除文档失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`删除文档失败: ${error.message}`);
        }
    }

    /**
     * 重命名文档
     */
    async renameDocument(id: string, dto: RenameDocumentDto): Promise<DatasetsDocument> {
        await this.documentRepository.update(id, { fileName: dto.fileName });
        return this.findOneById(id) as Promise<DatasetsDocument>;
    }

    /**
     * 根据ID获取文档详情
     */
    async getDocumentById(id: string): Promise<DatasetsDocument> {
        const document = await this.findOneById(id);

        if (!document) {
            throw HttpExceptionFactory.notFound("文档不存在");
        }

        return document as DatasetsDocument;
    }

    /**
     * 重试文档下所有失败分段的向量化
     */
    async retryDocument(documentId: string): Promise<{ success: boolean }> {
        const document = await this.getDocumentById(documentId);
        if (!document) throw HttpExceptionFactory.notFound("文档不存在");

        const failedSegments = await this.segmentsRepository.find({
            where: { documentId, status: PROCESSING_STATUS.FAILED },
            select: ["id"],
        });

        if (!failedSegments.length) return { success: false };

        // 重置失败分段状态为待处理
        await this.segmentsRepository.update(
            { documentId, status: PROCESSING_STATUS.FAILED },
            { status: PROCESSING_STATUS.PENDING },
        );

        // 重置文档状态为处理中
        await this.documentRepository.update(documentId, {
            status: PROCESSING_STATUS.PENDING,
            progress: 0,
        });

        // 触发向量化任务
        await this.queueService.addVectorizationJob("document", {
            datasetId: document.datasetId,
            documentId: documentId,
        });

        return { success: true };
    }

    /**
     * 设置文档启用/禁用状态
     */
    async setDocumentEnabled(id: string, enabled: boolean): Promise<{ success: boolean }> {
        const document = await this.getDocumentById(id);
        if (!document) throw HttpExceptionFactory.notFound("文档不存在");

        await this.documentRepository.update(id, { enabled });

        this.logger.log(`文档状态已更新: ${id} -> ${enabled ? "启用" : "禁用"}`);
        return { success: true };
    }
}
