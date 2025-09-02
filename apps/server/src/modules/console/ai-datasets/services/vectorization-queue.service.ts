import { getProviderKeyConfig } from "@common/utils/helper.util";
import { KeyConfigService } from "@modules/console/key-manager/services/key-config.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { AiModelService } from "@/modules/console/ai/services/ai-model.service";

import { PROCESSING_STATUS } from "../constants/datasets.constants";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsDocument } from "../entities/datasets-document.entity";
import { DatasetsSegments } from "../entities/datasets-segments.entity";

/**
 * 向量化队列服务
 * 统一处理所有向量化任务，简化状态管理
 */
@Injectable()
export class VectorizationQueueService {
    private readonly logger = new Logger(VectorizationQueueService.name);
    private readonly BATCH_SIZE = 10;

    constructor(
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        @InjectRepository(DatasetsDocument)
        private readonly documentRepository: Repository<DatasetsDocument>,
        private readonly aiModelService: AiModelService,
        private readonly keyConfigService: KeyConfigService,
    ) {}

    /**
     * 统一处理向量化任务
     */
    async processVectorization(
        type: "dataset" | "document",
        params: { datasetId: string; documentId?: string },
        job: any,
    ): Promise<void> {
        const { datasetId, documentId } = params;
        const taskId = documentId || datasetId;
        const taskType = type === "dataset" ? "知识库" : "文档";

        this.logger.log(`开始处理${taskType}向量化: ${taskId}`);

        try {
            await job.progress(10);

            // 获取向量模型配置
            const embeddingModel = await this.getEmbeddingModel(datasetId);
            await job.progress(20);

            // 创建向量生成器
            const generator = await this.createEmbeddingGenerator(embeddingModel);
            await job.progress(30);

            // 获取待处理分段
            const segments = await this.getPendingSegments(datasetId, documentId);
            if (segments.length === 0) {
                this.logger.log(`${taskType} ${taskId} 没有待处理的分段`);
                await job.progress(100);
                return;
            }

            await job.progress(40);

            // 批量处理向量化
            await this.processBatchVectorization(segments, generator, embeddingModel.model, job);

            // 向量化完成后更新文档状态
            await this.updateDocumentStatus(datasetId, documentId);

            this.logger.log(`${taskType}向量化完成: ${taskId}`);
        } catch (error) {
            this.logger.error(`${taskType}向量化失败: ${error.message}`, error.stack);

            await this.markSegmentsAsFailed(datasetId, documentId, error.message);

            await this.updateDocumentStatus(datasetId, documentId, error.message);

            throw error;
        }
    }

    /**
     * 获取向量模型配置
     */
    private async getEmbeddingModel(datasetId: string) {
        const dataset = await this.datasetsRepository.findOne({
            where: { id: datasetId },
        });

        if (!dataset) {
            throw new Error(`知识库不存在: ${datasetId}`);
        }

        const embeddingModel = await this.aiModelService.findOne({
            where: { id: dataset.embeddingModelId, isActive: true },
            relations: ["provider"],
        });

        if (!embeddingModel) {
            throw new Error("未找到可用的向量模型");
        }

        return embeddingModel;
    }

    /**
     * 创建向量生成器
     */
    private async createEmbeddingGenerator(embeddingModel: any) {
        const { embeddingGenerator } = await import("@sdk/ai/core/embedding");
        const { getProvider } = await import("@sdk/ai/utils/get-provider");

        const providerKeyConfig = await this.keyConfigService.getConfigKeyValuePairs(
            embeddingModel.provider.bindKeyConfigId,
        );
        const adapter = getProvider(embeddingModel.provider.provider, {
            apiKey: getProviderKeyConfig("apiKey", providerKeyConfig),
            baseURL: getProviderKeyConfig("baseUrl", providerKeyConfig),
        });

        return embeddingGenerator(adapter);
    }

    /**
     * 获取待处理分段
     */
    private async getPendingSegments(datasetId: string, documentId?: string) {
        const where: any = {
            datasetId,
            status: PROCESSING_STATUS.PENDING,
        };

        if (documentId) {
            where.documentId = documentId;
        }

        return await this.segmentsRepository.find({
            where,
            order: { chunkIndex: "ASC" },
        });
    }

