import { PaginationDto } from "@common/dto/pagination.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";

/**
 * 查询用户账户记录订单DTO
 */
export class QueryAccountLogDto extends PaginationDto {
    /**
     * 关键词搜索
     */
    @IsString()
    @IsOptional()
    keyword?: string;

    /**
     * 账户类型
     */
    @IsOptional()
    accountType?: number;
}
