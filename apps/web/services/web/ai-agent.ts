import { useWebGet } from "@/common/composables/useRequest";
import type { Agent } from "@/models/ai-agent";
import type { PaginationResult } from "@/models/global";

// ==================== 公开智能体相关 API ====================

/**
 * 查询公开智能体参数接口
 * @description 定义获取公开智能体列表时的查询参数
 */
export interface QueryPublicAgentParams {
    /** 搜索关键词（智能体名称或描述） */
    keyword?: string;
    /** 排序方式：latest-最新，popular-最热 */
    sortBy?: "latest" | "popular";
    /** 页码，从1开始 */
    page?: number;
    /** 每页数量，默认20 */
    pageSize?: number;
    /** 是否只显示已发布的智能体 */
    publishedOnly?: boolean;
}

/**
 * 获取公开智能体列表
 * @description 根据查询条件分页获取公开的智能体列表，支持关键词搜索、排序和分页
 * @param {QueryPublicAgentParams} params 查询参数对象
 * @returns {Promise<PaginationResult<Agent>>} 分页结果，包含智能体列表和分页信息
 */
export function apiGetPublicAgents(
    params: QueryPublicAgentParams,
): Promise<PaginationResult<Agent>> {
    return useWebGet("/ai-agents", params);
}
