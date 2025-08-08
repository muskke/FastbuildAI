// ==================== 套餐管理相关 API ====================

import type { RechargeConfigData } from "@/models/package-management";

/**
 * 获取套餐充值配置
 */
export const apiGetRechargeRules = (): Promise<RechargeConfigData> => {
    return useConsoleGet("/recharge-config");
};

/**
 * 保存套餐充值配置
 */
export const saveRechargeRules = (data: RechargeConfigData): Promise<void> => {
    return useConsolePost("/recharge-config", data);
};
