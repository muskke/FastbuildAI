import type { LayoutData } from "@/models/decorate.d.ts";

// ==================== 布局配置相关 API ====================

/**
 * 获取前台布局配置
 * @description 根据布局类型获取对应的布局配置信息
 * @param {string} type 布局类型 (如: web)
 * @returns {Promise<LayoutData>} 布局配置信息
 */
export function apiGetWebLayoutConfig(type: string): Promise<LayoutData> {
    return useWebGet(`/decorate-page/layout/${type}`);
}

// ==================== 微页面相关 API ====================

/**
 * 获取微页面详情
 * @description 根据微页面ID获取微页面的详细配置信息
 * @param {string} id 微页面ID
 * @returns {Promise<any>} 微页面详情数据
 */
export function apiGetWebMicropageDetail(id: string): Promise<any> {
    return useWebGet(`/decorate-page/micropage/${id}`);
}
