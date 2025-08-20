import type { ChatStreamConfig } from "@fastbuildai/http";

import type {
    AiConversation,
    AiMessage,
    AiModel,
    ChatConfig,
    CreateConversationParams,
    UpdateConversationParams,
} from "@/models/ai-conversation.d.ts";
import type { ModelType, Pagination, PaginationResult, QuickMenu } from "@/models/global";

// ==================== 供应商相关 API ====================

/**
 * 获取启用的AI供应商列表
 * @returns 供应商列表（包含模型信息）
 */
export function apiGetAiProviders(params?: { supportedModelTypes?: ModelType[] }): Promise<any[]> {
    return useWebGet("/ai-providers", params, { dedupe: false });
}

/**
 * 获取指定供应商详情
 * @param id 供应商ID
 * @returns 供应商详细信息
 */
export function apiGetAiProvider(id: string): Promise<any> {
    return useWebGet(`/ai-providers/${id}`);
}

/**
 * 根据供应商代码获取供应商
 * @param providerCode 供应商代码（如：openai, anthropic等）
 * @returns 供应商信息
 */
export function apiGetProviderByCode(providerCode: string): Promise<any> {
    return useWebGet(`/ai-providers/by-code/${providerCode}`);
}

/**
 * 根据能力筛选供应商
 * @param capability 能力类型（如：chat, image_generation等）
 * @returns 支持该能力的供应商列表
 */
export function apiGetAiProvidersByCapability(capability: string): Promise<any[]> {
    return useWebGet(`/ai-providers/capability/${capability}`);
}

/**
 * 获取供应商的模型列表
 * @param providerKey 供应商标识
 * @param capability 可选的能力筛选
 * @returns 该供应商下的模型列表
 */
export function apiGetProviderModels(providerKey: string, capability?: string): Promise<any[]> {
    const params = capability ? { capability } : undefined;
    return useWebGet(`/ai-providers/${providerKey}/models`, params);
}

// ==================== 模型相关 API ====================

/**
 * 获取用户可用的模型列表
 * @returns 模型列表
 */
export function apiGetAiModels(): Promise<AiModel[]> {
    return useWebGet("/ai-models");
}

/**
 * 获取模型详细信息
 * @param id 模型ID
 * @returns 模型详细信息
 */
export function apiGetAiModel(id: string): Promise<AiModel> {
    return useWebGet(`/ai-models/${id}`);
}

/**
 * 获取默认模型
 * @returns 默认模型信息
 */
export function apiGetDefaultAiModel(): Promise<AiModel> {
    return useWebGet("/ai-models/default/current");
}

/**
 * 根据能力筛选模型
 * @param capability 模型能力
 * @returns 符合条件的模型列表
 */
export function apiGetAiModelsByCapability(capability: string): Promise<AiModel[]> {
    return useWebGet(`/ai-models/capability/${capability}`);
}

/**
 * 获取对话记录（分页）
 * @param params 分页信息
 * @returns 分页结果
 */
export function apiGetAiConversationList(
    params: Pagination,
): Promise<PaginationResult<AiConversation[]>> {
    return useWebGet("/ai-conversations", params, { requireAuth: true });
}

/**
 * 获取对话详情
 * @param id 对话ID
 * @returns 对话详情
 */
export function apiGetAiConversationDetail(id: string): Promise<AiConversation> {
    return useWebGet(`/ai-conversations/${id}`);
}

/**
 * 创建新对话
 * @param data 对话创建数据
 * @returns 创建的对话信息
 */
export function apiCreateAiConversation(data: CreateConversationParams): Promise<AiConversation> {
    return useWebPost("/ai-conversations", data);
}

/**
 * 修改记录
 * @param id 记录ID
 * @param data 修改数据
 * @returns 修改结果
 */
export function apiUpdateAiConversation(
    id: string,
    data: UpdateConversationParams,
): Promise<AiConversation> {
    return useWebPatch(`/ai-conversations/${id}`, data);
}

/**
 * 删除记录
 * @param id 记录ID
 * @returns 删除结果
 */
export function apiDeleteAiConversation(id: string): Promise<void> {
    return useWebDelete(`/ai-conversations/${id}`);
}

/**
 * 获取对话的消息记录（分页）
 * @param id 对话ID
 * @param params 分页信息
 * @returns 消息记录分页结果
 */
export function apiGetAiConversation(
    id: string,
    params: Pagination,
): Promise<PaginationResult<AiMessage>> {
    return useWebGet(`/ai-conversations/${id}/messages`, params);
}

/**
 * 开始流式对话
 * @param messages 消息列表
 * @param config 流配置
 * @returns 流控制器
 */
export function apiChatStream(
    messages: AiMessage[] | any,
    config?: Partial<ChatStreamConfig>,
    mcpServers?: string[],
): Promise<{ abort: () => void }> {
    return useWebStream("/ai-chat/stream", { ...config, messages });
}

// ==================== 聊天配置相关 API ====================

/**
 * 获取聊天配置
 * @description 获取前台聊天页面的配置信息（建议选项和欢迎信息）
 * @returns {Promise<ChatConfig>} 聊天配置信息
 */
export function apiGetChatConfig(): Promise<ChatConfig> {
    return useWebGet("/config/chat");
}

// ==================== 快捷菜单相关 API ====================

/**
 * 获取快捷菜单配置
 * @description 获取前台快捷菜单配置信息
 * @returns {Promise<QuickMenuConfig>} 快捷菜单配置信息
 */
export function apiGetQuickMenu(): Promise<QuickMenu> {
    return useWebGet("/ai-mcp-servers/quick-menu", {}, { requireAuth: true });
}
