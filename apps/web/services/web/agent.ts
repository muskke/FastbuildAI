import {
    useWebDelete,
    useWebGet,
    useWebPatch,
    useWebPost,
    useWebPut,
} from "@/common/composables/useRequest";
import type { AiMessage } from "@/models";
import type {
    Agent,
    AgentAnnotation,
    AgentChatMessage,
    AgentChatParams,
    AgentChatRecord,
    AgentChatResponse,
    AgentChatTestParams,
    AgentStatistics,
    AnnotationMatchResult,
    BatchDeleteChatRecordParams,
    CreateAgentAnnotationParams,
    CreateChatRecordParams,
    FormFieldConfig,
    ModelConfig,
    QueryAgentAnnotationParams,
    QueryAgentChatRecordParams,
    QueryAgentParams,
    QueryAgentStatisticsParams,
    ReviewAnnotationParams,
    UpdateAgentAnnotationParams,
    UpdateAgentConfigParams,
} from "@/models/agent";
import type { PaginationResult } from "@/models/global";

// ==================== 重新导出类型 ====================

export type {
    Agent,
    AgentAnnotation,
    AgentChatParams,
    AgentChatRecord,
    AgentChatResponse,
    AgentChatTestParams,
    AgentStatistics,
    AnnotationMatchResult,
    BatchDeleteChatRecordParams,
    CreateAgentAnnotationParams,
    CreateChatRecordParams,
    FormFieldConfig,
    ModelConfig,
    QueryAgentAnnotationParams,
    QueryAgentChatRecordParams,
    QueryAgentParams,
    UpdateAgentAnnotationParams,
    UpdateAgentConfigParams,
};

// ==================== 智能体管理相关 API ====================

/**
 * 创建智能体
 * @param data 智能体创建数据
 * @returns 创建的智能体信息
 */
export function apiCreateAgent(data: UpdateAgentConfigParams): Promise<Agent> {
    return useWebPost("/agent", data);
}

/**
 * 获取智能体列表
 * @param params 查询参数
 * @returns 智能体列表和分页信息
 */
export function apiGetAgentList(params: QueryAgentParams): Promise<PaginationResult<Agent>> {
    return useWebGet("/agent", params, { requireAuth: true });
}

/**
 * 获取智能体详情
 * @param id 智能体ID
 * @returns 智能体详情
 */
export function apiGetAgentDetail(id: string): Promise<Agent> {
    return useWebGet(`/agent/${id}`);
}

/**
 * 更新智能体配置
 * @param id 智能体ID
 * @param data 更新数据
 * @returns 更新后的智能体信息
 */
export function apiUpdateAgentConfig(id: string, data: UpdateAgentConfigParams): Promise<Agent> {
    return useWebPatch(`/agent/${id}`, data);
}

/**
 * 删除智能体
 * @param id 智能体ID
 * @returns 删除结果
 */
export function apiDeleteAgent(id: string): Promise<{ message: string }> {
    return useWebDelete(`/agent/${id}`);
}

// ==================== 智能体对话相关 API ====================

/**
 * 智能体流式对话
 * @param messages 消息列表
 * @param config 对话配置（包含agentId）
 * @returns 流控制器
 */
export function apiAgentChat(
    messages: AiMessage[] | any,
    config?: Partial<any>,
): Promise<{ abort: () => void }> {
    const agentId = config?.agentId || config?.body?.agentId;
    if (!agentId) {
        throw new Error("Agent ID is required");
    }
    delete config.body?.agentId;
    return useWebStream(`/agent/${agentId}/chat/stream`, { ...config, messages });
}

// ==================== 智能体对话记录相关 API ====================

/**
 * 获取智能体对话记录列表
 * @param params 查询参数
 * @returns 对话记录列表和分页信息
 */
export function apiGetAgentChatRecordList(
    params: QueryAgentChatRecordParams,
): Promise<PaginationResult<AgentChatRecord[]>> {
    return useWebGet("/agent-chat-record", params, { requireAuth: true });
}

