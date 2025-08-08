import type { OrderDetailData, OrderList, OrderListParams } from "@/models/order-recharge";

/**
 * 订单列表
 */
export const apiGetOrderList = (params: OrderListParams): Promise<OrderList> => {
    return useConsoleGet("/recharge-order", params);
};

/**
 * 订单详情
 */
export const apiGetOrderDetail = (id: string): Promise<OrderDetailData> => {
    return useConsoleGet("/recharge-order/" + id);
};

// 退款
export const apiRefund = (id: string): Promise<void> => {
    return useConsolePost("/recharge-order/refund", { id });
};
