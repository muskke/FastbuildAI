/**
 * 财务中心信息
 */
export interface FinancialCenterInfo {
    /**
     * 经营概况
     */
    finance: Finance;
    /**
     * 订单概况
     */
    recharge: Recharge;
    /**
     * 用户概况
     */
    user: User;
}

/**
 * 经营概况
 */
export interface Finance {
    /**
     * 累计收入金额
     */
    totalIncomeAmount: number;
    /**
     * 累计订单数（笔）
     */
    totalIncomeNum: number;
    /**
     * 累计净收入
     */
    totalNetIncome: number;
    /**
     * 累计退款金额
     */
    totalRefundAmount: number;
    /**
     * 累计退款订单
     */
    totalRefundNum: number;
}

/**
 * 订单概况
 */
export interface Recharge {
    /**
     * 累计充值金额
     */
    rechargeAmount: number;
    /**
     * 充值净收入
     */
    rechargeNetIncome: number;
    /**
     * 充值订单数
     */
    rechargeNum: number;
    /**
     * 累计退款金额
     */
    rechargeRefundAmount: number;
    /**
     * 退款订单
     */
    rechargeRefundNum: number;
}

/**
 * 用户概况
 */
export interface User {
    /**
     * 用户累计消费金额
     */
    totalChatNum: number;
    /**
     * 用户剩余算力
     */
    totalPowerSum: number;
    /**
     * 用户累计提问次数
     */
    totalRechargeAmount: number;
    /**
     * 累计充值人数
     */
    totalRechargeNum: number;
    /**
     * 用户总人数
     */
    totalUserNum: number;
}
