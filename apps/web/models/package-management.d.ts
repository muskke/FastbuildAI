/**
 * 套餐充值配置响应接口
 */
export interface RechargeConfigData {
    /**
     * 充值说明
     */
    rechargeExplain: string;
    /**
     * 充值规则
     */
    rechargeRule: RechargeRule[];
    /**
     * 充值开关：true-开启；false-关闭
     */
    rechargeStatus: boolean;
}

export interface RechargeRule {
    /**
     * 赠送数量
     */
    givePower: number;
    id?: string;
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
    sellPrice: string | number;
}
