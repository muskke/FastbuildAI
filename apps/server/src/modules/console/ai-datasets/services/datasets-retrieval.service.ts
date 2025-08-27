import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Jieba } from "@node-rs/jieba";
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
    // 全文检索分数标准化因子
    FULLTEXT_SCORE_MULTIPLIER: 100,
    // 向量检索分数标准化因子 (cosine similarity 已在 0-1 范围)
    VECTOR_SCORE_MULTIPLIER: 1,
} as const;

/**
 * Dataset retrieval service for handling knowledge base queries
 */
@Injectable()
export class DatasetsRetrievalService {
    private readonly logger = new Logger(DatasetsRetrievalService.name);

    constructor(
        @InjectRepository(Datasets)
        private readonly datasetsRepository: Repository<Datasets>,
        @InjectRepository(DatasetsSegments)
        private readonly segmentsRepository: Repository<DatasetsSegments>,
        private readonly aiModelService: AiModelService,
    ) {}

    /**
     * Validates dataset existence and readiness
     */
    private async validateDataset(datasetId: string): Promise<Datasets> {
        const dataset = await this.datasetsRepository.findOne({ where: { id: datasetId } });
        if (!dataset) {
            throw HttpExceptionFactory.notFound("知识库不存在");
        }
        return dataset;
    }

    /**
     * Maps database query results to RetrievalChunk format
     */
    private mapDbResultsToChunks(results: DbQueryResult[], scoreMultiplier = 1): RetrievalChunk[] {
        return results.map((result) => ({
            id: result.segment_id || result.id,
            documentId: result.document_id,
            content: result.segment_content || result.content,
            score: result.score * scoreMultiplier,
            metadata: result.segment_metadata,
            chunkIndex: result.chunk_index,
            contentLength: result.content_length,
            fileName: result.document_name,
        }));
    }

    /**
     * 使用 jieba 中文分词进行查询优化，提升全文检索效果
     */
    private jiebaSegment(query: string): string {
        try {
            const jieba = new Jieba();
            // 使用全模式，更好识别词组如"黄彪"
            return jieba.cut(query, true).join(" ");
        } catch (error) {
            this.logger.warn(`jieba分词失败: ${error.message}`);
            return query;
        }
    }

