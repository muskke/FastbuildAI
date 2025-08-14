import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { QueueService } from "@core/queue/queue.service";
import { UploadService } from "@modules/web/upload/services/upload.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Agent } from "../../ai-agent/entities/agent.entity";
import {
    DOCUMENT_MODE,
    PARENT_CONTEXT_MODE,
    PROCESSING_STATUS,
    RETRIEVAL_MODE,
} from "../constants/datasets.constants";
import { CreateDatasetDto, QueryDatasetDto, UpdateDatasetDto } from "../dto/datasets.dto";
import { FileSegmentResultDto, IndexingSegmentsDto } from "../dto/indexing-segments.dto";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsDocument } from "../entities/datasets-document.entity";
import { DatasetsSegments } from "../entities/datasets-segments.entity";
import {
    RerankConfig,
    RetrievalConfig,
    WeightConfig,
} from "../interfaces/retrieval-config.interface";
import { DatasetMemberService } from "./datasets-member.service";
import { DocumentsService } from "./documents.service";
import { IndexingService } from "./indexing.service";
// ...导入部分保持不变

const RAG_SERVICE_CONSTANTS = {
    BATCH_SIZE: 10,
    DEFAULT_TOP_K: 3,
    DEFAULT_SCORE_THRESHOLD: 0.5,
    DEFAULT_SEMANTIC_WEIGHT: 0.7,
    DEFAULT_KEYWORD_WEIGHT: 0.3,
} as const;

/**
 * 知识库服务类
 * 负责知识库的创建、管理、配置保存等核心功能
 */
@Injectable()
export class DatasetsService extends BaseService<Datasets> {
    protected readonly logger = new Logger(DatasetsService.name);

    constructor(
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        @InjectRepository(DatasetsDocument)
        private readonly documentRepository: Repository<DatasetsDocument>,
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        private readonly indexingService: IndexingService,
        private readonly uploadService: UploadService,
        private readonly datasetMemberService: DatasetMemberService,
        private readonly queueService: QueueService,
        private readonly documentsService: DocumentsService,
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
    ) {
        super(datasetsRepository);
    }

    /**
     * 创建知识库
     */
    async createDatasets(dto: CreateDatasetDto, user: UserPlayground): Promise<Datasets> {
        const { name, description, embeddingModelId, retrievalConfig, indexingConfig } = dto;
        const { fileIds } = indexingConfig;

        const existing = await this.findOne({ where: { name, createdBy: user.id } });
        if (existing) throw HttpExceptionFactory.badRequest("知识库名称已存在");
        if (!fileIds?.length) throw HttpExceptionFactory.badRequest("请上传文件");

        try {
            const config = this.buildRetrievalConfig(retrievalConfig);

            const created = await this.create({
                name,
                description,
                indexingConfig,
                embeddingModelId,
                retrievalMode: retrievalConfig.retrievalMode,
                retrievalConfig: config,
                createdBy: user.id,
            });

            const dataset = (await this.findOneById(created.id!)) as Datasets;
            await this.datasetMemberService.initializeOwner(dataset.id, user.id);
            this.logger.log(`[+] 所有者初始化完成: ${user.id}`);

            this.logger.log(`[+] 同步创建文档记录: ${dataset.id}`);
            await this.createDocumentsSync(dataset, indexingConfig, user);

            // 异步处理文件
            this.processDatasetFilesAsync(dataset, indexingConfig, user);

            this.logger.log(`[+] 创建成功，后台处理中: ${dataset.id}`);
            return dataset;
        } catch (err) {
            this.logger.error(`[!] 创建失败: ${err.message}`, err.stack);
            throw HttpExceptionFactory.internal(`创建知识库失败: ${err.message}`);
        }
    }

