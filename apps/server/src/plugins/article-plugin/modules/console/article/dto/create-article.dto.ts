import { Transform } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 创建文章DTO
 */
export class CreateArticleDto {
    /**
     * 文章标题
     */
    @IsNotEmpty({ message: "文章标题不能为空" })
    @IsString({ message: "文章标题必须是字符串" })
    title: string;

    /**
     * 文章内容
     */
    @IsNotEmpty({ message: "文章内容不能为空" })
    @IsString({ message: "文章内容必须是字符串" })
    content: string;

    /**
     * 文章摘要
     */
    @IsOptional()
    @IsString({ message: "文章摘要必须是字符串" })
    summary?: string;

    /**
     * 文章封面图
     */
    @IsOptional()
    @IsString({ message: "文章封面图必须是字符串" })
    coverImage?: string;

    /**
     * 文章作者
     */
    @IsNotEmpty({ message: "文章作者不能为空" })
    @IsString({ message: "文章作者必须是字符串" })
    author: string;

    /**
     * 文章栏目ID
     */
    @IsOptional()
    @IsString({ message: "文章栏目ID必须是字符串" })
    columnId?: string;

    /**
     * 文章标签，数组格式
     */
    @IsOptional()
    @IsArray({ message: "文章标签必须是数组" })
    @IsString({ each: true, message: "标签中的每项必须是字符串" })
    tags?: string[];

    /**
     * 文章状态：0-草稿，1-已发布
     */
    @IsOptional()
    @IsNumber({}, { message: "文章状态必须是数字" })
    status?: number;

    /**
     * 是否置顶：0-否，1-是
     */
    @IsOptional()
    @IsNumber({}, { message: "是否置顶必须是数字" })
    isTop?: number;

    /**
     * 排序值，值越大越靠前
     */
    @IsOptional()
    @IsNumber({}, { message: "排序值必须是数字" })
    sort?: number;

    /**
     * SEO关键词
     */
    @IsOptional()
    @IsString({ message: "SEO关键词必须是字符串" })
    seoKeywords?: string;

    /**
     * SEO描述
     */
    @IsOptional()
    @IsString({ message: "SEO描述必须是字符串" })
    seoDescription?: string;

    /**
     * 发布时间
     */
    @IsOptional()
    @Transform(({ value }) => (value === "" ? undefined : value))
    @IsDateString({}, { message: "发布时间格式不正确" })
    publishedAt?: string;
}
