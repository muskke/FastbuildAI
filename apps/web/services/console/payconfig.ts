import type {
    BooleanNumberType,
    PayconfigInfo,
    PayconfigTableData,
    UpdatePayconfigDto,
} from "@/models/payconfig.d.ts";

/**
 * 获取支付配置列表
 *
 * @returns 支付配置列表
 */
export function apiGetPayconfigList(): Promise<PayconfigTableData[]> {
    return useConsoleGet("/system-payconfig");
}

/**
 * 根据ID获取支付配置详情
 *
 * @param id 支付配置ID
 * @returns 支付配置详情
 */
export function apiGetPayconfigById(id: string): Promise<PayconfigInfo> {
    return useConsoleGet(`/system-payconfig/${id}`);
}

/**
 * 根据id更改支付配置状态
 *
 * @param id 支付配置id
 * @param isEnable 是否启用
 * @returns 更新后的支付配置
 */
export function apiUpdatePayconfigStatus(
    id: string,
    isEnable: BooleanNumberType,
): Promise<PayconfigTableData> {
    return useConsolePatch(`/system-payconfig/${id}`, { isEnable });
}

/**
 * 更新支付配置
 *
 * @param id 支付配置id
 * @param data 更新后的支付配置
 * @returns 更新后的支付配置
 */
export function apiUpdatePayconfig(data: UpdatePayconfigDto): Promise<PayconfigInfo> {
    return useConsolePost(`/system-payconfig`, data);
}
