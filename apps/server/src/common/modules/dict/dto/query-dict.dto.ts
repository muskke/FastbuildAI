import { PaginationDto } from "@common/dto/pagination.dto";
import { isEnabled } from "@common/utils/is.util";
import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

/**
 * 查询字典配置DTO
 */
export class QueryDictDto extends PaginationDto {
    /**
     * 配置键
     * 支持模糊查询
     */
    @IsString()
    @IsOptional()
    key?: string;

    /**
     * 配置分组
     */
    @IsString()
    @IsOptional()
    group?: string;

    /**
     * 是否启用
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return value;
        return isEnabled(value);
    })
    isEnabled?: boolean;
}
