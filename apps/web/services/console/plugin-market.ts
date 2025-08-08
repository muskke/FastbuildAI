import type { PluginMarketItem, PluginMarketQueryRequest } from "@/models/plugin-market.d.ts";

// ==================== 插件市场查询相关 API ====================

/**
 * 获取插件市场列表
 * @description 根据查询条件分页获取插件市场中的插件列表
 * @param {PluginMarketQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<PluginMarketItem>>} 插件市场列表分页结果
 */
export function apiGetPluginMarketList(params: PluginMarketQueryRequest): Promise<any> {
    return useConsoleGet(
        "https://freebuildai-shop.yixiangonline.com/api/shop.plugin/lists",
        params,
        {
            skipBusinessCheck: true,
        },
    );
}

/**
 * 获取插件详情
 * @description 根据插件ID获取插件市场中指定插件的详细信息
 * @param {number} id 插件ID
 * @returns {Promise<PluginMarketItem>} 插件详情
 */
export function apiGetPluginMarketDetail(id: number): Promise<PluginMarketItem> {
    return useConsoleGet(
        "https://freebuildai-shop.yixiangonline.com/api/shop.plugin/detail",
        {
            params: { id },
        },
        {
            skipBusinessCheck: true,
        },
    );
}
