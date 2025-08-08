import type {
    AiConversation,
    AiMessage,
    ChatConfig,
    ConversationQueryParams,
    UpdateChatConfigDto,
} from "@/models/ai-conversation.d.ts";
import type { PaginationResult } from "@/models/global";

// ==================== 对话查询相关 API ====================

/**
 * 获取对话记录列表
 * @description 根据查询条件分页获取AI对话记录列表
 * @param {ConversationQueryParams} params 查询参数
 * @returns {Promise<PaginationResult<AiConversation[]>>} 对话记录分页结果
 */
export function apiGetConversationList(
    params?: ConversationQueryParams,
): Promise<PaginationResult<AiConversation[]>> {
    return useConsoleGet("/ai-conversations", params);
}

/**
 * 获取对话详情
 * @description 根据对话ID获取对话的详细信息
 * @param {string} id 对话ID
 * @returns {Promise<AiConversation>} 对话详情
 */
export function apiGetConversationDetail(id: string): Promise<AiConversation> {
    return useConsoleGet(`/ai-conversations/${id}`);
}

/**
 * 获取对话消息列表
 * @description 获取指定对话的消息记录列表
 * @param {string} conversationId 对话ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页条数
 * @returns {Promise<PaginationResult<AiMessage[]>>} 消息列表分页结果
 */
export function apiGetConversationMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
): Promise<PaginationResult<AiMessage[]>> {
    return useConsoleGet(`/ai-conversations/${conversationId}/messages`, params);
}

// ==================== 对话管理相关 API ====================

/**
 * 删除对话
 * @description 根据对话ID删除指定的AI对话记录
 * @param {string} id 对话ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteConversation(id: string): Promise<void> {
    return useConsoleDelete(`/ai-conversations/${id}`);
}

/**
 * 批量删除对话
 * @description 根据对话ID数组批量删除多个AI对话记录
 * @param {string[]} ids 对话ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiBatchDeleteConversations(ids: string[]): Promise<void> {
    return useConsolePost("/ai-conversations/batch-delete", { ids });
}

// ==================== 对话操作相关 API ====================

/**
 * 置顶/取消置顶对话
 * @description 设置或取消对话的置顶状态
 * @param {string} id 对话ID
 * @param {boolean} isPinned 是否置顶
 * @returns {Promise<void>} 操作结果
 */
export function apiToggleConversationPin(id: string, isPinned: boolean): Promise<void> {
    return useConsolePut(`/ai-conversations/${id}/pin`, { isPinned });
}

// ==================== 聊天配置相关 API ====================

/**
 * 获取聊天配置
 * @description 获取当前的聊天页面配置信息（建议选项和欢迎信息）
 * @returns {Promise<ChatConfig>} 聊天配置信息
 */
export function apiGetChatConfig(): Promise<ChatConfig> {
    return useConsoleGet("/ai-conversations/config");
}

/**
 * 更新聊天配置
 * @description 更新聊天页面的配置信息（建议选项和欢迎信息）
 * @param {UpdateChatConfigDto} data 更新数据
 * @returns {Promise<ChatConfig>} 更新后的配置信息
 */
export function apiUpdateChatConfig(data: UpdateChatConfigDto): Promise<ChatConfig> {
    return useConsolePut("/ai-conversations/config", data);
}
