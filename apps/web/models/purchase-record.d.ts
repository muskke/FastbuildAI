/**
 * 购买记录
 */
export interface PurchaseRecord {
    items: PurchaseRecordItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface PurchaseRecordItem {
    /**
     * 下单时间
     */
    createdAt?: string;
    /**
     * 赠送数量
     */
    givePower?: number;
    /**
     * 订单id
     */
    id?: string;
    /**
     * 实付金额
     */
    orderAmount?: string;
    /**
     * 订单编号
     */
    orderNo?: string;
    /**
     * 支付方式
     */
    payType?: number;
    /**
     * 支付方式描述
     */
    payTypeDesc?: string;
    /**
     * 充值数量
     */
    power?: number;
    /**
     * 退款状态：0-否；1-是
     */
    refundStatus?: number;
    /**
     * 总价
     */
    totalAmount?: string;
    /**
     * 实际到账数量
     */
    totalPower?: number;
}
