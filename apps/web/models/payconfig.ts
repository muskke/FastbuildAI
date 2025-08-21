/**
 * 支付方式常量
 */
export const PayConfigPayType = {
    WECHAT: 1, // 微信支付
    ALIPAY: 2, // 支付宝支付
} as const;

/**
 * 支付方式类型
 */
export type PayConfigType = (typeof PayConfigPayType)[keyof typeof PayConfigPayType];

/**
 * 支付方式键名类型
 */
export type PayConfigTypeKey = keyof typeof PayConfigPayType;
/**
 * 支付方式显示名称映射
 */
export const PayConfigPayTypeLabels: Record<PayConfigType, string> = {
    [PayConfigPayType.WECHAT]: "微信支付",
    [PayConfigPayType.ALIPAY]: "支付宝支付",
} as const;

/**
 * 支付配置信息接口
 */
export interface PayconfigInfo {
    id: string;
    name: string;
    logo: string;
    isEnable: number;
    isDefault: number;
    payType: PayConfigType; // 使用类型映射，只能是 1 或 2
    sort: number;
    payVersion: string;
    merchantType: string;
    mchId: string;
    apiKey: string;
    paySignKey: string;
    cert: string;
    payAuthDir: string;
    appId: string;
}
export interface UpdatePayconfigDto {
    id: string;
    name: string;
    logo: string;
    isEnable: number;
    isDefault: number;
    payVersion: string;
    merchantType: string;
    mchId: string;
    apiKey: string;
    paySignKey: string;
    sort: number;
    appId: string;
}
// 支付配置列表接口
export type PayconfigTableData = Pick<
    PayconfigInfo,
    "id" | "name" | "payType" | "isEnable" | "logo" | "isDefault" | "sort"
>;

export type BooleanNumberType = 0 | 1;
