import type { BaseEntity, BaseQueryParams, Pagination, PaginationResult } from "./global";

/**
 * 知识库状态枚举
 */
type DatasetStatus = "processing" | "completed" | "failed" | "pending";

/**
 * 检索模式枚举
 */
type RetrievalMode = "vector" | "fullText" | "hybrid";

/**
 * 文档处理状态枚举
 */
type ProcessingStatus = "processing" | "completed" | "failed" | "pending";

/**
 * 新的分段配置接口（与后端一致）
 */
export interface SegmentationConfig {
    /** 分段标识符 */
    segmentIdentifier: string;
    /** 分段最大长度 */
    maxSegmentLength: number;
    /** 分段重叠长度 */
    segmentOverlap?: number;
}

/**
 * 子分段配置接口
 */
export interface SubSegmentationConfig {
    /** 分段标识符 */
    segmentIdentifier: string;
    /** 分段最大长度 */
    maxSegmentLength: number;
}

/**
 * 文本预处理规则配置接口
 */
export interface TextPreprocessingRules {
    /** 替换连续的空格、换行符和制表符 */
    replaceConsecutiveWhitespace?: boolean;
    /** 删除所有 URL 和电子邮件地址 */
    removeUrlsAndEmails?: boolean;
}

/**
 * 权重配置接口（统一的检索参数配置）
 */
export interface WeightConfig {
    /** 语义权重（仅混合模式使用） */
    semanticWeight?: number;
    /** 关键词权重（仅混合模式使用） */
    keywordWeight?: number;
}

/**
 * Rerank配置接口
 */
export interface RerankConfig {
    /** 是否启用Rerank */
    enabled?: boolean;
    /** Rerank模型ID */
    modelId?: string;
}

/**
 * 统一的检索配置接口
 */
export interface RetrievalConfig {
    /** 检索模式 */
    retrievalMode: RetrievalMode;
    /** 混合检索策略（仅混合模式使用） */
    strategy?: "weighted_score" | "rerank";
    /** 返回结果数量 */
    topK?: number;
    /** 相似度阈值 */
    scoreThreshold?: number;
    /** 是否启用阈值过滤 */
    scoreThresholdEnabled?: boolean;
    /** 权重配置（仅混合模式使用，不再包含topK/scoreThreshold） */
    weightConfig?: WeightConfig;
    /** Rerank配置（不再包含topK/scoreThreshold） */
    rerankConfig?: RerankConfig;
}

/**
 * 新的索引配置接口
 */
export interface IndexingConfig {
    /** 文件ID列表 */
    fileIds: string[];
    /** 文档处理模式 */
    documentMode?: "normal" | "hierarchical";
    /** 父块上下文模式 */
    parentContextMode?: "fullText" | "paragraph";
    /** 分段配置 */
    segmentation?: SegmentationConfig;
    /** 子分段配置 */
    subSegmentation?: SubSegmentationConfig;
    /** 文本预处理规则 */
    preprocessingRules?: TextPreprocessingRules;
}

/**
 * 知识库实体接口
 */
export interface Dataset extends BaseEntity {
    /** 知识库名称 */
    name: string;
    /** 知识库描述 */
    description?: string;
    /** 处理状态 */
    status: DatasetStatus;
    /** 检索模式 */
    retrievalMode: RetrievalMode;
    /** 文档数量 */
    documentCount: number;
    /** 分段数量 */
    chunkCount: number;
    /** 存储空间大小（MB） */
    storageSize: number;
    /** 向量模型ID */
    embeddingModelId: string;
    /** 索引配置 */
    indexingConfig: IndexingConfig;
    /** 检索配置 */
    retrievalConfig: RetrievalConfig;
    /** 创建者ID */
    createdBy: string;
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /** 关联应用数量 */
    relatedAgentCount?: number;
}

/**
 * 知识库文档实体接口
 */
export interface DatasetDocument extends BaseEntity {
    /** 所属知识库ID */
    datasetId: string;
    /** 文件ID */
    fileId: string;
    /** 文件名称 */
    fileName: string;
    /** 文件类型 */
    fileType: string;
    /** 文件大小（字节） */
    fileSize: number;
    /** 处理状态 */
    status: ProcessingStatus;
    /** 处理进度 */
    progress: number;
    /** 错误信息 */
    error?: string;
    /** 是否启用 */
    enabled: boolean;
    /** 字符数量 */
    characterCount: number;
    /** 分段数量 */
    chunkCount: number;
    /** 向量模型ID */
    embeddingModelId: string;
    /** 创建者ID */
    createdBy: string;
    /** 扩展数据 */
    metadata?: Record<string, any>;
}

