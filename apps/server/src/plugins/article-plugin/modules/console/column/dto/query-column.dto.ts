import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 查询栏目DTO
 */
export class QueryColumnDto {
    /**
     * 栏目名称（模糊搜索）
     */
    @IsOptional()
    @IsString({ message: "栏目名称必须是字符串" })
    name?: string;

    /**
     * 栏目状态：0-禁用，1-启用
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "栏目状态必须是数字" })
    @IsIn([0, 1], { message: "栏目状态只能是0或1" })
    status?: number;

    /**
     * 是否显示在导航
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "导航显示状态必须是数字" })
    @IsIn([0, 1], { message: "导航显示状态只能是0或1" })
    showInNav?: number;

    /**
     * 创建时间范围 - 开始
     */
    @IsOptional()
    @IsString({ message: "创建时间开始必须是字符串" })
    createdAtStart?: string;

    /**
     * 创建时间范围 - 结束
     */
    @IsOptional()
    @IsString({ message: "创建时间结束必须是字符串" })
    createdAtEnd?: string;

    /**
     * 页码
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "页码必须是数字" })
    page?: number;

    /**
     * 每页数量
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "每页数量必须是数字" })
    pageSize?: number;
}
