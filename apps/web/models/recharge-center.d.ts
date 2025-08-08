/**
 * 充值中心信息
 */
export interface RechargeCenterInfo {
    /**
     * 支付方式
     */
    payWayList: PayWayList[];
    /**
     * 充值说明
     */
    rechargeExplain: string;
    /**
     * 充值规则
     */
    rechargeRule: RechargeRule[];
    /**
     * 充值开关
     */
    rechargeStatus: boolean;
    /**
     * 用户信息
     */
    user: User;
}

/**
 * 支付方式
 */
export interface PayWayList {
    /**
     * logo
     */
    logo: string;
    /**
     * 厂商名称
     */
    name: string;
    /**
     * 支付方式
     */
    payType: number;
}

/**
 * 充值规则
 */
export interface RechargeRule {
    /**
     * 赠送数量
     */
    givePower: number;
    /**
     * id
     */
    id: string;
    /**
     * 标签
     */
    label: string;
    /**
     * 充值数量
     */
    power: number;
    /**
     * 售价
     */
    sellPrice: string;
}

/**
 * 用户信息
 */
export interface User {
    /**
     * 头像
     */
    avatar: string;
    /**
     * 用户id
     */
    id: string;
    /**
     * 算力
     */
    power: number;
    /**
     * 昵称
     */
    username: string;
}

/**
 * 订单提交参数
 */
export interface OrderParams {
    /**
     * 充值规则id
     */
    id: string;
    /**
     * 支付方式
     */
    payType: number;
}

/**
 * 订单信息
 */
export interface OrderInfo {
    /**
     * 订单金额
     */
    orderAmount: string;
    /**
     * 订单id
     */
    orderId: string;
    /**
     * 订单编号
     */
    orderNo: string;
}

/**
 * 预付款参数
 */
export interface PrepaidParams {
    /**
     * 订单来源:recharge-充值订单
     */
    from: string;
    /**
     * 订单id
     */
    orderId: string;
    /**
     * 支付方式
     */
    payType: number;
}

/**
 * 预付款信息
 */
export interface PrepaidInfo {
    /**
     * 支付方式
     */
    payType: number;
    /**
     * 付款码：base64格式
     */
    qrCode: QrCode;
}

/**
 * 付款码：base64格式
 */
export interface QrCode {
    code_url: string;
}

/**
 * 支付结果
 */
export interface PayResult {
    /**
     * 订单id
     */
    id: string;
    /**
     * 订单编号
     */
    orderNo: string;
    /**
     * 支付状态：0-未支付；1-已支付
     */
    payStatus: number;
}
