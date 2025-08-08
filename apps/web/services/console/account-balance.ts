// ==================== 账户余额相关 API ====================

import type { AccountBalance } from "@/models/account-balance";

/**
 * 获取账户余额列表
 */
export const getAccountBalanceList = (params: {
    page?: number;
    pageSize?: number;
    accountType?: string;
    keyword?: string;
}): Promise<AccountBalance> => {
    return useConsoleGet("/finance/account-log", params);
};
