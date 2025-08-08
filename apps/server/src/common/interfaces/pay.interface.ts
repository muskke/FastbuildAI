import { PayConfigType } from "@modules/console/system/inerface/payconfig.constant";

export const PayFrom = {
    RECHARGE: "recharge",
    ORDER: "order",
} as const;
export type PayFromValue = (typeof PayFrom)[keyof typeof PayFrom];

export interface PayOrder {
    orderSn: string;
    amount: number;
    payType: PayConfigType;
    from: PayFromValue;
}
export interface PayParams {
    payType: PayConfigType;
    appid: string;
    mchId: string;
    publicKey: string;
    privateKey: string;
}