    /**
     * 创建空知识库，只需名称和描述
     */
    async createEmptyDataset(
        dto: { name: string; description?: string },
        user: UserPlayground,
    ): Promise<Datasets> {
        const { name, description } = dto;
        // 检查重名
        const existing = await this.findOne({ where: { name, createdBy: user.id } });
        if (existing) throw HttpExceptionFactory.badRequest("知识库名称已存在");

        const indexingConfig: IndexingSegmentsDto = {
            documentMode: DOCUMENT_MODE.NORMAL,
            parentContextMode: PARENT_CONTEXT_MODE.PARAGRAPH,
            segmentation: {
                segmentIdentifier: "\\n\\n",
                maxSegmentLength: 1024,
                segmentOverlap: 50,
            },
            subSegmentation: {
                segmentIdentifier: "\\n",
                maxSegmentLength: 512,
            },
            preprocessingRules: {
                replaceConsecutiveWhitespace: false,
                removeUrlsAndEmails: false,
            },
            fileIds: [],
        };

        const retrievalConfig: RetrievalConfig = {
            retrievalMode: RETRIEVAL_MODE.HYBRID,
            strategy: "weighted_score",
            topK: RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K,
            scoreThreshold: RAG_SERVICE_CONSTANTS.DEFAULT_SCORE_THRESHOLD,
            scoreThresholdEnabled: false,
            weightConfig: {
                semanticWeight: RAG_SERVICE_CONSTANTS.DEFAULT_SEMANTIC_WEIGHT,
                keywordWeight: RAG_SERVICE_CONSTANTS.DEFAULT_KEYWORD_WEIGHT,
            },
            rerankConfig: {
                enabled: false,
                modelId: "",
            },
        };

        // 创建知识库
        const created = await this.create({
            name,
            description,
            createdBy: user.id,
            embeddingModelId: null,
            indexingConfig,
            retrievalConfig,
        });
        const dataset = (await this.findOneById(created.id!)) as Datasets;
        // 初始化成员所有者
        await this.datasetMemberService.initializeOwner(dataset.id, user.id);
        this.logger.log(`[+] 空知识库创建并初始化所有者: ${user.id}`);
        return dataset;
    }

    /**
     * 更新知识库
     */
    async updateDataset(id: string, userId: string, dto: UpdateDatasetDto): Promise<Datasets> {
        const dataset = await this.findOneById(id);
        if (!dataset) throw HttpExceptionFactory.notFound("知识库不存在");

        if (dto.name && dto.name !== dataset.name) {
            const duplicate = await this.findOne({
                where: { name: dto.name, createdBy: userId },
            });
            if (duplicate && duplicate.id !== id) {
                throw HttpExceptionFactory.badRequest("知识库名称已存在");
            }
        }

        try {
            const updateData: Partial<Datasets> = {
                name: dto.name || undefined,
                description: dto.description || undefined,
            };

            if (dto.embeddingModelId && dto.embeddingModelId !== dataset.embeddingModelId) {
                this.logger.log(`[!] Embedding 模型已变更，检查是否需要重新向量化: ${id}`);

                // 检查知识库是否有分段
                const segmentCount = await this.segmentsRepository.count({
                    where: { datasetId: id },
                });

                if (segmentCount > 0) {
                    // 有分段时才需要重新向量化
                    this.logger.log(`[!] 知识库有 ${segmentCount} 个分段，重置向量状态`);

                    // 更新分段状态
                    await this.segmentsRepository.update(
                        { datasetId: id },
                        {
                            status: PROCESSING_STATUS.PENDING,
                            embedding: null,
                            embeddingModelId: dto.embeddingModelId,
                        },
                    );

                    // 更新文档的embedding模型ID和状态
                    await this.documentRepository.update(
                        { datasetId: id },
                        {
                            embeddingModelId: dto.embeddingModelId,
                            status: PROCESSING_STATUS.PROCESSING,
                            progress: 0,
                        },
                    );

                    updateData.embeddingModelId = dto.embeddingModelId;

                    this.queueService
                        .addVectorizationJob("dataset", { datasetId: id })
                        .catch((err) => {
                            this.logger.error(`[!] 向量化队列失败: ${err.message}`, err.stack);
                        });

                    this.logger.log(`[!] 已触发重新向量化，所有状态已更新`);
                } else {
                    // 没有分段时直接更新模型ID
                    this.logger.log(`[!] 知识库没有分段，直接更新模型ID`);
                    updateData.embeddingModelId = dto.embeddingModelId;

                    // 更新文档的embedding模型ID
                    await this.documentRepository.update(
                        { datasetId: id },
                        { embeddingModelId: dto.embeddingModelId },
                    );
                }
            }

            if (dto.retrievalConfig !== undefined) {
                const config = this.buildRetrievalConfig(dto.retrievalConfig);
                updateData.retrievalMode = dto.retrievalConfig.retrievalMode;
                updateData.retrievalConfig = config;
            }

            await this.datasetsRepository.update(id, updateData);
            this.logger.log(`[+] 知识库更新成功: ${id}`);
            return (await this.findOneById(id)) as Datasets;
        } catch (err) {
            this.logger.error(`[!] 更新失败: ${err.message}`, err.stack);
            throw HttpExceptionFactory.internal(`更新知识库失败: ${err.message}`);
        }
    }

