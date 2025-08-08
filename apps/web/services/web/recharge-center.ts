// ==================== 充值中心相关 API ====================

import type {
    OrderInfo,
    OrderParams,
    PayResult,
    PrepaidInfo,
    PrepaidParams,
    RechargeCenterInfo,
} from "@/models/recharge-center";

/**
 * 获取充值中心信息
 */
export const getRechargeCenterInfo = (): Promise<RechargeCenterInfo> => {
    return useWebGet("/recharge/center");
};

/**
 * 充值提交订单
 */
export const recharge = (data: OrderParams): Promise<OrderInfo> => {
    return useWebPost("/recharge/submitRecharge", data);
};

/**
 * 预付款
 */
export const prepaid = (data: PrepaidParams): Promise<PrepaidInfo> => {
    return useWebPost("/pay/prepay", data);
};

/**
 * 获取支付结果
 */
export const getPayResult = (params: { orderId?: string; from: string }): Promise<PayResult> => {
    return useWebGet("/pay/getPayResult", params);
};
