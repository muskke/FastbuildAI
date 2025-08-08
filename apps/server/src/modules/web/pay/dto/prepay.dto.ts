import { PayFrom, PayFromValue } from "@common/interfaces/pay.interface";
import {
    PayConfigPayType,
    PayConfigType,
} from "@modules/console/system/inerface/payconfig.constant";
import { IsEnum, IsOptional, IsString } from "class-validator";

/**
 * 预支付DTO
 */
export class PrepayDto {
    /**
     * 订单号
     */
    @IsString({ message: "订单号不能为空" })
    orderId?: string;

    /**
     * 支付类型
     */
    @IsEnum(PayConfigPayType, { message: "支付类型错误" })
    payType?: PayConfigType;

    /**
     * 支付来源
     */
    @IsEnum(PayFrom, { message: "订单来源错误" })
    from: PayFromValue;
}
