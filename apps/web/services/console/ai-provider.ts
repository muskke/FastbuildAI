import type {
    AiProviderInfo,
    AiProviderQueryParams,
    CreateAiProviderRequest,
    ModelType,
    UpdateAiProviderRequest,
} from "@/models/ai-provider.d.ts";

// ==================== AI供应商查询相关 API ====================

/**
 * 获取AI供应商列表
 * @description 根据查询条件获取AI供应商列表
 * @param {AiProviderQueryParams} params 查询参数
 * @returns {Promise<AiProviderInfo[]>} 供应商列表
 */
export function apiGetAiProviderList(params?: AiProviderQueryParams): Promise<AiProviderInfo[]> {
    return useConsoleGet("/ai-providers", params);
}

/**
 * 获取AI供应商详情
 * @description 根据供应商ID获取AI供应商的基本详情信息
 * @param {string} id 供应商ID
 * @returns {Promise<AiProviderInfo>} 供应商详情
 */
export function apiGetAiProviderDetail(id: string): Promise<AiProviderInfo> {
    return useConsoleGet(`/ai-providers/${id}`);
}

/**
 * 获取AI供应商完整详情（包含敏感信息）
 * @description 获取包含API密钥等敏感信息的完整AI供应商详情
 * @param {string} id 供应商ID
 * @returns {Promise<AiProviderInfo>} 供应商完整详情
 */
export function apiGetAiProviderFullDetail(id: string): Promise<AiProviderInfo> {
    return useConsoleGet(`/ai-providers/${id}/full`);
}

// ==================== AI供应商管理相关 API ====================

/**
 * 创建AI供应商
 * @description 创建新的AI供应商配置
 * @param {CreateAiProviderRequest} data 供应商创建数据
 * @returns {Promise<AiProviderInfo>} 创建的供应商信息
 */
export function apiCreateAiProvider(data: CreateAiProviderRequest): Promise<AiProviderInfo> {
    return useConsolePost("/ai-providers", data);
}

/**
 * 更新AI供应商
 * @description 根据供应商ID更新AI供应商配置信息
 * @param {string} id 供应商ID
 * @param {UpdateAiProviderRequest} data 更新数据
 * @returns {Promise<AiProviderInfo>} 更新结果
 */
export function apiUpdateAiProvider(
    id: string,
    data: UpdateAiProviderRequest,
): Promise<AiProviderInfo> {
    return useConsolePatch(`/ai-providers/${id}`, data);
}

/**
 * 删除AI供应商
 * @description 根据供应商ID删除指定的AI供应商配置
 * @param {string} id 供应商ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteAiProvider(id: string): Promise<void> {
    return useConsoleDelete(`/ai-providers/${id}`);
}

/**
 * 批量删除AI供应商
 * @description 根据供应商ID数组批量删除多个AI供应商
 * @param {string[]} ids 供应商ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiBatchDeleteAiProviders(ids: string[]): Promise<void> {
    return useConsoleDelete("/ai-providers", { ids });
}

// ==================== AI供应商操作相关 API ====================

/**
 * 测试AI供应商连接
 * @description 测试指定AI供应商的连接状态和可用性
 * @param {string} id 供应商ID
 * @returns {Promise<{ success: boolean; message: string }>} 测试结果
 */
export function apiTestAiProviderConnection(
    id: string,
): Promise<{ success: boolean; message: string }> {
    return useConsolePost(`/ai-providers/${id}/test-connection`);
}

/**
 * 切换AI供应商启用状态
 * @description 切换指定AI供应商的启用/禁用状态
 * @param {string} id 供应商ID
 * @param {boolean} isActive 是否启用
 * @returns {Promise<AiProviderInfo>} 更新结果
 */
export function apiToggleAiProviderActive(id: string, isActive: boolean): Promise<AiProviderInfo> {
    return useConsolePatch(`/ai-providers/${id}/toggle-active`, { isActive });
}

/**
 * 模型类型查询
 */
export function apiGetAiProviderModelTypes(): Promise<ModelType[]> {
    return useConsoleGet("/ai-models/type/list");
}
