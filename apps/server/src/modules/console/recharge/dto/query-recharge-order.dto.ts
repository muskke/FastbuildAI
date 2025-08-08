import { PaginationDto } from "@common/dto/pagination.dto";
import {
    PayConfigPayType,
    PayConfigType,
} from "@modules/console/system/inerface/payconfig.constant";
import { IsEnum, IsOptional, IsString } from "class-validator";

/**
 * 查询充值订单DTO
 */
export class QueryRechargeOrderDto extends PaginationDto {
    /**
     * 订单号
     */
    @IsString()
    @IsOptional()
    orderNo?: string;

    /**
     * 关键词搜索
     */
    @IsString()
    @IsOptional()
    keyword?: string;

    /**
     * 支付类型
     */
    // @IsEnum(PayConfigPayType)
    @IsOptional()
    payType?: PayConfigType;

    /**
     * 支付状态
     */
    @IsOptional()
    payStatus?: number;

    /**
     * 退款状态
     */
    @IsOptional()
    refundStatus?: number;
}