/**
 * 知识库分段实体接口
 */
export interface DatasetSegment extends BaseEntity {
    /** 所属知识库ID */
    datasetId: string;
    /** 所属文档ID */
    documentId: string;
    /** 分段内容 */
    content: string;
    /** 分段索引 */
    chunkIndex: number;
    /** 内容长度 */
    contentLength: number;
    /** 处理状态 */
    status: ProcessingStatus;
    /** 错误信息 */
    error?: string;
    /** 向量嵌入 */
    embedding?: number[];
    /** 子分段内容 */
    children?: string[];
    /** 向量模型ID */
    embeddingModelId: string;
    /** 创建者ID */
    createdBy: string;
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /**
     * 是否启用（1-启用，0-禁用）
     */
    enabled: number;
}

/**
 * 创建知识库请求参数
 */
export interface CreateDatasetParams {
    /** 知识库名称 */
    name: string;
    /** 知识库描述 */
    description: string;
    /** 索引配置 */
    indexingConfig: IndexingConfig;
    /** 向量模型ID */
    embeddingModelId: string;
    /** 检索配置 */
    retrievalConfig: RetrievalConfig;
}

/**
 * 更新知识库请求参数
 */
export interface UpdateDatasetParams extends Partial<Omit<CreateDatasetParams, "indexingConfig">> {}

/**
 * 查询知识库请求参数
 */
export interface QueryDatasetParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 是否显示所有知识库 */
    showAll?: boolean;
}

/**
 * 创建文档请求参数
 */
export interface CreateDocumentParams {
    /** 所属知识库ID */
    datasetId: string;
    /** 自定义文档名称 */
    documentName?: string;
    /** 索引配置 */
    indexingConfig: IndexingConfig;
}

/**
 * 查询文档请求参数
 */
export interface QueryDocumentParams extends BaseQueryParams {
    /** 知识库ID筛选 */
    datasetId?: string;
    /** 状态筛选 */
    status?: ProcessingStatus | null;
    /** 文件ID列表筛选（逗号分隔的字符串） */
    fileIds?: string | string[];
}

/**
 * 查询分段请求参数
 */
export interface QuerySegmentParams extends BaseQueryParams {
    /** 知识库ID筛选 */
    datasetId?: string;
    /** 文档ID筛选 */
    documentId?: string;
    /** 状态筛选 */
    status?: ProcessingStatus | null;
    /** 最小内容长度 */
    minContentLength?: number;
    /** 最大内容长度 */
    maxContentLength?: number;
}

/**
 * 创建分段请求参数
 */
export interface CreateSegmentParams {
    /** 所属知识库ID */
    datasetId: string;
    /** 所属文档ID */
    documentId: string;
    /** 分段内容 */
    content: string;
    /** 扩展数据 */
    metadata?: Record<string, any>;
}

/**
 * 更新分段请求参数
 */
export interface UpdateSegmentParams {
    /** 所属知识库ID */
    datasetId: string;
    /** 分段内容 */
    content: string;
    /** 扩展数据 */
    metadata?: Record<string, any>;
}

/**
 * 知识库检索请求参数
 */
export interface QueryKnowledgeParams {
    /** 查询文本 */
    query: string;
    /** 返回结果数量 */
    topK?: number;
    /** 相似度阈值 */
    scoreThreshold?: number;
}

/**
 * 文档创建响应结果
 */
export interface CreateDocumentResponse {
    /** 创建的文档列表 */
    documents: DatasetDocument[];
    /** 创建数量 */
    createdCount: number;
    /** 总分段数 */
    totalSegments: number;
    /** 处理耗时（毫秒） */
    processingTime: number;
}

/**
 * 分段结果接口
 */
export interface SegmentResult {
    /** 分段索引 */
    index: number;
    /** 分段内容 */
    content: string;
    /** 内容长度 */
    length: number;
}

/**
 * 文件分段结果接口
 */
export interface FileSegmentResult {
    /** 文件ID */
    fileId: string;
    /** 文件名称 */
    fileName: string;
    /** 分段数量 */
    segmentCount: number;
    /** 分段结果列表 */
    segments: SegmentResult[];
}

