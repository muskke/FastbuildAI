// ==================== 财务中心相关 API ====================

import type { FinancialCenterInfo } from "@/models/financial-center";

/**
 * 获取财务中心信息
 */
export function apiGetFinancialCenterInfo(): Promise<FinancialCenterInfo> {
    return useConsoleGet("/finance/center");
}
