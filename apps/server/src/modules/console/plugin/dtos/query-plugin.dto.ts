import { PaginationDto } from "@common/dto/pagination.dto";
import { isEnabled } from "@common/utils/is.util";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

/**
 * 查询插件DTO
 */
export class QueryPlugDto extends PaginationDto {
    /**
     * 插件名称
     */
    @IsOptional()
    @IsString({ message: "插件名称必须是字符串" })
    name?: string;

    /**
     * 是否启用
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    @Transform(({ value }) => {
        if (value === undefined || value === null) return value;
        return isEnabled(value);
    })
    isEnabled?: boolean;

    /**
     * 是否已安装
     */
    @IsOptional()
    @IsBoolean({ message: "是否已安装必须是布尔值" })
    @Transform(({ value }) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
    })
    isInstalled?: boolean;
}
