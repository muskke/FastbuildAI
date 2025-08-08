import type { PowerDetailData, PowerDetailQueryParams } from "@/models/power-detail";

/**
 * 算力明细接口
 */
export function apiGetPowerDetailList(params?: PowerDetailQueryParams): Promise<PowerDetailData> {
    return useWebGet("/user/account-log", params);
}
