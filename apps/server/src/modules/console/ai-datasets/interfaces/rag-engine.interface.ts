/**
 * RAG 引擎配置接口
 */
export interface RAGEngineConfig {
    /** 向量模型名称 */
    embeddingModel: string;
    /** 重排序模型名称（可选） */
    rerankModel?: string;
    /** 文本生成模型名称 */
    textModel: string;
    /** 检索的文档数量 */
    topK?: number;
    /** 重排序后的文档数量 */
    topN?: number;
    /** 文本生成的全局配置 */
    textModelConfig?: Record<string, any>;
}

/**
 * 文档块接口
 */
export interface DocumentChunk {
    id: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
    score?: number;
}

/**
 * 检索结果接口
 */
export interface RetrievalResult {
    chunks: DocumentChunk[];
    scores: number[];
    totalTime: number;
}

/**
 * RAG 重排序处理结果接口
 */
export interface RAGRerankResult {
    chunks: DocumentChunk[];
    totalTime: number;
}

/**
 * RAG 问答结果接口
 */
export interface RAGChatResult {
    answer: string;
    sources: DocumentChunk[];
    query: string;
    retrievalTime: number;
    rerankTime: number;
    generationTime: number;
    totalTime: number;
}
