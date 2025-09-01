import type { BaseEntity, BaseQueryParams, Pagination, PaginationResult } from "./global";

/**
 * 模型配置类型
 */
export interface ModelConfig {
    /** 模型ID */
    id: string;
    /** 模型参数配置 */
    options?: {
        /** 温度参数 */
        temperature?: number;
        /** 最大Token数 */
        maxTokens?: number;
        /** Top P参数 */
        topP?: number;
        /** 频率惩罚 */
        frequencyPenalty?: number;
        /** 存在惩罚 */
        presencePenalty?: number;
        /** 停止词 */
        stop?: string[];
        /** 回复格式 */
        responseFormat?: string;
        /** 其他自定义参数 */
        [key: string]: any;
    };
}

/** 查询智能体统计数据参数 */
export interface QueryAgentStatisticsParams {
    /** 开始时间（可选，ISO 8601格式） */
    startDate?: string;
    /** 结束时间（可选，ISO 8601格式） */
    endDate?: string;
}

/**
 * 表单字段配置类型
 */
export interface FormFieldConfig {
    /** 字段名 */
    name: string;
    /** 字段标签 */
    label: string;
    /** 字段类型 */
    type: "text" | "textarea" | "select";
    /** 是否必填 */
    required?: boolean;
    /** 选项列表（仅当type为select时使用） */
    options?: string[];
}

/**
 * 智能体实体接口
 */
export interface Agent extends BaseEntity {
    /** 智能体名称 */
    name: string;
    /** 智能体描述 */
    description?: string;
    /** 智能体头像 */
    avatar?: string;
    /** 对话头像 */
    chatAvatar?: string;
    /** 角色设定 */
    rolePrompt?: string;
    /** 是否显示对话上下文 */
    showContext: boolean;
    /** 是否显示引用来源 */
    showReference: boolean;
    /** 是否允许反馈 */
    enableFeedback: boolean;
    /** 是否开启联网搜索 */
    enableWebSearch: boolean;
    /** 访问用户数量 */
    userCount: number;
    /** 模型配置 */
    modelConfig?: ModelConfig;
    /** 关联知识库ID列表 */
    datasetIds?: string[];
    /** 开场白 */
    openingStatement?: string;
    /** 开场问题配置 */
    openingQuestions?: string[];
    /** 快捷指令配置 */
    quickCommands?: QuickCommandConfig[];
    /** 自动追问配置 */
    autoQuestions?: AutoQuestionsConfig;
    /** 表单变量配置 */
    formFields?: FormFieldConfig[];
    /** 表单字段输入值（用于预览和测试） */
    formFieldsInputs?: Record<string, any>;
    /** 创建者ID */
    createdBy: string;
    /** 是否已发布 */
    isPublished?: boolean;
    /** 是否公开 */
    isPublic?: boolean;
    /** 公开访问令牌 */
    publishToken?: string;
    /** API调用密钥 */
    apiKey?: string;
    /** 发布配置 */
    publishConfig?: {
        allowOrigins?: string[];
        rateLimitPerMinute?: number;
        showBranding?: boolean;
        allowDownloadHistory?: boolean;
    };
    [index: string]: any;
}

/**
 * 自动追问配置类型
 */
export interface AutoQuestionsConfig {
    /** 是否启用 */
    enabled: boolean;
    /** 是否自定义规则 */
    customRuleEnabled: boolean;
    /** 自定义规则内容 */
    customRule?: string;
}

/**
 * 快捷指令配置类型
 */
export interface QuickCommandConfig {
    /** 头像 */
    avatar: string;
    /** 指令名 */
    name: string;
    /** 指令内容 */
    content: string;
    /** 回答方式 */
    replyType: "custom" | "model";
    /** 回复内容 */
    replyContent: string;
}

/**
 * 智能体对话记录实体接口
 */
export interface AgentChatRecord extends BaseEntity {
    /** 对话标题 */
    title: string;
    /** 用户ID */
    userId: string;
    /** 智能体ID */
    agentId: string;
    /** 对话摘要 */
    summary?: string;
    /** 消息总数 */
    messageCount: number;
    /** 匿名用户标识 */
    anonymousIdentifier?: string;
    /** 总Token消耗 */
    totalTokens: number;
    /** 消耗算力 */
    consumedPower: number;
    /** 对话配置 */
    config?: Record<string, any>;
    /** 是否删除 */
    isDeleted: boolean;
    /** 引用来源 */
    referenceSources?: AgentReferenceSources[];
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /** 关联的智能体 */
    agent?: Agent;
    /** 关联的用户信息 */
    user?: {
        username: string;
        nickname?: string;
        phone?: string;
        avatar?: string;
        email?: string;
    };
}

/**
 * 智能体对话消息实体接口
 */
