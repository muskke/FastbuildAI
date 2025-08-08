import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { QueueService } from "@core/queue/queue.service";
import { UploadService } from "@modules/web/upload/services/upload.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PROCESSING_STATUS } from "../constants/datasets.constants";
import { CreateSegmentDto, QuerySegmentDto, UpdateSegmentDto } from "../dto/segments.dto";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsDocument } from "../entities/datasets-document.entity";
import { DatasetsSegments } from "../entities/datasets-segments.entity";
import { DatasetMemberService } from "./datasets-member.service";

/**
 * 分段服务
 * 提供分段的查询、删除、编辑等功能
 */
@Injectable()
export class SegmentsService extends BaseService<DatasetsSegments> {
    protected readonly logger = new Logger(SegmentsService.name);

    constructor(
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        @InjectRepository(DatasetsDocument)
        private readonly documentRepository: Repository<DatasetsDocument>,
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        private readonly datasetMemberService: DatasetMemberService,
        private readonly queueService: QueueService,
        private readonly uploadService: UploadService,
    ) {
        super(segmentsRepository);
    }

    /**
     * 创建分段
     *
     * @param dto 创建分段参数
     * @param userId 用户ID
     * @returns 创建的分段
     */
    async createSegment(dto: CreateSegmentDto, userId: string): Promise<DatasetsSegments> {
        // 验证文档是否存在且属于指定知识库
        const document = await this.documentRepository.findOne({
            where: { id: dto.documentId, datasetId: dto.datasetId },
        });

        if (!document) {
            throw new Error("文档不存在或不属于指定知识库");
        }

        // 获取文档的分段数量，用于设置chunkIndex
        const segmentCount = await this.segmentsRepository.count({
            where: { documentId: dto.documentId },
        });

        // 获取文件详细信息
        const fileInfo = await this.uploadService.getFileById(document.fileId);

        // 构建分段元数据
        const segmentMetadata = {
            fileId: document.fileId,
            fileName: document.fileName,
            fileType: document.fileType,
            fileSize: document.fileSize,
            filePath: fileInfo?.path || "",
            fileUrl: fileInfo?.url || "",
            extension: fileInfo?.extension || "",
            mimeType: fileInfo?.mimeType || "",
            storageName: fileInfo?.storageName || "",
        };

        // 合并前端传入的 metadata，自动补充的元数据优先生效
        const mergedMetadata = { ...dto.metadata, ...segmentMetadata };

        // 创建分段
        const segment = this.segmentsRepository.create({
            documentId: dto.documentId,
            datasetId: dto.datasetId,
            content: dto.content,
            chunkIndex: segmentCount,
            contentLength: dto.content.length,
            metadata: mergedMetadata,
            status: PROCESSING_STATUS.PENDING,
        });

        const savedSegment = await this.segmentsRepository.save(segment);

        // 更新文档的分段数量和字符数量
        await this.documentRepository.update(
            { id: dto.documentId },
            { chunkCount: segmentCount + 1 },
        );

        // 更新文档的字符数量
        await this.documentRepository
            .createQueryBuilder()
            .update(DatasetsDocument)
            .set({
                characterCount: () => `character_count + ${dto.content.length}`,
            })
            .where("id = :id", { id: dto.documentId })
            .execute();

        // 更新知识库的分段数量
        await this.datasetsRepository.increment({ id: dto.datasetId }, "chunkCount", 1);

        // 异步触发向量化处理
        this.triggerVectorization(dto.datasetId, dto.documentId);

        return savedSegment;
    }

    /**
     * 分页查询分段列表
     */
    async list(dto: QuerySegmentDto): Promise<{
        items: DatasetsSegments[];
        total: number;
        page: number;
        pageSize: number;
        needPolling: boolean;
    }> {
        const queryBuilder = this.segmentsRepository
            .createQueryBuilder("segment")
            .leftJoin("segment.document", "document");

        if (dto.documentId) {
            queryBuilder.andWhere("segment.documentId = :documentId", {
                documentId: dto.documentId,
            });
        }

        if (dto.keyword) {
            queryBuilder.andWhere("segment.content ILIKE :keyword", {
                keyword: `%${dto.keyword}%`,
            });
        }

        if (dto.status && dto.status !== "all") {
            queryBuilder.andWhere("segment.status = :status", {
                status: dto.status,
            });
        }

        if (dto.startTime && dto.endTime) {
            queryBuilder.andWhere("segment.createdAt BETWEEN :startTime AND :endTime", {
                startTime: dto.startTime,
                endTime: dto.endTime,
            });
        }

        queryBuilder.orderBy("segment.chunkIndex", "ASC");

        const result = await this.paginateQueryBuilder(queryBuilder, dto);

        // 检查是否有正在处理的分段，如果有则需要轮询
        const hasProcessingSegments = result.items.some(
            (segment: DatasetsSegments) =>
                segment.status === PROCESSING_STATUS.PROCESSING ||
                segment.status === PROCESSING_STATUS.PENDING,
        );

        return {
            ...result,
            needPolling: hasProcessingSegments,
        };
    }