    /**
     * 构建统一检索配置
     */
    private buildRetrievalConfig(dto: RetrievalConfig | any): RetrievalConfig {
        const config: RetrievalConfig = {
            retrievalMode: dto.retrievalMode,
            topK: dto.topK,
            scoreThreshold: dto.scoreThreshold,
            scoreThresholdEnabled: dto.scoreThresholdEnabled,
            weightConfig: this.buildWeightConfig(dto.weightConfig, dto.retrievalMode),
        };

        const rerankCfg = dto.rerankConfig || dto.weightConfig?.rerank;
        if (rerankCfg) config.rerankConfig = this.buildRerankConfig(rerankCfg);

        if (dto.retrievalMode === RETRIEVAL_MODE.HYBRID) {
            config.strategy = dto.strategy || "weighted_score";
            this.validateHybridConfig(config);
        }

        return config;
    }

    /**
     * 构建权重配置
     */
    private buildWeightConfig(weightConfig?: WeightConfig, mode?: string): WeightConfig {
        const config: WeightConfig = {};

        if (mode === RETRIEVAL_MODE.HYBRID) {
            config.semanticWeight =
                weightConfig?.semanticWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_SEMANTIC_WEIGHT;
            config.keywordWeight =
                weightConfig?.keywordWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_KEYWORD_WEIGHT;

            if (Math.abs(config.semanticWeight + config.keywordWeight - 1) > 0.01) {
                throw HttpExceptionFactory.badRequest("语义权重和关键词权重之和必须等于1");
            }
        } else if (mode === RETRIEVAL_MODE.VECTOR) {
            config.semanticWeight = 1.0;
            config.keywordWeight = 0.0;
        } else if (mode === RETRIEVAL_MODE.FULL_TEXT) {
            config.semanticWeight = 0.0;
            config.keywordWeight = 1.0;
        }

        return config;
    }

    /**
     * 构建 Rerank 配置
     */
    private buildRerankConfig(cfg?: any): RerankConfig | undefined {
        if (!cfg) return undefined;
        if (cfg.enabled && !cfg.modelId) {
            throw HttpExceptionFactory.badRequest("启用 Rerank 时必须指定模型 ID");
        }
        return {
            enabled: !!cfg.enabled,
            modelId: cfg.modelId || "",
        };
    }

    /**
     * 验证混合检索配置
     */
    private validateHybridConfig(config: RetrievalConfig): void {
        if (config.strategy === "rerank" && !config.rerankConfig?.enabled) {
            throw HttpExceptionFactory.badRequest("混合检索 Rerank 模式下必须启用并指定模型");
        }
    }

    /**
     * 同步创建文档记录
     */
    private async createDocumentsSync(
        dataset: Datasets,
        indexingConfig: IndexingSegmentsDto,
        user: UserPlayground,
    ): Promise<void> {
        const { fileIds } = indexingConfig;
        let totalSizeInBytes = 0; // 累计文件大小（字节）

        for (const fileId of fileIds) {
            const file = await this.uploadService.getFileById(fileId);
            if (!file) {
                this.logger.warn(`[!] 文件未找到: ${fileId}`);
                continue;
            }

            // 累计文件大小（字节）
            totalSizeInBytes += file.size;

            await this.documentRepository.save({
                datasetId: dataset.id,
                fileId,
                fileName: file.originalName,
                fileType: file.extension?.toUpperCase() || "未知",
                fileSize: file.size,
                embeddingModelId: dataset.embeddingModelId,
                chunkCount: 0,
                characterCount: 0,
                status: PROCESSING_STATUS.PENDING,
                progress: 0,
                enabled: true,
                createdBy: user.id,
            });

            await this.datasetsRepository.increment({ id: dataset.id }, "documentCount", 1);
        }

        // 更新知识库存储空间（字节）
        if (totalSizeInBytes > 0) {
            await this.datasetsRepository
                .createQueryBuilder()
                .update(Datasets)
                .set({
                    storageSize: () => `storage_size + ${totalSizeInBytes}`,
                })
                .where("id = :id", { id: dataset.id })
                .execute();
        }

        this.logger.log(
            `[+] 创建了 ${fileIds.length} 个文档记录，总存储空间: ${totalSizeInBytes} 字节`,
        );
    }

