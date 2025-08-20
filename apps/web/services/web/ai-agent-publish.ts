import {
    useConsoleDelete,
    useConsoleGet,
    useConsolePost,
    useConsolePut,
} from "@/common/composables/useRequest";
import type { AiMessage } from "@/models";
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

// ==================== 公开智能体对话相关 API ====================

/**
 * 获取公开智能体信息
 * @param publishToken 发布令牌
 * @returns 智能体公开信息
 */
export function apiGetPublicAgentInfo(publishToken: string, accessToken: string): Promise<any> {
    return useConsoleGet(
        `/public-agent/${publishToken}/info`,
        {},
        {
            headers: {
                "X-Public-Access-Token": accessToken,
            },
            requireAuth: false,
        },
    );
}

/**
 * 生成公开智能体访问令牌
 * @param publishToken 发布令牌
 * @returns 访问令牌信息
 */
export function apiGeneratePublicAgentAccessToken(publishToken: string): Promise<{
    accessToken: string;
    agentId: string;
    agentName: string;
    description: string;
}> {
    return useConsolePost(
        `/public-agent/${publishToken}/generate-access-token`,
        {},
        {
            requireAuth: false,
        },
    );
}

/**
 * 获取公开智能体对话记录列表（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param params 查询参数
 * @returns 对话记录列表
 */
export function apiGetPublicAgentConversations(
    publishToken: string,
    accessToken: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<any> {
    return useConsoleGet(`/public-agent/${publishToken}/conversations`, params, {
        headers: {
            "X-Public-Access-Token": accessToken,
        },
        requireAuth: false,
    });
}

/**
 * 获取公开智能体对话消息（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @param params 查询参数
 * @returns 对话消息列表
 */
export function apiGetPublicAgentMessages(
    publishToken: string,
    accessToken: string,
    conversationId: string,
    params: { page?: number; pageSize?: number } = {},
): Promise<any> {
    return useConsoleGet(
        `/public-agent/${publishToken}/conversations/${conversationId}/messages`,
        params,
        {
            headers: {
                "X-Public-Access-Token": accessToken,
            },
            requireAuth: false,
        },
    );
}

/**
 * 删除公开智能体对话记录（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @returns 删除结果
 */
export function apiDeletePublicAgentConversation(
    publishToken: string,
    accessToken: string,
    conversationId: string,
): Promise<any> {
    return useConsoleDelete(
        `/public-agent/${publishToken}/conversations/${conversationId}`,
        undefined,
        {
            headers: {
                "X-Public-Access-Token": accessToken,
            },
            requireAuth: false,
        },
    );
}

/**
 * 更新公开智能体对话记录（使用访问令牌）
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param conversationId 对话ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export function apiUpdatePublicAgentConversation(
    publishToken: string,
    accessToken: string,
    conversationId: string,
    updateData: { title?: string },
): Promise<any> {
    return useConsolePut(
        `/public-agent/${publishToken}/conversations/${conversationId}`,
        updateData,
        {
            headers: {
                "X-Public-Access-Token": accessToken,
            },
            requireAuth: false,
        },
    );
}

// ==================== 公开智能体标注相关 API ====================

/**
 * 游客创建标注
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param data 创建标注数据
 * @returns 创建的标注
 */
export function apiCreatePublicAgentAnnotation(
    publishToken: string,
    accessToken: string,
    data: CreateAgentAnnotationParams,
): Promise<any> {
    return useConsolePost(`/public-agent/${publishToken}/annotations`, data, {
        headers: {
            "X-Public-Access-Token": accessToken,
        },
        requireAuth: false,
    });
}

/**
 * 获取公开智能体标注详情
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param annotationId 标注ID
 * @returns 标注详情
 */
export function apiGetPublicAgentAnnotationDetail(
    publishToken: string,
    accessToken: string,
    annotationId: string,
): Promise<any> {
    return useConsoleGet(
        `/public-agent/${publishToken}/annotations/${annotationId}`,
        {},
        {
            headers: {
                "X-Public-Access-Token": accessToken,
            },
            requireAuth: false,
        },
    );
}

/**
 * 游客更新标注
 * @param publishToken 发布令牌
 * @param accessToken 访问令牌
 * @param annotationId 标注ID
 * @param data 更新标注数据
 * @returns 更新后的标注
 */
export function apiUpdatePublicAgentAnnotation(
    publishToken: string,
    accessToken: string,
    annotationId: string,
    data: UpdateAgentAnnotationParams,
): Promise<any> {
    return useConsolePut(`/public-agent/${publishToken}/annotations/${annotationId}`, data, {
        headers: {
            "X-Public-Access-Token": accessToken,
        },
        requireAuth: false,
    });
}

/**
 * 公开智能体流式对话（兼容 useChat）
 * @param messages 消息列表
 * @param config 对话配置（包含publishToken和accessToken）
 * @returns 流控制器
 */
export function apiPublicAgentChatByAccessToken(
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

    return useConsoleStream(`/public-agent/${publishToken}/chat/stream`, {
        ...config,
        messages,
        headers: {
            "X-Public-Access-Token": accessToken,
            ...config?.headers,
        },
    });
}
