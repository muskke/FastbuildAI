import type { McpCallType } from "@fastbuildai/http";

import type { McpToolCall } from "./mcp-server";

/**
 * 对话状态枚举
 */
type ConversationStatus = "active" | "completed" | "failed";

/**
 * 消息角色枚举
 */
type MessageRole = "user" | "assistant" | "system";

/**
 * 消息类型枚举
 */
type MessageType = "text" | "image" | "file";

/**
 * AI对话记录接口
 */
export interface AiConversation {
    /** 主键ID (UUID) */
    id: string;
    /** 对话标题 */
    title: string;
    /** 用户ID */
    userId: string;
    /** 对话摘要 */
    summary?: string;
    /** 消息总数 */
    messageCount: number;
    /** 总Token消耗 */
    totalTokens: number;
    /** 对话配置 */
    config?: Record<string, any>;
    /** 对话状态 */
    status: ConversationStatus;
    /** 是否置顶 */
    isPinned: boolean;
    /** 是否删除（软删除） */
    isDeleted: boolean;
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /** 用户信息 */
    user?: UserInfo;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 对话中的消息列表 */
    messages?: AiMessage[];
}

/**
 * 创建对话请求参数
 */
export interface CreateConversationParams {
    /** 对话标题 */
    title: string;
    /** 对话摘要 */
    summary?: string;
    /** 对话配置 */
    config?: Record<string, any>;
    /** 是否置顶 */
    isPinned?: boolean;
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /** 首条消息（可选） */
    firstMessage?: {
        /** 消息内容 */
        content: string;
        /** AI模型ID（可选） */
        modelId?: string;
    };
}

/**
 * 更新对话请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface UpdateConversationParams
    extends Partial<Omit<CreateConversationParams, "firstMessage">> {}

/**
 * 查询对话请求参数 - 继承基础查询参数
 */
export interface QueryConversationParams extends BaseQueryParams {
    /** 对话状态筛选 */
    status?: ConversationStatus;
    /** 是否置顶筛选 */
    isPinned?: boolean;
}

/**
 * 附件信息接口
 */
export interface Attachment {
    /** 附件类型 */
    type: string;
    /** 附件URL */
    url: string;
    /** 附件名称 */
    name?: string;
    /** 附件大小（字节） */
    size?: number;
}

/**
 * Token使用情况接口
 */
export interface TokenUsage {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
}

/**
 * AI消息接口
 */
export interface AiMessage {
    /** 主键ID (UUID) */
    id?: string;
    /** 对话ID */
    conversationId?: string;
    /** 使用的AI模型ID */
    modelId?: string;
    /** 消息角色 */
    role: MessageRole;
    /** 消息内容 */
    content: string;
    /** 消息类型 */
    messageType?: MessageType;
    /** 模型 */
    model?: AiModel;
    /** 附件信息 */
    attachments?: Attachment[];
    /** Token使用情况 */
    tokens?: TokenUsage;
    /** 处理时长（毫秒） */
    processingTime?: number;
    /** 时间戳 */
    timestamp?: string;
    /** 消息状态 */
    status?: "active" | "loading" | "failed" | "completed";
    /** 错误信息 */
    errorMessage?: string;
    /** 模型响应的原始数据 */
    rawResponse?: Record<string, any>;
    /** 扩展数据 */
    metadata?: Record<string, any>;
    /** 创建时间 */
    createdAt?: string | Date;
    /** 更新时间 */
    updatedAt?: string | Date;
    /** mcp调用 */
    mcpToolCalls?: McpToolCall[];
    /** 消息头像 */
    avatar?: string;
    /** 扩展数据 */
    [key: string]: any;
}

/**
 * 创建消息请求参数
 */
export interface CreateMessageParams {
    /** 对话ID */
    conversationId: string;
    /** 使用的AI模型ID */
    modelId: string;
    /** 消息角色 */
    role: MessageRole;
    /** 消息内容 */
    content: string;
    /** 消息类型 */
    messageType?: MessageType;
    /** 附件信息 */
    attachments?: Attachment[];
    /** Token使用情况 */
    tokens?: TokenUsage;
    /** 处理时长（毫秒） */
    processingTime?: number;
    /** 模型响应的原始数据 */
    rawResponse?: Record<string, any>;
    /** 扩展数据 */
    metadata?: Record<string, any>;
}

/**
 * 更新消息请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface UpdateMessageParams extends Partial<Omit<CreateMessageParams, "conversationId">> {
    /** 消息ID（更新时必需） */
    id: string;
}

/**
 * 查询消息请求参数 - 继承基础查询参数
 */
export interface QueryMessageParams extends BaseQueryParams {
    /** 对话ID筛选 */
    conversationId?: string;
    /** 消息角色筛选 */
    role?: MessageRole;
    /** 消息类型筛选 */
    messageType?: MessageType;
    /** 消息状态筛选 */
    status?: "sending" | "completed" | "failed";
}

// 注意：PaginationParams 和 PaginationResult 已在 global.d.ts 中定义，这里移除重复定义

export interface AiModel {
    id: string;
    name: string;
    providerId: string;
    model: string;
    maxTokens: number;
    maxContext: number;
    modelConfig: Record<string, any>;
    isActive: boolean;
    isDefault: boolean;
    description?: string;
    sortOrder: number;
    billingRule: {
        power: number;
        tokens: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AiProvider {
    id: string;
    provider: string;
    name: string;
    baseUrl: string;
    iconUrl?: string;
    websiteUrl?: string;
    isActive: boolean;
    description?: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    models: AiModel[];
}

/**
 * 对话查询参数接口 - 继承基础查询参数（后台用）
 */
export interface ConversationQueryParams extends BaseQueryParams {
    /** 对话状态筛选 */
    status?: ConversationStatus;
    /** 是否置顶筛选 */
    isPinned?: boolean;
    /** 用户ID筛选 */
    userId?: string;
}

// ==================== 聊天配置相关接口 ====================

/**
 * 聊天建议选项接口
 */
export interface ChatSuggestion {
    /** 建议图标 */
    icon: string;
    /** 建议文本 */
    text: string;
}

/**
 * 欢迎信息接口
 */
export interface WelcomeInfo {
    /** 欢迎标题 */
    title: string;
    /** 欢迎描述 */
    description: string;
    /** 页脚信息 */
    footer: string;
}

/**
 * 对话配置接口
 */
export interface ChatConfig {
    /** 聊天建议选项 */
    suggestions: ChatSuggestion[];
    /** 是否启用建议选项 */
    suggestionsEnabled: boolean;
    /** 欢迎信息 */
    welcomeInfo: WelcomeInfo;
}

/**
 * 更新对话配置接口
 */
export interface UpdateChatConfigDto extends Partial<ChatConfig> {}