    /**
     * 异步分段并启动向量化队列
     */
    private async processDatasetFilesAsync(
        dataset: Datasets,
        indexingConfig: IndexingSegmentsDto,
        user: UserPlayground,
    ): Promise<void> {
        try {
            this.logger.log(`[+] 异步处理文件: ${dataset.id}`);

            // 检查是否有文件需要处理
            if (!indexingConfig.fileIds?.length) {
                this.logger.log(`[+] 知识库没有文件: ${dataset.id}`);
                return;
            }

            const segmentsResult = await this.indexingService.indexingSegments(indexingConfig);

            if (segmentsResult.fileResults?.length) {
                await this.updateDocumentsAndChunks(dataset, segmentsResult.fileResults, user);
                await this.queueService.addVectorizationJob("dataset", { datasetId: dataset.id });
                this.logger.log(`[+] 向量化任务已加入队列`);
            } else {
                this.logger.log(`[+] 文件处理完成但没有有效分段: ${dataset.id}`);
            }
        } catch (err) {
            this.logger.error(`[!] 异步处理失败: ${err.message}`, err.stack);

            try {
                await this.documentRepository.update(
                    {
                        datasetId: dataset.id,
                        fileId: In(indexingConfig.fileIds || []),
                    },
                    {
                        enabled: false,
                        progress: 0,
                        status: PROCESSING_STATUS.FAILED,
                        error: err.message?.toString() || "文件处理失败",
                    },
                );
                this.logger.warn(`[!] 已批量标记相关文档为失败，datasetId=${dataset.id}`);
            } catch (updateErr) {
                this.logger.error(`[!] 批量更新文档失败: ${updateErr.message}`, updateErr.stack);
            }
        }
    }

    /**
     * 更新文档与分段块
     */
    private async updateDocumentsAndChunks(
        dataset: Datasets,
        fileResults: FileSegmentResultDto[],
        user: UserPlayground,
    ) {
        for (const file of fileResults) {
            const doc = await this.documentRepository.findOne({
                where: { datasetId: dataset.id, fileId: file.fileId },
            });
            if (!doc) {
                this.logger.warn(`[!] 文档未找到: ${file.fileId}`);
                continue;
            }

            // 计算所有分段的字符总数
            const totalCharacterCount = file.segments.reduce((total, segment) => {
                return total + segment.content.length;
            }, 0);

            await this.documentRepository.update(doc.id, {
                chunkCount: file.segmentCount,
                characterCount: totalCharacterCount,
            });

            // 获取文件详细信息（包含原始名、大小、类型、存储路径等）
            const fileInfo = await this.uploadService.getFileById(doc.fileId);

            // 构建分段元数据
            const segmentMetadata = {
                fileId: doc.fileId,
                fileName: doc.fileName,
                fileType: doc.fileType,
                fileSize: doc.fileSize,
                filePath: fileInfo?.path || "",
                fileUrl: fileInfo?.url || "",
                extension: fileInfo?.extension || "",
                mimeType: fileInfo?.mimeType || "",
                storageName: fileInfo?.storageName || "",
            };

            const segments = file.segments.map((seg) => ({
                datasetId: dataset.id,
                documentId: doc.id,
                content: seg.content,
                chunkIndex: seg.index,
                contentLength: seg.length,
                children: "children" in seg ? seg.children.map((c) => c.content) : undefined,
                metadata: segmentMetadata,
                embeddingModelId: dataset.embeddingModelId,
                status: PROCESSING_STATUS.PENDING,
                createdBy: user.id,
            }));

            await this.segmentsRepository.save(segments);
            await this.datasetsRepository.increment(
                { id: dataset.id },
                "chunkCount",
                file.segmentCount,
            );

            this.logger.log(
                `[+] 文档 ${doc.fileName} 更新完成: ${file.segmentCount} 个分段, ${totalCharacterCount} 字符`,
            );
        }
    }

