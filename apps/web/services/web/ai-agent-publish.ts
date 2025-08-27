import {
    useConsoleDelete,
    useConsoleGet,
    useConsolePost,
    useConsolePut,
} from "@/common/composables/useRequest";
import type { AiMessage, PaginationResult } from "@/models";
import type { CreateAgentAnnotationParams, UpdateAgentAnnotationParams } from "@/models/ai-agent";

/**
 * 发布配置接口
 */
export interface PublishConfig {
    allowOrigins?: string[];
    rateLimitPerMinute?: number;
    showBranding?: boolean;
    allowDownloadHistory?: boolean;
}

/**
 * 发布智能体请求参数
 */
export interface PublishAgentParams {
    publishConfig?: PublishConfig;
}

/**
 * 发布智能体响应
 */
export interface PublishAgentResponse {
    publishToken: string;
    apiKey: string;
    publishUrl: string;
    embedCode: string;
}

/**
 * 获取嵌入代码响应
 */
export interface EmbedCodeResponse {
    embedCode: string;
    publishUrl: string;
}

/**
 * 重新生成API密钥响应
 */
export interface RegenerateApiKeyResponse {
    apiKey: string;
}

/**
 * 发布智能体
 * @param agentId 智能体ID
 * @param params 发布参数
 */
export function apiPublishAgent(
    agentId: string,
    params: PublishAgentParams = {},
): Promise<PublishAgentResponse> {
    return useConsolePost(`/ai-agent/${agentId}/publish`, params);
}

/**
 * 取消发布智能体
 * @param agentId 智能体ID
 */
export function apiUnpublishAgent(agentId: string): Promise<{ message: string }> {
    return useConsolePost(`/ai-agent/${agentId}/unpublish`, {});
}

/**
 * 重新生成API密钥
 * @param agentId 智能体ID
 */
export function apiRegenerateApiKey(agentId: string): Promise<RegenerateApiKeyResponse> {
    return useConsolePost(`/ai-agent/${agentId}/regenerate-api-key`, {});
}

/**
 * 获取嵌入代码
 * @param agentId 智能体ID
 */
export function apiGetEmbedCode(agentId: string): Promise<EmbedCodeResponse> {
    return useConsoleGet(`/ai-agent/${agentId}/embed-code`);
}

// ==================== V1 API ====================

/**
 * 获取智能体信息
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @returns 智能体公开信息
 */
export function apiGetAgentInfo(publishToken: string, accessToken?: string): Promise<any> {
    const headers: any = {};
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    return useConsoleGet(
        `/v1/${publishToken}/info`,
        {},
        {
            headers,
            requireAuth: false,
        },
    );
}

/**
 * 生成访问令牌
 * @param publishToken 发布令牌
 * @returns 访问令牌信息
 */
export function apiGenerateAccessToken(publishToken: string): Promise<{
    accessToken: string;
    agentId: string;
    agentName: string;
    description: string;
}> {
    return useConsolePost(
        `/v1/${publishToken}/generate-access-token`,
        {},
        {
            requireAuth: false,
        },
    );
}

/**
 * 获取对话记录列表（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param params 查询参数
 * @returns 对话记录列表
 */