    /**
     * 删除分段
     */
    async deleteSegment(id: string): Promise<boolean> {
        const segment = await this.getSegmentById(id);

        try {
            await this.delete(id);

            // 更新文档的分段数量和字符数量
            await this.documentRepository.decrement({ id: segment.documentId }, "chunkCount", 1);

            // 更新文档的字符数量，确保不会小于0
            await this.documentRepository
                .createQueryBuilder()
                .update(DatasetsDocument)
                .set({
                    characterCount: () => `GREATEST(character_count - ${segment.contentLength}, 0)`,
                })
                .where("id = :id", { id: segment.documentId })
                .execute();

            // 更新知识库的分段数量
            await this.datasetsRepository.decrement({ id: segment.datasetId }, "chunkCount", 1);

            this.logger.log(
                `删除分段成功: ${id}, 文档: ${segment.documentId}, 知识库: ${segment.datasetId}, 字符数: ${segment.contentLength}`,
            );
            return true;
        } catch (error) {
            this.logger.error(`删除分段失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`删除分段失败: ${error.message}`);
        }
    }

    /**
     * 批量删除分段
     *
     * @param segmentIds 分段ID数组
     * @param userId 用户ID
     * @returns 删除结果
     */
    async batchDeleteSegments(segmentIds: string[]): Promise<{ success: boolean }> {
        // 验证所有分段是否属于同一个知识库
        const segments = await this.segmentsRepository.find({
            where: { id: In(segmentIds) },
            select: ["id", "datasetId", "documentId", "contentLength"],
        });

        if (segments.length !== segmentIds.length) {
            throw new Error("部分分段不存在");
        }

        // 检查是否所有分段属于同一个知识库
        const datasetIds = [...new Set(segments.map((s) => s.datasetId))];
        if (datasetIds.length > 1) {
            throw new Error("不能跨知识库删除分段");
        }

        // 按文档分组，用于更新文档的分段数量和字符数量
        const documentSegmentCounts = new Map<string, { count: number; characters: number }>();
        segments.forEach((segment) => {
            const stats = documentSegmentCounts.get(segment.documentId) || {
                count: 0,
                characters: 0,
            };
            stats.count += 1;
            stats.characters += segment.contentLength;
            documentSegmentCounts.set(segment.documentId, stats);
        });

        // 删除分段
        await this.segmentsRepository.delete({ id: In(segmentIds) });

        // 更新相关文档的分段数量和字符数量
        for (const [documentId, stats] of documentSegmentCounts) {
            await this.documentRepository
                .createQueryBuilder()
                .update(DatasetsDocument)
                .set({
                    chunkCount: () => `GREATEST(chunk_count - ${stats.count}, 0)`,
                    characterCount: () => `GREATEST(character_count - ${stats.characters}, 0)`,
                })
                .where("id = :documentId", { documentId })
                .execute();
        }

        // 更新知识库的分段数量
        await this.datasetsRepository.decrement(
            { id: datasetIds[0] },
            "chunkCount",
            segmentIds.length,
        );

        this.logger.log(`批量分段[${segmentIds.join(",")}]已删除`);
        return { success: true };
    }

    /**
     * 编辑分段
     */
    async updateSegment(id: string, dto: UpdateSegmentDto): Promise<DatasetsSegments> {
        const segment = await this.getSegmentById(id);
        const oldContentLength = segment.contentLength;
        const newContentLength = dto.content.length;
        const characterDiff = newContentLength - oldContentLength;

        try {
            await this.updateById(id, {
                content: dto.content,
                contentLength: newContentLength,
                metadata: dto.metadata,
                status: PROCESSING_STATUS.PENDING,
            });

            // 如果字符数有变化，更新文档的字符数统计
            if (characterDiff !== 0) {
                const operation = characterDiff > 0 ? "+" : "-";
                const absCharacterDiff = Math.abs(characterDiff);

                await this.documentRepository
                    .createQueryBuilder()
                    .update(DatasetsDocument)
                    .set({
                        characterCount: () =>
                            characterDiff > 0
                                ? `character_count + ${absCharacterDiff}`
                                : `GREATEST(character_count - ${absCharacterDiff}, 0)`,
                    })
                    .where("id = :id", { id: segment.documentId })
                    .execute();
            }

            // 异步触发向量化处理
            await this.queueService.addVectorizationJob("document", {
                datasetId: segment.datasetId,
                documentId: segment.documentId,
            });

            this.logger.log(`编辑分段成功: ${id}, 字符数变化: ${characterDiff}`);
            return this.findOneById(id) as Promise<DatasetsSegments>;
        } catch (error) {
            this.logger.error(`编辑分段失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`编辑分段失败: ${error.message}`);
        }
    }

    /**
     * 根据ID获取分段详情
     */
    async getSegmentById(id: string): Promise<DatasetsSegments> {
        const segment = await this.findOneById(id);

        if (!segment) {
            throw HttpExceptionFactory.notFound("分段不存在");
        }

        return segment as DatasetsSegments;
    }

    /**
     * 触发向量化处理
     */
    private async triggerVectorization(datasetId: string, documentId: string): Promise<void> {
        try {
            // 使用队列服务处理向量化
            await this.queueService.addVectorizationJob("document", { datasetId, documentId });

            this.logger.log(`向量化任务已加入队列: 文档 ${documentId}`);
        } catch (error) {
            this.logger.error(`触发向量化处理失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 设置单个分段的启用/禁用状态
     */
    async setSegmentEnabled(id: string, enabled: number): Promise<{ success: boolean }> {
        await this.updateById(id, { enabled });
        return { success: true };
    }

    /**
     * 批量设置分段的启用/禁用状态
     */
    async batchSetSegmentEnabled(ids: string[], enabled: number): Promise<{ success: boolean }> {
        await this.segmentsRepository
            .createQueryBuilder()
            .update(DatasetsSegments)
            .set({ enabled })
            .whereInIds(ids)
            .execute();
        this.logger.log(`批量分段[${ids.join(",")}]已${enabled ? "启用" : "禁用"}`);
        return { success: true };
    }
}
