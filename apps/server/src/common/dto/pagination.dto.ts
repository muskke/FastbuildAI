import { Transform } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

/**
 * 分页查询基础DTO
 *
 * 提供通用的分页参数，可被其他查询DTO继承
 */
export class PaginationDto {
    /**
     * 页码
     *
     * 从1开始
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: "页码必须是数字" })
    @Min(1, { message: "页码最小为1" })
    page?: number = 1;

    /**
     * 每页条数
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber({}, { message: "每页条数必须是数字" })
    @Min(1, { message: "每页条数最小为1" })
    pageSize?: number = 10;
}