    /**
     * 重试所有失败文档向量化
     */
    async retryDataset(datasetId: string): Promise<{ success: boolean }> {
        const docs = await this.documentRepository.find({ where: { datasetId }, select: ["id"] });
        if (!docs.length) return { success: false };

        let retried = false;
        for (const doc of docs) {
            const res = await this.documentsService.retryDocument(doc.id);
            if (res.success) retried = true;
        }

        return { success: retried };
    }

    /**
     * 分页查询知识库列表
     */
    async list(dto: QueryDatasetDto, userId?: string) {
        const memberIds = await this.datasetMemberService.getUserMemberDatasetIds(userId);
        const qb = this.datasetsRepository.createQueryBuilder("dataset");

        if (userId) {
            qb.where("dataset.createdBy = :userId", { userId });
        }

        if (memberIds.length) {
            qb.orWhere("dataset.id IN (:...memberIds)", { memberIds });
        }

        if (dto.keyword) {
            qb.andWhere("(dataset.name ILIKE :kw OR dataset.description ILIKE :kw)", {
                kw: `%${dto.keyword}%`,
            });
        }

        if (dto.showAll) {
            qb.andWhere("dataset.createdBy = :userId", { userId });
        }

        if (dto.status) {
            qb.andWhere("dataset.status = :status", {
                status: dto.status,
            });
        }

        if (dto.startTime && dto.endTime) {
            qb.andWhere("dataset.createdAt BETWEEN :startTime AND :endTime", {
                startTime: dto.startTime,
                endTime: dto.endTime,
            });
        }

        qb.orderBy("dataset.createdAt", "DESC");

        const result = await this.paginateQueryBuilder(qb, dto);

        this.logger.log(`查询结果: 总=${result.items.length}`);

        return result;
    }

    /**
     * 删除知识库
     */
    async deleteDataset(id: string): Promise<{ success: boolean }> {
        const dataset = await this.findOneById(id);
        if (!dataset) throw HttpExceptionFactory.notFound("知识库不存在");

        // 删除前校验：若有智能体关联该知识库，则不允许删除
        try {
            const relatedAgentCount = await this.agentRepository
                .createQueryBuilder("agent")
                .where(":id = ANY(string_to_array(agent.datasetIds, ','))", { id })
                .getCount();
            if (relatedAgentCount > 0) {
                throw HttpExceptionFactory.badRequest(
                    `该知识库已被 ${relatedAgentCount} 个应用关联，无法删除，请先在相关应用中移除该知识库`,
                );
            }
        } catch (err) {
            // 如果是抛出的业务异常，直接向上抛出；否则转换为内部错误
            if (err?.status && err?.response) {
                throw err;
            }
            this.logger.error(`[!] 删除前校验失败: ${err?.message || err}`);
            throw HttpExceptionFactory.internal("删除前校验失败");
        }

        try {
            await this.segmentsRepository.delete({ datasetId: id });
            await this.documentRepository.delete({ datasetId: id });
            await this.delete(id);
            return { success: true };
        } catch (err) {
            this.logger.error(`删除失败: ${err.message}`, err.stack);
            throw HttpExceptionFactory.internal(`删除失败: ${err.message}`);
        }
    }

    /**
     * 获取知识库详情并校验访问权限
     */
    async getDatasetById(id: string, userId: string): Promise<Datasets> {
        const dataset = await this.findOneById(id);
        if (!dataset) throw HttpExceptionFactory.notFound("知识库不存在");

        if (dataset.createdBy !== userId) {
            const isMember = await this.datasetMemberService.isDatasetMember(id, userId);
            if (!isMember) throw HttpExceptionFactory.notFound("知识库不存在或无权限访问");
        }

        // 统计引用该知识库的智能体数量
        try {
            const relatedAgentCount = await this.agentRepository
                .createQueryBuilder("agent")
                .where(":id = ANY(string_to_array(agent.datasetIds, ','))", { id })
                .getCount();
            (dataset as Datasets).relatedAgentCount = relatedAgentCount;
        } catch (err) {
            this.logger.warn(`[知识库详情] 统计关联智能体数量失败: ${err?.message || err}`);
        }

        return dataset as Datasets;
    }
}