    /**
     * Builds base query for segments with common conditions
     */
    private buildBaseQuery(datasetId: string) {
        return this.segmentsRepository
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
            ])
            .where("segment.datasetId = :datasetId", { datasetId })
            .andWhere("segment.status = :status", { status: PROCESSING_STATUS.COMPLETED })
            .andWhere("segment.enabled = :enabled", { enabled: 1 });
    }

    /**
     * Queries dataset with specified or default configuration
     */
    async queryDatasetWithConfig(
        datasetId: string,
        query: string,
        customConfig?: RetrievalConfig,
    ): Promise<RetrievalResult> {
        const startTime = Date.now();

        const dataset = await this.validateDataset(datasetId);
        const config = customConfig || dataset.retrievalConfig;
        const mode = customConfig?.retrievalMode || dataset.retrievalMode;
        const topK = config!.topK || RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;

        this.logger.debug(`[检索服务] 检索模式: ${mode}`);
        this.logger.debug(`[检索服务] 最终配置: ${JSON.stringify({ ...config, topK })}`);

        const chunks = await this.dispatchRetrieval(mode, datasetId, query, { ...config, topK });

        const totalTime = Date.now() - startTime;
        return {
            chunks,
            totalTime,
        };
    }

    /**
     * Dispatches retrieval based on mode
     */
    private async dispatchRetrieval(
        mode: RetrievalModeType,
        datasetId: string,
        query: string,
        config: RetrievalConfig,
    ): Promise<RetrievalChunk[]> {
        try {
            switch (mode) {
                case RETRIEVAL_MODE.VECTOR:
                    return (await this.performVectorSearch(datasetId, query, config)).chunks;
                case RETRIEVAL_MODE.FULL_TEXT:
                    return (await this.performFullTextSearch(datasetId, query, config)).chunks;
                case RETRIEVAL_MODE.HYBRID:
                    return (await this.performHybridSearch(datasetId, query, config)).chunks;
                default:
                    throw HttpExceptionFactory.badRequest(`不支持的检索模式: ${mode}`);
            }
        } catch (error) {
            this.logger.error(`检索失败 [模式: ${mode}]: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Performs vector search using embeddings
     */
    private async performVectorSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
    ): Promise<VectorSearchResult> {
        const { topK, scoreThreshold, scoreThresholdEnabled, rerankConfig } =
            this.normalizeConfig(config);

        const dataset = await this.validateDataset(datasetId);
        const embeddingModel = await this.getEmbeddingModel(dataset.embeddingModelId);
        const queryEmbedding = await this.generateEmbedding(query, embeddingModel);

        let queryBuilder = this.buildBaseQuery(datasetId)
            .addSelect(
                "1 - (segment.embedding::vector <=> CAST(:queryEmbedding AS vector)) AS score",
            )
            .andWhere("segment.embedding IS NOT NULL")
            .orderBy("score", "DESC")
            .limit(topK)
            .setParameter("queryEmbedding", JSON.stringify(queryEmbedding));

        if (scoreThresholdEnabled) {
            queryBuilder = queryBuilder.andWhere(
                "(1 - (segment.embedding::vector <=> CAST(:queryEmbedding AS vector))) >= :scoreThreshold",
                { scoreThreshold },
            );
        }

        let dbResults: DbQueryResult[];
        try {
            dbResults = await queryBuilder.getRawMany();
        } catch (error) {
            this.logger.error("向量检索失败", error);
            throw new Error("向量检索服务不可用，请确保 pgvector 扩展已正确安装");
        }

        let chunks = this.mapDbResultsToChunks(
            dbResults,
            RAG_SERVICE_CONSTANTS.VECTOR_SCORE_MULTIPLIER,
        );
        const rerankUsed = rerankConfig?.enabled && rerankConfig.modelId;

        if (rerankUsed) {
            chunks = await this.performRerank(
                query,
                chunks,
                rerankConfig.modelId,
                topK,
                scoreThreshold,
                scoreThresholdEnabled,
            );
        }

        return {
            chunks,
            info: { topK, scoreThreshold, rerankUsed: !!rerankUsed },
        };
    }

    /**
     * Performs full-text search using PostgreSQL text search
     */
    private async performFullTextSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
    ): Promise<FullTextSearchResult> {
        const topK = config.topK || RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;

        // jieba分词
        const keyword = this.jiebaSegment(query);
        const queries = this.preprocessQuerySimple(keyword);

        this.logger.debug(`[全文检索] "${query}" -> "${queries}"`);

        const sql = `
            SELECT 
                segment.id AS segment_id,
                segment.document_id AS document_id,
                segment.content AS segment_content,
                segment.metadata AS segment_metadata,
                segment.chunk_index AS chunk_index,
                segment.content_length AS content_length,
                document.file_name AS document_name,
                ts_rank(to_tsvector('chinese_zh', coalesce(segment.content, '')), to_tsquery('chinese_zh', $3)) AS score
            FROM fb_datasets_segments segment
            LEFT JOIN fb_datasets_documents document ON document.id = segment.document_id
            WHERE segment.dataset_id = $1 
                AND segment.status = $2
                AND segment.enabled = 1
                AND to_tsvector('chinese_zh', coalesce(segment.content, '')) @@ to_tsquery('chinese_zh', $3)
            ORDER BY score DESC
            LIMIT ${topK}
        `;

        const dbResults = await this.segmentsRepository.query(sql, [
            datasetId,
            "completed",
            queries,
        ]);

        this.logger.debug(`[全文检索] 查询结果: ${dbResults.length}条`);

        const chunks = this.mapDbResultsToChunks(
            dbResults,
            RAG_SERVICE_CONSTANTS.FULLTEXT_SCORE_MULTIPLIER,
        );

        return {
            chunks,
            info: { topK, rerankUsed: false },
        };
    }

    private preprocessQuerySimple(keyword: string): string {
        // 简单预处理：过滤有效词汇，用&连接
        const tokens = keyword
            .split(" ")
            .filter((token) => token.length >= 2 && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(token))
            .slice(0, 3);

        return tokens.join(" & ") || keyword;
    }

    /**
     * Performs hybrid search with weighted or rerank strategy
     */
    private async performHybridSearch(
        datasetId: string,
        query: string,
        config: RetrievalConfig,
    ): Promise<HybridSearchResult> {
        const strategy = config.strategy || "weighted_score";
        const topK = config.topK || RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K;
        // 获取更多候选项用于混合搜索，但确保最终结果数量正确
        const candidateConfig = { ...config, topK: Math.max(topK * 2, 10) };

        if (strategy === "weighted_score") {
            return this.performWeightedHybridSearch(
                datasetId,
                query,
                config.weightConfig,
                candidateConfig,
                topK,
            );
        } else if (strategy === "rerank") {
            return this.performRerankHybridSearch(
                datasetId,
                query,
                config.rerankConfig,
                candidateConfig,
                topK,
            );
        } else {
            throw HttpExceptionFactory.badRequest(`不支持的混合检索策略: ${strategy}`);
        }
    }

    /**
     * Performs weighted hybrid search
     */
    private async performWeightedHybridSearch(
        datasetId: string,
        query: string,
        weightConfig: WeightConfig | undefined,
        candidateConfig: RetrievalConfig,
        finalTopK: number,
    ): Promise<HybridSearchResult> {
        const semanticWeight =
            weightConfig?.semanticWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_SEMANTIC_WEIGHT;
        const keywordWeight =
            weightConfig?.keywordWeight ?? RAG_SERVICE_CONSTANTS.DEFAULT_KEYWORD_WEIGHT;

        // 确保权重之和为1，如果不是则标准化
        const totalWeight = semanticWeight + keywordWeight;
        const normalizedSemanticWeight = semanticWeight / totalWeight;
        const normalizedKeywordWeight = keywordWeight / totalWeight;

        const [vectorResult, fullTextResult] = await Promise.all([
            this.performVectorSearch(datasetId, query, candidateConfig),
            this.performFullTextSearch(datasetId, query, candidateConfig),
        ]);

        // 计算分数范围用于标准化
        const vectorScores = vectorResult.chunks.map((c) => c.score);
        const fullTextScores = fullTextResult.chunks.map((c) => c.score);

        const vectorMax = Math.max(...vectorScores, 0.01);
        const fullTextMax = Math.max(...fullTextScores, 0.01);

        const combinedChunks = new Map<
            string,
            RetrievalChunk & { _normalizedVectorScore: number; _normalizedFullTextScore: number }
        >();

        // 添加向量搜索结果（标准化分数）
        vectorResult.chunks.forEach((chunk) => {
            combinedChunks.set(chunk.id, {
                ...chunk,
                _normalizedVectorScore: chunk.score / vectorMax,
                _normalizedFullTextScore: 0,
            });
        });

        // 添加全文搜索结果（标准化分数）
        fullTextResult.chunks.forEach((chunk) => {
            const normalizedScore = chunk.score / fullTextMax;
            if (combinedChunks.has(chunk.id)) {
                const existing = combinedChunks.get(chunk.id)!;
                existing._normalizedFullTextScore = normalizedScore;
            } else {
                combinedChunks.set(chunk.id, {
                    ...chunk,
                    _normalizedVectorScore: 0,
                    _normalizedFullTextScore: normalizedScore,
                });
            }
        });

        // 计算加权分数并排序
        const finalChunks = Array.from(combinedChunks.values())
            .map((chunk) => ({
                ...chunk,
                score:
                    chunk._normalizedVectorScore * normalizedSemanticWeight +
                    chunk._normalizedFullTextScore * normalizedKeywordWeight,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, finalTopK)
            .map(({ _normalizedVectorScore, _normalizedFullTextScore, ...rest }) => rest);

        return {
            chunks: finalChunks,
            info: {
                strategy: "weighted_score",
                semanticWeight: normalizedSemanticWeight,
                keywordWeight: normalizedKeywordWeight,
                topK: finalTopK,
            },
        };
    }

    /**
     * Performs rerank-based hybrid search
     */
    private async performRerankHybridSearch(
        datasetId: string,
        query: string,
        rerankConfig: RerankConfig | undefined,
        candidateConfig: RetrievalConfig,
        finalTopK: number,
    ): Promise<HybridSearchResult> {
        const { scoreThreshold, scoreThresholdEnabled } = this.normalizeConfig(candidateConfig);

        const [vectorResult, fullTextResult] = await Promise.all([
            this.performVectorSearch(datasetId, query, candidateConfig),
            this.performFullTextSearch(datasetId, query, candidateConfig),
        ]);

        // 去重合并候选结果，保留最高分数
        const candidateChunks = new Map<string, RetrievalChunk>();
        [...vectorResult.chunks, ...fullTextResult.chunks].forEach((chunk) => {
            const existing = candidateChunks.get(chunk.id);
            if (!existing || chunk.score > existing.score) {
                candidateChunks.set(chunk.id, chunk);
            }
        });

        const candidates = Array.from(candidateChunks.values());
        const finalChunks =
            rerankConfig?.enabled && rerankConfig.modelId
                ? await this.performRerank(
                      query,
                      candidates,
                      rerankConfig.modelId,
                      finalTopK,
                      scoreThreshold,
                      scoreThresholdEnabled,
                  )
                : candidates
                      .filter((chunk) => !scoreThresholdEnabled || chunk.score >= scoreThreshold)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, finalTopK); // 确保返回正确数量

        return {
            chunks: finalChunks,
            info: {
                strategy: "rerank",
                topK: finalTopK,
                scoreThreshold,
                rerankUsed: !!rerankConfig?.enabled,
            },
        };
    }

    /**
     * Performs reranking of chunks
     */
    private async performRerank(
        query: string,
        chunks: RetrievalChunk[],
        rerankModelId: string,
        topK: number,
        scoreThreshold: number,
        scoreThresholdEnabled: boolean,
    ): Promise<RetrievalChunk[]> {
        const rerankModel = await this.aiModelService.findOne({
            where: { id: rerankModelId, isActive: true },
            relations: ["provider"],
        });

        if (!rerankModel) {
            this.logger.warn("Rerank模型不可用，跳过重排序");
            return chunks
                .filter((chunk) => !scoreThresholdEnabled || chunk.score >= scoreThreshold)
                .slice(0, topK);
        }

        try {
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
            return rerankResponse.results
                .filter(
                    (result) => !scoreThresholdEnabled || result.relevance_score >= scoreThreshold,
                )
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .map((result) => ({
                    ...chunks[result.index],
                    relevanceScore: result.relevance_score,
                }));
        } catch (error) {
            this.logger.error(`Rerank重排序失败: ${error.message}`);
            return chunks
                .filter((chunk) => !scoreThresholdEnabled || chunk.score >= scoreThreshold)
                .slice(0, topK);
        }
    }

    /**
     * Generates embedding for query
     */
    private async generateEmbedding(query: string, model: any): Promise<number[]> {
        const adapter = getProvider(model.provider.provider, {
            apiKey: model.provider.apiKey,
            baseURL: model.provider.baseUrl,
        });
        const generator = embeddingGenerator(adapter);
        const embeddingResponse: CreateEmbeddingResponse = await generator.embeddings.create({
            input: [query],
            model: model.model,
        });
        return embeddingResponse.data[0].embedding;
    }

    /**
     * Retrieves and validates embedding model
     */
    private async getEmbeddingModel(modelId: string): Promise<any> {
        const model = await this.aiModelService.findOne({
            where: { id: modelId, isActive: true },
            relations: ["provider"],
        });
        if (!model) {
            throw HttpExceptionFactory.internal("未找到可用的向量模型");
        }
        return model;
    }

    /**
     * Normalizes retrieval configuration with defaults
     */
    private normalizeConfig(config: RetrievalConfig) {
        return {
            topK: config.topK ?? RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K,
            scoreThreshold: config.scoreThreshold ?? RAG_SERVICE_CONSTANTS.DEFAULT_SCORE_THRESHOLD,
            scoreThresholdEnabled: config.scoreThresholdEnabled ?? false,
            rerankConfig: config.rerankConfig,
            weightConfig: config.weightConfig,
        };
    }
}
