import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { embeddingGenerator } from "@sdk/ai/core/embedding";
import { rerankGenerator } from "@sdk/ai/core/rerank";
import { RerankParams } from "@sdk/ai/interfaces/adapter";
import { getProvider } from "@sdk/ai/utils/get-provider";
import { CreateEmbeddingResponse } from "openai/resources/embeddings";
import { Repository } from "typeorm";

import { AiModelService } from "@/modules/console/ai/services/ai-model.service";

import {
    PROCESSING_STATUS,
    RETRIEVAL_MODE,
    type RetrievalModeType,
} from "../constants/datasets.constants";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsSegments } from "../entities/datasets-segments.entity";
import {
    DbQueryResult,
    FullTextSearchResult,
    HybridSearchResult,
    QueryOptions,
    RerankConfig,
    RetrievalChunk,
    RetrievalConfig,
    RetrievalResult,
    VectorSearchResult,
    WeightConfig,
} from "../interfaces/retrieval-config.interface";

const RAG_SERVICE_CONSTANTS = {
    DEFAULT_TOP_K: 3,
    DEFAULT_SCORE_THRESHOLD: 0.5,
    DEFAULT_SEMANTIC_WEIGHT: 0.7,
    DEFAULT_KEYWORD_WEIGHT: 0.3,
} as const;

/**
 * 数据集检索服务
 * 专门负责处理知识库的检索逻辑
 */
@Injectable()
export class DatasetsRetrievalService {
    protected readonly logger = new Logger(DatasetsRetrievalService.name);

    constructor(
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        private readonly aiModelService: AiModelService,
    ) {}

    /**
     * 校验数据集存在且已完成训练
     */
    private async getAndCheckDataset(datasetId: string): Promise<Datasets> {
        const dataset = await this.datasetsRepository.findOne({ where: { id: datasetId } });
        if (!dataset) throw HttpExceptionFactory.notFound("知识库不存在");
        return dataset;
    }

    /**
     * 检索模式分发
     */
    private async dispatchRetrieval(
        mode: RetrievalModeType,
        datasetId: string,
        query: string,
        config: RetrievalConfig,
        options?: QueryOptions,
    ): Promise<RetrievalChunk[]> {
        switch (mode) {
            case RETRIEVAL_MODE.VECTOR:
                return (await this.performVectorSearch(datasetId, query, config, options)).chunks;
            case RETRIEVAL_MODE.FULL_TEXT:
                return (await this.performFullTextSearch(datasetId, query, config, options)).chunks;
            case RETRIEVAL_MODE.HYBRID:
                return (await this.performHybridSearch(datasetId, query, config, options)).chunks;
            default:
                throw HttpExceptionFactory.badRequest(`不支持的检索模式: ${mode}`);
        }
    }

    /**
     * 召回测试查询
     * 允许传入自定义的检索配置进行测试
     */
    async queryDatasetWithConfig(
        datasetId: string,
        query: string,
        customConfig?: RetrievalConfig,
    ): Promise<RetrievalResult> {
        const startTime = Date.now();
        const dataset = await this.getAndCheckDataset(datasetId);
        const config = customConfig || dataset.retrievalConfig!;
        const mode = customConfig?.retrievalMode || dataset.retrievalMode;
        const chunks = await this.dispatchRetrieval(mode, datasetId, query, config);
        return {
            chunks,
            totalTime: Date.now() - startTime,
        };
    }