export function apiGetConversations(
    publishToken: string,
    accessToken: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<any> {
    return useConsoleGet(`/v1/${publishToken}/conversations`, params, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * 获取对话记录列表（使用 API Key）
 * @param apiKey API密钥
 * @param params 查询参数
 * @returns 对话记录列表
 */
export function apiGetConversationsByApiKey(
    apiKey: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<any> {
    return useConsoleGet(`/v1/conversations`, params, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        requireAuth: false,
    });
}

/**
 * 获取对话消息（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @param params 查询参数
 * @returns 对话消息列表
 */
export function apiGetMessages(
    publishToken: string,
    accessToken: string,
    conversationId: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<PaginationResult<AiMessage>> {
    return useConsoleGet(`/v1/${publishToken}/conversations/${conversationId}/messages`, params, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * 获取对话消息（使用 API Key）
 * @param apiKey API密钥
 * @param conversationId 对话ID
 * @param params 查询参数
 * @returns 对话消息列表
 */
export function apiGetMessagesByApiKey(
    apiKey: string,
    conversationId: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<PaginationResult<AiMessage>> {
    return useConsoleGet(`/v1/conversations/${conversationId}/messages`, params, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        requireAuth: false,
    });
}

/**
 * 删除对话记录（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @returns 删除结果
 */
export function apiDeleteConversation(
    publishToken: string,
    accessToken: string,
    conversationId: string,
): Promise<any> {
    return useConsoleDelete(`/v1/${publishToken}/conversations/${conversationId}`, undefined, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * 删除对话记录（使用 API Key）
 * @param apiKey API密钥
 * @param conversationId 对话ID
 * @returns 删除结果
 */
export function apiDeleteConversationByApiKey(
    apiKey: string,
    conversationId: string,
): Promise<any> {
    return useConsoleDelete(`/v1/conversations/${conversationId}`, undefined, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        requireAuth: false,
    });
}

/**
 * 更新对话记录（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export function apiUpdateConversation(
    publishToken: string,
    accessToken: string,
    conversationId: string,
    updateData: { title?: string },
): Promise<any> {
    return useConsolePut(`/v1/${publishToken}/conversations/${conversationId}`, updateData, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * 更新对话记录（使用 API Key）
 * @param apiKey API密钥
 * @param conversationId 对话ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export function apiUpdateConversationByApiKey(
    apiKey: string,
    conversationId: string,
    updateData: { title?: string },
): Promise<any> {
    return useConsolePut(`/v1/conversations/${conversationId}`, updateData, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        requireAuth: false,
    });
}

// ==================== 标注相关 API ====================

/**
 * 创建标注
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param data 创建标注数据
 * @returns 创建的标注
 */
export function apiCreateAnnotation(
    publishToken: string,
    accessToken: string,
    data: CreateAgentAnnotationParams,
): Promise<any> {
    return useConsolePost(`/v1/${publishToken}/annotations`, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * 获取标注详情
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param annotationId 标注ID
 * @returns 标注详情
 */
export function apiGetAnnotationDetail(
    publishToken: string,
    accessToken: string,
    annotationId: string,
): Promise<any> {
    return useConsoleGet(
        `/v1/${publishToken}/annotations/${annotationId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            requireAuth: false,
        },
    );
}

/**
 * 更新标注
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param annotationId 标注ID
 * @param data 更新标注数据
 * @returns 更新后的标注
 */
export function apiUpdateAnnotation(
    publishToken: string,
    accessToken: string,
    annotationId: string,
    data: UpdateAgentAnnotationParams,
): Promise<any> {
    return useConsolePut(`/v1/${publishToken}/annotations/${annotationId}`, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

// ==================== 对话相关 API ====================

/**
 * 统一对话接口（支持流式和阻塞模式）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param data 对话数据
 * @returns 对话结果或流控制器
 */
export function apiChat(
    publishToken: string,
    accessToken: string,
    data: {
        messages: AiMessage[];
        responseMode?: "streaming" | "blocking";
        conversationId?: string;
        title?: string;
        formVariables?: Record<string, string>;
        formFieldsInputs?: Record<string, any>;
        saveConversation?: boolean;
        includeReferences?: boolean;
    },
): Promise<any> {
    return useConsolePost(`/v1/${publishToken}/chat`, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        requireAuth: false,
    });
}

/**
 * API Key 方式对话
 * @param apiKey API密钥
 * @param data 对话数据
 * @returns 对话结果或流控制器
 */
export function apiChatByApiKey(
    apiKey: string,
    data: {
        messages: AiMessage[];
        responseMode?: "streaming" | "blocking";
        conversationId?: string;
        title?: string;
        formVariables?: Record<string, string>;
        formFieldsInputs?: Record<string, any>;
        saveConversation?: boolean;
        includeReferences?: boolean;
    },
): Promise<any> {
    return useConsolePost(`/v1/chat`, data, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        requireAuth: false,
    });
}

/**
 * 流式对话（兼容 useChat）
 * @param messages 消息列表
 * @param config 对话配置（包含publishToken和accessToken）
 * @returns 流控制器
 */
export function apiChatStream(
    messages: AiMessage[] | any,
    config?: Partial<any>,
): Promise<{ abort: () => void }> {
    const publishToken = config?.body?.publishToken;
    const accessToken = config?.body?.accessToken;

    if (!publishToken) {
        throw new Error("Publish token is required");
    }
    if (!accessToken) {
        throw new Error("Access token is required");
    }

    delete config.body?.publishToken;
    delete config.body?.accessToken;

    return useConsoleStream(`/v1/${publishToken}/chat`, {
        ...config,
        messages,
        responseMode: "streaming",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...config?.headers,
        },
    });
}