    /**
     * 批量处理向量化
     */
    private async processBatchVectorization(
        segments: DatasetsSegments[],
        generator: any,
        modelId: string,
        job: any,
    ): Promise<void> {
        const totalSegments = segments.length;
        let processedCount = 0;

        // 获取模型配置，判断是否支持批量处理
        const modelConfig = await this.getModelConfig(modelId);
        const maxChunks = modelConfig?.max_chunks || this.BATCH_SIZE;
        const batchSize = Math.min(maxChunks, this.BATCH_SIZE);

        for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);

            try {
                // 标记为处理中
                await this.segmentsRepository.update(
                    { id: In(batch.map((s) => s.id)) },
                    { status: PROCESSING_STATUS.PROCESSING },
                );

                let response;
                if (maxChunks === 1) {
                    // 单文本模型需要逐个处理
                    const segment = batch[0];
                    response = await generator.embeddings.create({
                        input: [segment.content],
                        model: modelId,
                    });
                } else {
                    // 支持批量处理的模型
                    const texts = batch.map((segment) => segment.content);
                    response = await generator.embeddings.create({
                        input: texts,
                        model: modelId,
                    });
                }

                // 更新向量数据
                const updatePromises = batch.map((segment, index) => {
                    const embedding = response.data[index].embedding;
                    return this.segmentsRepository.update(segment.id, {
                        embedding,
                        vectorDimension: embedding.length,
                        embeddingModelId: modelId,
                        status: PROCESSING_STATUS.COMPLETED,
                        error: null,
                    });
                });

                await Promise.all(updatePromises);
                processedCount += batch.length;

                // 批量更新文档状态
                await this.batchUpdateDocumentStatus(batch);

                // 更新进度
                const progress = 40 + Math.floor((processedCount / totalSegments) * 50);
                await job.progress(progress);

                this.logger.log(
                    `批量向量化完成: ${batch.length} 个分段 (${processedCount}/${totalSegments})`,
                );
            } catch (error) {
                // 标记失败
                await this.segmentsRepository.update(
                    { id: In(batch.map((s) => s.id)) },
                    { status: PROCESSING_STATUS.FAILED, error: error.message },
                );
                this.logger.error(`批量向量化失败: ${error.message}`, error.stack);
            }
        }

        await job.progress(90);
    }

    /**
     * 批量更新文档状态
     */
    private async batchUpdateDocumentStatus(batch: DatasetsSegments[]): Promise<void> {
        // 获取本批次涉及的文档ID
        const documentIds = [...new Set(batch.map((s) => s.documentId))];
        if (documentIds.length === 0) return;

        // 批量查询所有相关文档的分段状态
        const allSegments = await this.segmentsRepository.find({
            where: { documentId: In(documentIds) },
            select: ["documentId", "status", "error"],
        });

        // 按文档ID分组统计状态
        const documentStats = new Map<
            string,
            {
                completed: number;
                failed: number;
                pending: number;
                processing: number;
                total: number;
            }
        >();

        allSegments.forEach((segment) => {
            if (!documentStats.has(segment.documentId)) {
                documentStats.set(segment.documentId, {
                    completed: 0,
                    failed: 0,
                    pending: 0,
                    processing: 0,
                    total: 0,
                });
            }
            const stats = documentStats.get(segment.documentId)!;
            stats.total++;

            if (segment.status === PROCESSING_STATUS.COMPLETED) stats.completed++;
            if (segment.status === PROCESSING_STATUS.FAILED) stats.failed++;
            if (segment.status === PROCESSING_STATUS.PENDING) stats.pending++;
            if (segment.status === PROCESSING_STATUS.PROCESSING) stats.processing++;
        });

        // 批量更新文档状态
        const updatePromises = documentIds.map(async (docId) => {
            const stats = documentStats.get(docId);
            if (!stats) return;

            const { status, progress } = this.calculateDocumentStatus(stats);

            await this.documentRepository.update(docId, { status, progress });
            this.logger.log(`文档状态已更新: ${docId} -> ${status} (${progress}%)`);
        });

        await Promise.all(updatePromises);
    }

    /**
     * 计算文档状态和进度
     */
    private calculateDocumentStatus(stats: {
        completed: number;
        failed: number;
        pending: number;
        processing: number;
        total: number;
    }): { status: string; progress: number } {
        const { completed, failed, pending, processing, total } = stats;

        if (total === 0) {
            return { status: PROCESSING_STATUS.PENDING, progress: 0 };
        }
        if (pending > 0 || processing > 0) {
            return {
                status: PROCESSING_STATUS.PROCESSING,
                progress: Math.round((completed / total) * 100),
            };
        }
        if (failed === total) {
            return { status: PROCESSING_STATUS.FAILED, progress: 0 };
        }
        if (failed > 0 && completed > 0) {
            return {
                status: PROCESSING_STATUS.ERROR,
                progress: Math.round((completed / total) * 100),
            };
        }

        return { status: PROCESSING_STATUS.COMPLETED, progress: 100 };
    }

    /**
     * 重置向量化状态（用于重试）
     */
    async resetVectorizationStatus(datasetId: string, documentId?: string): Promise<void> {
        const where: any = {
            datasetId,
            status: PROCESSING_STATUS.FAILED,
        };
        if (documentId) where.documentId = documentId;

        await this.segmentsRepository.update(where, {
            status: PROCESSING_STATUS.PENDING,
            error: null,
        });

        await this.documentRepository.update(documentId, {
            error: "",
        });

        this.logger.log(`重置向量化状态: ${documentId || datasetId}`);
    }

    /**
     * 向量化失败后更新状态
     */
    private async markSegmentsAsFailed(
        datasetId: string,
        documentId: string | undefined,
        errorMessage: string,
    ): Promise<void> {
        const where: any = { datasetId };
        if (documentId) where.documentId = documentId;

        await this.segmentsRepository.update(
            {
                ...where,
                status: In([PROCESSING_STATUS.PENDING, PROCESSING_STATUS.PROCESSING]),
            },
            {
                status: PROCESSING_STATUS.FAILED,
                error: errorMessage,
            },
        );

        this.logger.log(`分段向量化失败: ${documentId || datasetId}`);
    }

    /**
     * 更新文档状态和进度
     */
    private async updateDocumentStatus(
        datasetId: string,
        documentId?: string,
        errorMessage?: string,
    ): Promise<void> {
        const documents = documentId
            ? await this.documentRepository.find({ where: { id: documentId } })
            : await this.documentRepository.find({ where: { datasetId } });

        for (const document of documents) {
            // 查询该文档下的所有分段状态
            const segments = await this.segmentsRepository.find({
                where: { documentId: document.id },
                select: ["status"],
            });

            // 统计各状态数量
            const stats = {
                completed: 0,
                failed: 0,
                pending: 0,
                processing: 0,
                total: segments.length,
            };
            segments.forEach((segment) => {
                if (segment.status === PROCESSING_STATUS.COMPLETED) stats.completed++;
                if (segment.status === PROCESSING_STATUS.FAILED) stats.failed++;
                if (segment.status === PROCESSING_STATUS.PENDING) stats.pending++;
                if (segment.status === PROCESSING_STATUS.PROCESSING) stats.processing++;
            });

            const { status, progress } = this.calculateDocumentStatus(stats);

            // 更新文档状态
            await this.documentRepository.update(document.id, {
                status,
                progress,
                error: errorMessage,
            });
            this.logger.log(`文档状态已更新: ${document.id} -> ${status} (${progress}%)`);
        }
    }

    /**
     * 获取模型配置信息
     * @param modelId 模型ID
     * @returns 模型配置信息
     */
    private async getModelConfig(modelId: string): Promise<{ max_chunks?: number } | null> {
        try {
            const model = await this.aiModelService.findOne({ where: { model: modelId } });
            if (!model) {
                this.logger.warn(`未找到模型配置: ${modelId}`);
                return null;
            }

            // 从模型配置中获取 max_chunks 信息
            const modelConfig = model.modelConfig || {};
            return {
                max_chunks: modelConfig.max_chunks,
            };
        } catch (error) {
            this.logger.error(`获取模型配置失败: ${modelId}`, error);
            return null;
        }
    }
}