/**
 * 索引分段响应结果
 */
export interface IndexingSegmentsResponse {
    /** 总分段数 */
    totalSegments: number;
    /** 文件分段结果列表 */
    fileResults: FileSegmentResult[];
    /** 处理耗时（毫秒） */
    processingTime: number;
    /** 处理的文件数 */
    processedFiles: number;
}

/**
 * 检索结果接口
 */
export interface RetrievalResult {
    /** 分段ID */
    segmentId: string;
    /** 分段内容 */
    content: string;
    /** 相似度分数 */
    score: number;
    /** 文档信息 */
    document: {
        /** 文档ID */
        id: string;
        /** 文件名称 */
        fileName: string;
    };
    /** 知识库信息 */
    dataset: {
        /** 知识库ID */
        id: string;
        /** 知识库名称 */
        name: string;
    };
}

/**
 * 知识库检索响应结果
 */
export interface QueryKnowledgeResponse {
    /** 检索结果列表 */
    results: RetrievalResult[];
    /** 检索耗时（毫秒） */
    retrievalTime: number;
    /** 使用的检索模式 */
    retrievalMode: RetrievalMode;
}

/**
 * 检索分段详情类型（前端弹窗展示用）
 */
export interface DatasetChunk {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
    sources?: string[];
    chunkIndex?: number;
    contentLength?: number;
    fileName?: string;
    highlight?: string;
}

// ==================== 团队成员相关类型 ====================

/**
 * 团队角色枚举
 */
export type TeamRole = "owner" | "manager" | "editor" | "viewer";

/**
 * 团队成员实体接口
 */
export interface TeamMember extends BaseEntity {
    /** 可以操作 */
    canOperate: boolean;
    /** 是否为当前用户 */
    oneself: boolean;
    /** 当前用户是否为知识库拥有者 */
    isCurrentUserOwner: boolean;
    /** 知识库ID */
    datasetId: string;
    /** 用户ID */
    userId: string;
    /** 团队角色 */
    role: TeamRole;
    /** 加入时间 */
    joinedAt: string;
    /** 邀请者ID */
    invitedBy?: string;
    /** 最后活跃时间 */
    lastActiveAt?: string;
    /** 是否启用 */
    isActive: boolean;
    /** 备注信息 */
    note?: string;
    /** 用户信息 */
    user?: {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        nickname?: string;
    };
    /** 邀请者信息 */
    inviter?: {
        id: string;
        username: string;
        nickname?: string;
    };
}

/**
 * 添加团队成员请求参数
 */
export interface AddTeamMemberParams {
    /** 知识库ID */
    datasetId: string;
    /** 用户ID */
    userId: string;
    /** 团队角色 */
    role: TeamRole;
    /** 备注信息 */
    note?: string;
}

/**
 * 更新团队成员角色请求参数
 */
export interface UpdateTeamMemberRoleParams {
    /** 成员ID */
    memberId: string;
    /** 新的团队角色 */
    role: TeamRole;
    /** 备注信息 */
    note?: string;
}

/**
 * 移除团队成员请求参数
 */
export interface RemoveTeamMemberParams {
    /** 成员ID */
    memberId: string;
}

/**
 * 查询团队成员请求参数
 */
export interface QueryTeamMemberParams extends BaseQueryParams {
    /** 知识库ID */
    datasetId: string;
    /** 角色筛选 */
    role?: TeamRole;
    /** 用户名搜索 */
    username?: string;
    /** 是否启用筛选 */
    isActive?: boolean;
}

/**
 * 转移所有权请求参数
 */
export interface TransferOwnershipParams {
    /** 知识库ID */
    datasetId: string;
    /** 新所有者用户ID */
    newOwnerId: string;
}

/**
 * 批量操作团队成员请求参数
 */
export interface BatchTeamMemberOperationParams {
    /** 成员ID列表 */
    memberIds: string[];
    /** 操作类型 */
    operation: "remove" | "update_role" | "toggle_active";
    /** 新角色（仅当操作类型为update_role时需要） */
    newRole?: TeamRole;
}

/**
 * 用户角色检查响应
 */
export interface UserRoleResponse {
    /** 角色 */
    role: string | null;
    /** 是否激活 */
    isActive: boolean;
}

/**
 * 成员检查响应
 */
export interface MembershipCheckResponse {
    /** 是否为成员 */
    isMember: boolean;
    /** 角色 */
    role?: string;
}
