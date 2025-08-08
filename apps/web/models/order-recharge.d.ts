/**
 * 订单列表参数
 */
export interface OrderListParams {
    /**
     * 用户信息
     */
    keyword?: string;
    /**
     * 订单编号
     */
    orderNo?: string;
    /**
     * 支付方式
     */
    payType?: string;
    /**
     * 退款状态：1-已退款；0-未退款
     */
    refundStatus?: string;
    /**
     * 页码
     */
    page?: number;
    /**
     * 页大小
     */
    pageSize?: number;
    /**
     * 支付状态
     */
    payStatus?: string;
}

/**
 * 订单列表
 */
export interface OrderList {
    items: OrderListItem[];
    page: number;
    pageSize: number;
    /**
     * 支付方式
     */
    payTypeLists: string;
    /**
     * 统计数量
     */
    statistics: Statistics;
    total: number;
    totalPages: number;
}

export interface OrderListItem {
    createdAt?: string;
    /**
     * 赠送数量
     */
    givePower?: number;
    id?: string;
    /**
     * 订单编号
     */
    orderNo?: string;
    /**
     * 订单金额
     */
    orderAmount?: string;
    /**
     * 支付状态：1-已支付；0-未支付
     */
    payStatus?: number;
    /**
     * 支付状态
     */
    payStatusDesc?: string;
    /**
     * 支付时间
     */
    payTime?: null;
    payType?: number;
    /**
     * 支付方式
     */
    payTypeDesc?: string;
    /**
     * 充值数量
     */
    power?: number;
    /**
     * 退款状态：1-已退款；0-未退款
     */
    refundStatus?: number;
    /**
     * 总算力
     */
    totalPower?: number;
    /**
     * 用户信息
     */
    user?: User;
}

/**
 * 用户信息
 */
export interface User {
    avatar: string;
    username: string;
}

/**
 * 统计数量
 */
export interface Statistics {
    /**
     * 累计充值金额
     */
    totalAmount: number;
    /**
     * 净收入
     */
    totalIncome: number;
    /**
     * 充值订单数量
     */
    totalOrder: number;
    /**
     * 退款金额
     */
    totalRefundAmount: number;
    /**
     * 退款订单
     */
    totalRefundOrder: number;
}

/**
 * 订单详情
 */
export interface OrderDetailData {
    createdAt: string;
    /**
     * 赠送数量
     */
    givePower: number;
    id: string;
    /**
     * 订单数量
     */
    orderAmount: string;
    /**
     * 订单编号
     */
    orderNo: string;
    /**
     * 订单状态
     */
    orderType: string;
    /**
     * 订单来源
     */
    terminalDesc?: string;
    /**
     * 退款单号
     */
    refundNo?: string;
    /**
     * 支付状态
     */
    payStatus: number;
    /**
     * 支付时间
     */
    payTime: string;
    payType: number;
    /**
     * 支付方式
     */
    payTypeDesc: string;
    /**
     * 充值数量
     */
    power: number;
    /**
     * 退款状态
     */
    refundStatus: number;
    /**
     * 退款状态描述
     */
    refundStatusDesc: string;
    /**
     * 总充值数量
     */
    totalPower: number;
    user: User;
}