export interface AgentChatMessage extends BaseEntity {
    /** 对话记录ID */
    conversationId: string;
    /** 智能体ID */
    agentId: string;
    /** 用户ID */
    userId: string;
    /** 消息角色 */
    role: "user" | "assistant" | "system";
    /** 消息内容 */
    content: string;
    /** 消息类型 */
    messageType: string;
    /** Token使用统计 */
    tokens?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
    /** 原始AI响应 */
    rawResponse?: any;
    /** 引用来源 */
    referenceSources?: any[];
    /** 表单变量 */
    formVariables?: Record<string, string>;
}

/**
 * 智能体引用来源接口
 */
export interface AgentReferenceSources {
    /** 知识库ID */
    datasetId: string;
    /** 知识库名称 */
    datasetName?: string;
    /** 检索到的内容块 */
    chunks: Array<{
        id: string;
        content: string;
        score: number;
        metadata?: Record<string, unknown>;
        fileName?: string;
        chunkIndex?: number;
    }>;
}

/**
 * 更新智能体配置请求参数
 */
export interface UpdateAgentConfigParams {
    /** 智能体名称 */
    name?: string;
    /** 智能体描述 */
    description?: string;
    /** 智能体头像 */
    avatar?: string | any;
    /** 对话头像 */
    chatAvatar?: string;
    /** 角色设定 */
    rolePrompt?: string;
    /** 是否显示对话上下文 */
    showContext?: boolean;
    /** 是否显示引用来源 */
    showReference?: boolean;
    /** 是否允许反馈 */
    enableFeedback?: boolean;
    /** 是否开启联网搜索 */
    enableWebSearch?: boolean;
    /** 模型配置 */
    modelConfig?: ModelConfig;
    /** 关联知识库ID列表 */
    datasetIds?: string[];
    /** 开场白 */
    openingStatement?: string;
    /** 开场问题配置 */
    // openingQuestions?: OpeningQuestionsConfig;
    openingQuestions?: string[];
    /** 快捷指令配置 */
    quickCommands?: QuickCommandConfig[];
    /** 自动追问配置 */
    autoQuestions?: AutoQuestionsConfig;
    /** 表单字段配置 */
    formFields?: FormFieldConfig[];
    /** 表单字段输入值（用于预览和测试） */
    formFieldsInputs?: Record<string, any>;
    /** 是否公开 */
    isPublic?: boolean;
    /** 计费配置 */
    billingConfig?: BillingConfig;
}

/**
 * 计费配置
 */
export interface BillingConfig {
    /** 价格 */
    price: number;
}

/**
 * 查询智能体请求参数
 */
export interface QueryAgentParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 是否公开筛选 */
    isPublic?: boolean;
}

/**
 * 智能体对话请求参数
 */
export interface AgentChatParams {
    /** 消息列表（标准AI对话格式） */
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    /** 对话记录ID（可选，如果没有则创建新对话） */
    conversationId?: string;
    /** 表单变量（用于角色设定中的变量替换） */
    formVariables?: Record<string, string>;
    /** 是否保存对话记录（默认为true） */
    saveConversation?: boolean;
    /** 对话标题（创建新对话时使用） */
    title?: string;
    /** 是否包含上下文 */
    includeContext?: boolean;
    /** 是否返回引用来源 */
    includeReferences?: boolean;
    /** 是否生成自动追问 */
    generateSuggestions?: boolean;
    /** 模型配置 */
    modelConfig?: ModelConfig;
    /** 知识库ID列表 */
    datasetIds?: string[];
    /** 角色设定 */
    rolePrompt?: string;
    /** 是否显示对话上下文 */
    showContext?: boolean;
    /** 是否显示引用来源 */
    showReference?: boolean;
    /** 是否允许反馈 */
    enableFeedback?: boolean;
    /** 是否开启联网搜索 */
    enableWebSearch?: boolean;
    /** 自动追问配置 */
    autoQuestions?: AutoQuestionsConfig;
}

/**
 * 智能体对话测试请求参数
 */
export interface AgentChatTestParams {
    /** 用户消息 */
    message: string;
    /** 对话历史 */
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    /** 临时智能体配置（用于测试，不保存到数据库） */
    agentConfig?: Partial<UpdateAgentConfigParams>;
}

/**
 * 智能体对话响应结果
 */
export interface AgentChatResponse {
    /** 对话记录ID */
    conversationId: string;
    /** AI回复内容 */
    response: string;
    /** 引用来源（如果启用） */
    referenceSources?: Array<{
        datasetId: string;
        datasetName: string;
        chunks: Array<{
            id: string;
            content: string;
            score: number;
            metadata?: Record<string, unknown>;
            fileName?: string;
            chunkIndex?: number;
        }>;
    }>;
    /** 对话上下文（如果启用） */
    context?: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
    }>;
    /** 自动追问建议（如果启用） */
    suggestions?: string[];
    /** Token使用统计 */
    tokenUsage?: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
    };
    /** 响应时间（毫秒） */
    responseTime: number;
}

/**
 * 查询智能体对话记录请求参数
 */
export interface QueryAgentChatRecordParams extends Pagination {
    /** 智能体ID */
    agentId: string;
    /** 关键词搜索 */
    keyword?: string;
}