    /**
     * 向量检索
     */
    private async performVectorSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
        options?: QueryOptions,
    ): Promise<VectorSearchResult> {
        const dataset = await this.datasetsRepository.findOne({ where: { id: datasetId } });
        if (!dataset) throw HttpExceptionFactory.internal("数据集不存在");
        const embeddingModel = await this.aiModelService.findOne({
            where: { id: dataset.embeddingModelId, isActive: true },
            relations: ["provider"],
        });
        if (!embeddingModel) throw HttpExceptionFactory.internal("未找到可用的向量模型");
        const adapter = getProvider(embeddingModel.provider.provider, {
            apiKey: embeddingModel.provider.apiKey,
            baseURL: embeddingModel.provider.baseUrl,
        });
        const generator = embeddingGenerator(adapter);
        const embeddingResponse: CreateEmbeddingResponse = await generator.embeddings.create({
            input: [query],
            model: embeddingModel.model,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;
        const topK = config.topK ?? RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;
        const scoreThreshold =
            config.scoreThreshold ?? RAG_SERVICE_CONSTANTS.DEFAULT_SCORE_THRESHOLD;
        // 更健壮的布尔判断，兼容字符串/数字
        const scoreThresholdEnabled = config.scoreThresholdEnabled;
        let dbResults: DbQueryResult[] = [];
        try {
            let queryBuilder = this.segmentsRepository
                .createQueryBuilder("segment")
                .leftJoin("segment.document", "document")
                .select([
                    "segment.id AS segment_id",
                    "segment.documentId AS document_id",
                    "segment.content AS segment_content",
                    "segment.metadata AS segment_metadata",
                    "segment.chunkIndex AS chunk_index",
                    "segment.contentLength AS content_length",
                    "document.fileName AS document_name",
                    "1 - (segment.embedding::vector <=> CAST(:queryEmbedding AS vector)) AS score",
                ])
                .where("segment.datasetId = :datasetId", { datasetId })
                .andWhere("segment.status = :status", { status: PROCESSING_STATUS.COMPLETED })
                .andWhere("segment.embedding IS NOT NULL")
                .andWhere("segment.enabled = :enabled", { enabled: 1 })
                .orderBy("score", "DESC")
                .limit(topK)
                .setParameter("queryEmbedding", JSON.stringify(queryEmbedding));
            if (scoreThresholdEnabled) {
                queryBuilder = queryBuilder.andWhere(
                    "(1 - (segment.embedding::vector <=> CAST(:queryEmbedding AS vector))) >= :scoreThreshold",
                    { scoreThreshold },
                );
            }
            dbResults = await queryBuilder.getRawMany();
        } catch (error) {
            this.logger.error("pgvector 向量检索失败", error);
            throw new Error("向量检索服务不可用，请确保 pgvector 扩展已正确安装");
        }
        let finalChunks: RetrievalChunk[] = dbResults.map((result: DbQueryResult) => ({
            id: result.segment_id || result.id,
            documentId: result.document_id,
            content: result.segment_content || result.content,
            score: result.score,
            metadata: result.segment_metadata,
            chunkIndex: result.chunk_index,
            contentLength: result.content_length,
            fileName: result.document_name,
        }));
        let rerankUsed = false;
        if (config.rerankConfig?.enabled && config.rerankConfig.modelId) {
            finalChunks = await this.performRerank(
                query,
                finalChunks,
                config.rerankConfig.modelId,
                topK,
                scoreThreshold,
                scoreThresholdEnabled,
            );
            rerankUsed = true;
        }
        return {
            chunks: finalChunks,
            info: { topK, scoreThreshold, rerankUsed },
        };
    }

    /**
     * 全文检索
     */
    private async performFullTextSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
        options?: QueryOptions,
    ): Promise<FullTextSearchResult> {
        const topK = config.topK ?? RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;
        const scoreThreshold =
            config.scoreThreshold ?? RAG_SERVICE_CONSTANTS.DEFAULT_SCORE_THRESHOLD;
        const scoreThresholdEnabled = config.scoreThresholdEnabled;
        let queryBuilder = this.segmentsRepository
            .createQueryBuilder("segment")
            .leftJoin("segment.document", "document")
            .select([
                "segment.id AS segment_id",
                "segment.documentId AS document_id",
                "segment.content AS segment_content",
                "segment.metadata AS segment_metadata",
                "segment.chunkIndex AS chunk_index",
                "segment.contentLength AS content_length",
                "document.fileName AS document_name",
                "ts_rank(to_tsvector('chinese_zh', coalesce(segment.content, '')), plainto_tsquery('chinese_zh', :query)) AS score",
            ])
            .where("segment.datasetId = :datasetId", { datasetId })
            .andWhere("segment.status = :status", { status: PROCESSING_STATUS.COMPLETED })
            .andWhere(
                "to_tsvector('chinese_zh', coalesce(segment.content, '')) @@ plainto_tsquery('chinese_zh', :query)",
                { query },
            )
            .andWhere("segment.enabled = :enabled", { enabled: 1 })
            .orderBy("score", "DESC")
            .limit(topK);
        if (scoreThresholdEnabled && config.retrievalMode !== "hybrid") {
            queryBuilder = queryBuilder.andWhere(
                "ts_rank_cd(to_tsvector('chinese_zh', content), plainto_tsquery('chinese_zh', :query)) >= :scoreThreshold",
                { query, scoreThreshold },
            );
        }
        const dbResults: DbQueryResult[] = await queryBuilder.getRawMany();
        let finalChunks: RetrievalChunk[] = dbResults.map((result: DbQueryResult) => ({
            id: result.segment_id,
            documentId: result.document_id,
            content: result.segment_content,
            score: result.score * 10,
            metadata: result.segment_metadata,
            chunkIndex: result.chunk_index,
            contentLength: result.content_length,
            fileName: result.document_name,
        }));
        let rerankUsed = false;
        if (config.rerankConfig?.enabled && config.rerankConfig.modelId) {
            finalChunks = await this.performRerank(
                query,
                finalChunks,
                config.rerankConfig.modelId,
                topK,
                scoreThreshold,
                scoreThresholdEnabled,
            );
            rerankUsed = true;
        }
        return {
            chunks: finalChunks,
            info: { topK, scoreThreshold, rerankUsed },
        };
    }

    /**
     * 执行混合检索
     */
    private async performHybridSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
        options?: QueryOptions,
    ): Promise<HybridSearchResult> {
        const strategy = config.strategy || "weighted_score";

        if (strategy === "weighted_score") {
            return await this.performWeightedHybridSearch(
                datasetId,
                query,
                config.weightConfig!,
                options,
                config,
            );
        } else if (strategy === "rerank") {
            return await this.performRerankHybridSearch(
                datasetId,
                query,
                config.rerankConfig!,
                options,
                config,
            );
        } else {
            throw HttpExceptionFactory.badRequest(`不支持的混合检索策略: ${strategy}`);
        }
    }

    /**
     * 执行权重混合检索
     */
    private async performWeightedHybridSearch(
        datasetId: string,
        query: string,
        weightConfig: WeightConfig,
        options?: QueryOptions,
        config?: RetrievalConfig,
    ): Promise<HybridSearchResult> {
        const semanticWeight =
            weightConfig.semanticWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_SEMANTIC_WEIGHT;
        const keywordWeight =
            weightConfig.keywordWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_KEYWORD_WEIGHT;
        // 统一从 config 读取 topK
        const topK = options?.topK ?? config?.topK ?? RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;

        // 并行执行向量检索和全文检索
        const searchConfig: RetrievalConfig = {
            retrievalMode: RETRIEVAL_MODE.HYBRID,
            topK: topK * 2,
            weightConfig: { semanticWeight, keywordWeight },
        };

        const [vectorResult, fullTextResult] = await Promise.all([
            this.performVectorSearch(datasetId, query, searchConfig),
            this.performFullTextSearch(datasetId, query, searchConfig),
        ]);

        // 加权融合，权重始终生效
        const combinedChunks = new Map<
            string,
            RetrievalChunk & { _vectorScore: number; _fullTextScore: number }
        >();

        console.log("vectorResult.chunks", vectorResult.chunks);
        console.log("fullTextResult.chunks", fullTextResult.chunks);
        vectorResult.chunks.forEach((chunk) => {
            combinedChunks.set(chunk.id, {
                ...chunk,
                _vectorScore: chunk.score,
                _fullTextScore: 0,
                sources: ["vector"],
            });
        });
        fullTextResult.chunks.forEach((chunk) => {
            if (combinedChunks.has(chunk.id)) {
                const existing = combinedChunks.get(chunk.id)!;
                existing._fullTextScore = chunk.score;
                existing.sources = [...(existing.sources || []), "fulltext"];
            } else {
                combinedChunks.set(chunk.id, {
                    ...chunk,
                    _vectorScore: 0,
                    _fullTextScore: chunk.score,
                    sources: ["fulltext"],
                });
            }
        });

        // 纯加权融合，体验和 dify 完全一致
        const finalChunks = Array.from(combinedChunks.values())
            .map((chunk) => {
                const score =
                    chunk._vectorScore * semanticWeight + chunk._fullTextScore * keywordWeight;
                console.log({
                    id: chunk.id,
                    content: chunk.content,
                    vectorScore: chunk._vectorScore,
                    fullTextScore: chunk._fullTextScore,
                    semanticWeight,
                    keywordWeight,
                    finalScore: score,
                });
                return {
                    ...chunk,
                    score,
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(({ _vectorScore, _fullTextScore, ...rest }) => rest);

        return {
            chunks: finalChunks,
            info: {
                strategy: "weighted_score",
                semanticWeight,
                keywordWeight,
                topK,
            },
        };
    }

    /**
     * 执行Rerank混合检索
     */
    private async performRerankHybridSearch(
        datasetId: string,
        query: string,
        rerankConfig: RerankConfig,
        options?: QueryOptions,
        config?: RetrievalConfig,
    ): Promise<HybridSearchResult> {
        const topK = options?.topK ?? config?.topK ?? RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;
        const scoreThreshold =
            options?.scoreThreshold ??
            config?.scoreThreshold ??
            RAG_SERVICE_CONSTANTS.DEFAULT_SCORE_THRESHOLD;
        const scoreThresholdEnabled = config?.scoreThresholdEnabled;

        // 并行执行向量检索和全文检索，获取更多候选
        const searchConfig: RetrievalConfig = {
            retrievalMode: RETRIEVAL_MODE.HYBRID,
            topK: topK * 2,
            scoreThreshold,
            scoreThresholdEnabled,
            weightConfig: config?.weightConfig,
            rerankConfig,
        };

        const [vectorResult, fullTextResult] = await Promise.all([
            this.performVectorSearch(datasetId, query, searchConfig),
            this.performFullTextSearch(datasetId, query, searchConfig),
        ]);

        // 合并去重
        const candidateChunks = new Map<string, RetrievalChunk>();
        [...vectorResult.chunks, ...fullTextResult.chunks].forEach((chunk) => {
            if (!candidateChunks.has(chunk.id)) {
                candidateChunks.set(chunk.id, {
                    ...chunk,
                    chunkIndex: chunk.chunkIndex,
                    contentLength: chunk.contentLength,
                    fileName: chunk.fileName,
                });
            }
        });

        const candidates = Array.from(candidateChunks.values());

        // 使用Rerank模型重排序
        const finalChunks = await this.performRerank(
            query,
            candidates,
            rerankConfig.modelId!,
            topK,
            scoreThreshold,
            config?.scoreThresholdEnabled ?? true,
        );

        return {
            chunks: finalChunks,
            info: {
                strategy: "rerank",
                topK,
                scoreThreshold,
                rerankUsed: true,
            },
        };
    }

    /**
     * 执行Rerank重排序
     */
    private async performRerank(
        query: string,
        chunks: RetrievalChunk[],
        rerankModelId: string,
        topK: number,
        scoreThreshold: number,
        scoreThresholdEnabled: boolean = true,
    ): Promise<RetrievalChunk[]> {
        // 获取Rerank模型配置
        const rerankModel = await this.aiModelService.findOne({
            where: { id: rerankModelId, isActive: true },
            relations: ["provider"],
        });

        if (!rerankModel) {
            this.logger.warn("Rerank模型不可用，跳过重排序");
            return chunks.slice(0, topK);
        }

        try {
            // 创建Rerank适配器
            const adapter = getProvider(rerankModel.provider.provider, {
                apiKey: rerankModel.provider.apiKey,
                baseURL: rerankModel.provider.baseUrl,
            });

            const generator = rerankGenerator(adapter);
            const rerankParams: RerankParams = {
                model: rerankModel.model,
                query,
                documents: chunks.map((chunk) => chunk.content),
                top_n: topK,
            };

            const rerankResponse = await generator.rerank.create(rerankParams);

            // 映射重排序结果并排序
            const rerankedChunks = rerankResponse.results
                .filter(
                    (result) => !scoreThresholdEnabled || result.relevance_score >= scoreThreshold,
                )
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .map((result) => ({
                    ...chunks[result.index],
                    relevanceScore: result.relevance_score,
                }));

            return rerankedChunks;
        } catch (error) {
            this.logger.error(`Rerank重排序失败: ${error.message}`);
            // 如果Rerank失败，返回原始结果
            return chunks
                .filter((chunk) => !scoreThresholdEnabled || chunk.score >= scoreThreshold)
                .slice(0, topK);
        }
    }
}
