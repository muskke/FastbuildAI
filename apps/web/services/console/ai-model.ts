import type {
    AiModelInfo,
    AiModelQueryRequest,
    CreateAiModelRequest,
    ProviderInfo,
    UpdateAiModelRequest,
} from "@/models/ai-provider.d.ts";
import type { PaginationResult } from "@/models/global";

// ==================== AI模型查询相关 API ====================

/**
 * 获取AI模型列表（分页）
 * @description 根据查询条件分页获取AI模型列表
 * @param {AiModelQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<AiModelInfo>>} 分页结果
 */
export function apiGetAiModelList(
    params: AiModelQueryRequest,
): Promise<PaginationResult<AiModelInfo>> {
    return useConsoleGet("/ai-models", params);
}

/**
 * 获取AI模型详情
 * @description 根据AI模型ID获取模型的基本详情信息
 * @param {string} id AI模型ID
 * @returns {Promise<AiModelInfo>} AI模型详情
 */
export function apiGetAiModelDetail(id: string): Promise<AiModelInfo> {
    return useConsoleGet(`/ai-models/${id}`);
}

/**
 * 获取AI模型完整详情（包含敏感信息）
 * @description 获取包含API密钥等敏感信息的完整AI模型详情
 * @param {string} id AI模型ID
 * @returns {Promise<AiModelInfo>} AI模型完整详情
 */
export function apiGetAiModelFullDetail(id: string): Promise<AiModelInfo> {
    return useConsoleGet(`/ai-models/${id}/full`);
}

/**
 * 根据能力筛选模型
 * @description 根据指定能力类型筛选可用的AI模型列表
 * @param {string} capability 能力类型
 * @returns {Promise<AiModelInfo[]>} 模型列表
 */
export function apiGetModelsByCapability(capability: string): Promise<AiModelInfo[]> {
    return useConsoleGet(`/ai-models/capability/${capability}`);
}

/**
 * 获取可用模型列表（不分页）
 * @description 获取所有可用的AI模型列表，不分页显示
 * @returns {Promise<AiModelInfo[]>} 可用模型列表
 */
export function apiGetAvailableModels(): Promise<AiModelInfo[]> {
    return useConsoleGet("/ai-models/available/all");
}

/**
 * 获取默认模型
 * @description 获取当前系统设置的默认AI模型
 * @returns {Promise<AiModelInfo>} 默认模型
 */
export function apiGetDefaultModel(): Promise<AiModelInfo> {
    return useConsoleGet("/ai-models/default/current");
}

// ==================== AI模型管理相关 API ====================

/**
 * 创建AI模型
 * @description 创建新的AI模型配置
 * @param {CreateAiModelRequest} data 创建数据
 * @returns {Promise<AiModelInfo>} 创建结果
 */
export function apiCreateAiModel(data: CreateAiModelRequest): Promise<AiModelInfo> {
    return useConsolePost("/ai-models", data);
}

/**
 * 更新AI模型
 * @description 根据AI模型ID更新模型配置信息
 * @param {string} id AI模型ID
 * @param {UpdateAiModelRequest} data 更新数据
 * @returns {Promise<AiModelInfo>} 更新结果
 */
export function apiUpdateAiModel(id: string, data: UpdateAiModelRequest): Promise<AiModelInfo> {
    return useConsolePatch(`/ai-models/${id}`, data);
}

/**
 * 删除AI模型
 * @description 根据AI模型ID删除指定的AI模型配置
 * @param {string} id AI模型ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteAiModel(id: string): Promise<void> {
    return useConsoleDelete(`/ai-models/${id}`);
}

/**
 * 批量删除AI模型
 * @description 根据AI模型ID数组批量删除多个AI模型
 * @param {string[]} ids AI模型ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiBatchDeleteAiModel(ids: string[]): Promise<void> {
    return useConsoleDelete("/ai-models", { ids });
}

// ==================== AI模型操作相关 API ====================

/**
 * 设置默认模型
 * @description 将指定的AI模型设置为系统默认模型
 * @param {string} id AI模型ID
 * @returns {Promise<void>} 设置结果
 */
export function apiSetDefaultModel(id: string): Promise<void> {
    return useConsolePut(`/ai-models/${id}/default`, {});
}

/**
 * 获取父级模型类型限制
 */
export function apiGetParentModelTypeLimit(params: { providerId: string }): Promise<string[]> {
    return useConsoleGet("/ai-models/type-father/list", params);
}
