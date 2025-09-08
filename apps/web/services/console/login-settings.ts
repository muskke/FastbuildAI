// ==================== 登录设置相关 API ====================

import type { LoginSettings } from "@/models/login-settings";

/**
 * 获取登录设置
 * @description 获取当前登录设置信息
 * @returns {Promise<LoginSettings>} 登录设置信息
 */
export const apiGetLoginSettings = (): Promise<LoginSettings> => {
    return useConsoleGet("/users/login-settings");
};

/**
 * 更新登录设置
 * @description 更新登录设置信息，支持部分更新
 * @param {LoginSettings} data 登录设置数据
 * @returns {Promise<{ success: boolean }>} 更新结果
 */
export const apiUpdateLoginSettings = (data: LoginSettings): Promise<{ success: boolean }> => {
    return useConsolePost("/users/login-settings", data);
};
