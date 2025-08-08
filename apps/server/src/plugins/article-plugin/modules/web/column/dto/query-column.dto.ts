import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 前台栏目查询DTO
 */
export class QueryColumnDto {
    /**
     * 当前页码
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "页码必须是数字" })
    page?: number = 1;

    /**
     * 每页条数
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "每页条数必须是数字" })
    pageSize?: number = 10;

    /**
     * 栏目名称，模糊查询
     */
    @IsOptional()
    @IsString({ message: "栏目名称必须是字符串" })
    name?: string;

    /**
     * 栏目状态，前台固定为1（启用）
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "栏目状态必须是数字" })
    status?: number = 1;
}