/**
 * 批量删除对话记录请求参数
 */
export interface BatchDeleteChatRecordParams {
    /** 对话记录ID列表 */
    ids: string[];
}

/**
 * 创建对话记录请求参数
 */
export interface CreateChatRecordParams {
    /** 智能体ID */
    agentId: string;
    /** 对话标题 */
    title?: string;
}

/**
 * 智能体标注审核状态枚举
 */
export type AnnotationReviewStatus = "pending" | "approved" | "rejected";

/**
 * 智能体标注实体接口
 */
export interface AgentAnnotation extends BaseEntity {
    /** 标注ID */
    id: string;
    /** 关联的智能体ID */
    agentId: string;
    /** 提问内容 */
    question: string;
    /** 答案内容 */
    answer: string;
    /** 命中次数 */
    hitCount: number;
    /** 是否启用 */
    enabled: boolean;
    /** 审核状态 */
    reviewStatus: AnnotationReviewStatus;
    /** 审核人ID */
    reviewedBy?: string;
    /** 审核时间 */
    reviewedAt?: string;
    /** 创建者ID */
    createdBy: string;
    /** 审核人信息 */
    reviewer?: {
        /** 用户名 */
        username: string;
        /** 昵称 */
        nickname?: string;
        /** 头像 */
        avatar?: string;
    };
}

/**
 * 创建标注请求参数
 */
export interface CreateAgentAnnotationParams {
    /** 智能体ID */
    agentId?: string;
    /** 提问内容 */
    question: string;
    /** 答案内容 */
    answer: string;
    /** 是否启用 */
    enabled?: boolean;
    /** 关联的对话消息ID */
    messageId?: string;
}

/**
 * 更新标注请求参数
 */
export interface UpdateAgentAnnotationParams {
    /** 提问内容 */
    question?: string;
    /** 答案内容 */
    answer?: string;
    /** 是否启用 */
    enabled?: boolean;
    /** 关联的对话消息ID */
    messageId?: string;
}

/**
 * 标注查询参数
 */
export interface QueryAgentAnnotationParams extends BaseQueryParams {
    /** 智能体ID */
    agentId?: string;
    /** 提问内容关键词 */
    keyword?: string;
    /** 是否启用 */
    enabled?: boolean;
    /** 审核状态 */
    reviewStatus?: AnnotationReviewStatus;
}

/**
 * 审核标注请求参数
 */
export interface ReviewAnnotationParams {
    /** 审核状态 */
    reviewStatus: AnnotationReviewStatus;
}

/**
 * 标注匹配测试结果
 */
export interface AnnotationMatchResult {
    /** 是否匹配 */
    matched: boolean;
    /** 匹配的标注信息 */
    annotation?: {
        id: string;
        question: string;
        answer: string;
        hitCount: number;
    } | null;
    /** 相似度 */
    similarity?: number;
}

/**
 * 智能体统计数据
 */
export interface AgentStatistics {
    /** 总览数据 */
    overview: {
        /** 总对话数 */
        totalConversations: number;
        /** 总消息数 */
        totalMessages: number;
        /** 总Token消耗 */
        totalTokens: number;
        /** 总标注数 */
        totalAnnotations: number;
        /** 活跃标注数 */
        activeAnnotations: number;
        /** 标注总命中次数 */
        annotationHitCount: number;
    };
    /** 趋势数据 */
    trends: {
        /** 对话数趋势 */
        conversations: Array<{ date: string; count: number }>;
        /** 消息数趋势 */
        messages: Array<{ date: string; count: number }>;
        /** Token消耗趋势 */
        tokens: Array<{ date: string; count: number }>;
        /** 活跃用户数趋势 */
        activeUsers: Array<{ date: string; count: number }>;
    };
}

/**
 * 智能体模板配置接口
 */
export interface AgentTemplateConfig extends UpdateAgentConfigParams {
    /** 模板ID */
    id: string;
    /** 模板名称 */
    name: string;
    /** 模板描述 */
    description?: string;
    /** 模板分类 */
    categories: string;
    /** 模板标签 */
    tags: string[];
    /** 是否推荐 */
    isRecommended: boolean;
}

/**
 * 从模板创建智能体的参数
 */
export interface CreateAgentFromTemplateParams {
    /** 模板ID */
    templateId: string;
    /** 智能体名称 */
    name: string;
    /** 智能体描述 */
    description?: string;
    /** 智能体头像 */
    avatar?: string;
    /** 自定义配置覆盖 */
    customConfig?: Partial<AgentTemplateConfig>;
}

/**
 * 查询模板列表的参数
 */
export interface QueryTemplateParams {
    /** 搜索关键词 */
    keyword?: string;
    /** 分类筛选 */
    category?: string;
    /** 标签筛选 */
    tags?: string[];
    /** 是否只显示推荐模板 */
    recommended?: boolean;
    /** 排序方式 */
    sortBy?: "name" | "usageCount" | "rating" | "createdAt";
    /** 排序顺序 */
    sortOrder?: "asc" | "desc";
}
