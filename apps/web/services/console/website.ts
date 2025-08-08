// ==================== 网站配置相关 API ====================

import type { UpdateWebsiteRequest, WebsiteConfig } from "@/models/website";

/**
 * 获取网站配置
 * @description 获取当前网站的配置信息，包括网站信息、协议、版权、统计等
 * @returns {Promise<WebsiteConfig>} 网站配置信息
 */
export const apiGetWebsiteConfig = (): Promise<WebsiteConfig> => {
    return useConsoleGet("/system-website");
};

/**
 * 更新网站配置
 * @description 更新网站配置信息，支持部分更新
 * @param {UpdateWebsiteRequest} data 网站配置数据
 * @returns {Promise<{ success: boolean }>} 更新结果
 */
export const apiUpdateWebsiteConfig = (
    data: UpdateWebsiteRequest,
): Promise<{ success: boolean }> => {
    return useConsolePost("/system-website", data);
};
