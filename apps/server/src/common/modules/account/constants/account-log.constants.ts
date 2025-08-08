/**
 * 余额变动枚举
 */
export enum ACCOUNT_LOG_TYPE {
    /**
     * 充值订单增加余额的变动
     */
    RECHARGEORDER_INC = 100,
    RECHARGEORDER_GIVE_INC = 101,
    RECHARGEORDER_DEC = 102,
}
export type ACCOUNT_LOG_TYPE_VALUE = (typeof ACCOUNT_LOG_TYPE)[keyof typeof ACCOUNT_LOG_TYPE];
export enum ACTION {
    DEC = 0,
    INC = 1,
}
export type ACTION_VALUE = (typeof ACTION)[keyof typeof ACTION];

/**
 * 余额变动描述
 */
export const ACCOUNT_LOG_TYPE_DESCRIPTION = {
    [ACCOUNT_LOG_TYPE.RECHARGEORDER_INC]: "充值增加算力",
    [ACCOUNT_LOG_TYPE.RECHARGEORDER_GIVE_INC]: "充值赠送增加算力",
    [ACCOUNT_LOG_TYPE.RECHARGEORDER_DEC]: "充值退款退回算力",
} as const;
