import type { PurchaseRecord } from "@/models/purchase-record";

/**
 * 购买记录
 */
export function apiPurchaseRecord(params: {
    page: number;
    pageSize: number;
}): Promise<PurchaseRecord> {
    return useWebGet("/recharge/lists", params);
}