/**
 * 获取对话记录详情
 * @param id 对话记录ID
 * @returns 对话记录详情
 */
export function apiGetAgentChatRecordDetail(id: string): Promise<AgentChatRecord> {
    return useWebGet(`/agent-chat-record/${id}`);
}

/**
 * 获取Agent对话记录的消息列表
 * @param conversationId 对话记录ID
 * @param params 分页参数
 * @returns 消息列表和分页信息
 */
export function apiGetAgentChatMessages(
    conversationId: string,
    params: { page?: number; pageSize?: number },
): Promise<PaginationResult<AgentChatMessage[]>> {
    return useWebGet(`/agent-chat-message/conversation/${conversationId}`, params, {
        requireAuth: true,
    });
}

/**
 * 创建对话记录
 * @param data 创建参数
 * @returns 创建的对话记录
 */
export function apiCreateAgentChatRecord(data: CreateChatRecordParams): Promise<AgentChatRecord> {
    return useWebPost("/agent-chat-record", data);
}

/**
 * 批量删除对话记录
 * @param data 批量删除参数
 * @returns 删除结果
 */
export function apiBatchDeleteAgentChatRecords(
    data: BatchDeleteChatRecordParams,
): Promise<{ message: string }> {
    return useWebDelete("/agent-chat-record/batch", data);
}

/**
 * 删除单个对话记录
 * @param id 对话记录ID
 * @returns 删除结果
 */
export function apiDeleteAgentChatRecord(id: string): Promise<{ message: string }> {
    return useWebDelete(`/agent-chat-record/${id}`);
}

// ==================== 智能体标注相关 API ====================

/**
 * 创建智能体标注
 * @param agentId 智能体ID
 * @param data 标注创建数据
 * @returns 创建的标注信息
 */
export function apiCreateAgentAnnotation(
    agentId: string,
    data: CreateAgentAnnotationParams,
): Promise<AgentAnnotation> {
    return useWebPost(`/agent-annotations`, { ...data, agentId });
}

/**
 * 获取智能体标注列表
 * @param params 查询参数
 * @returns 标注列表
 */
export function apiGetAgentAnnotationList(
    params?: QueryAgentAnnotationParams,
): Promise<PaginationResult<AgentAnnotation>> {
    return useWebGet(`/agent-annotations`, params);
}

/**
 * 获取标注详情
 * @param annotationId 标注ID
 * @returns 标注详情
 */
export function apiGetAgentAnnotationDetail(annotationId: string): Promise<AgentAnnotation> {
    return useWebGet(`/agent-annotations/${annotationId}`);
}

/**
 * 更新智能体标注
 * @param annotationId 标注ID
 * @param data 更新数据
 * @returns 更新后的标注信息
 */
export function apiUpdateAgentAnnotation(
    annotationId: string,
    data: UpdateAgentAnnotationParams,
): Promise<AgentAnnotation> {
    return useWebPut(`/agent-annotations/${annotationId}`, data);
}

/**
 * 审核智能体标注
 * @param annotationId 标注ID
 * @param data 审核数据
 * @returns 审核后的标注信息
 */
export function apiReviewAgentAnnotation(
    annotationId: string,
    data: ReviewAnnotationParams,
): Promise<AgentAnnotation> {
    return useWebPut(`/agent-annotations/${annotationId}/review`, data);
}

/**
 * 删除智能体标注
 * @param annotationId 标注ID
 * @returns 删除结果
 */
export function apiDeleteAgentAnnotation(annotationId: string): Promise<{ message: string }> {
    return useWebDelete(`/agent-annotations/${annotationId}`);
}

/**
 * 获取智能体统计信息
 * @param agentId 智能体ID
 * @returns 统计数据
 */
export function apiGetAgentStatistics(
    agentId: string,
    params?: QueryAgentStatisticsParams,
): Promise<AgentStatistics> {
    return useWebGet(`/agent/${agentId}/statistics`, params);
}
