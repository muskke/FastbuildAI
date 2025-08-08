import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 前台文章查询DTO
 */
export class QueryArticleDto {
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
     * 搜索关键词，模糊查询标题和内容
     */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;

    /**
     * 文章栏目ID
     */
    @IsOptional()
    @IsString({ message: "文章栏目ID必须是字符串" })
    columnId?: string;

    /**
     * 文章标签
     */
    @IsOptional()
    @IsString({ message: "文章标签必须是字符串" })
    tag?: string;

    /**
     * 文章状态，前台固定为1（已发布）
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "文章状态必须是数字" })
    status?: number = 1;
}
