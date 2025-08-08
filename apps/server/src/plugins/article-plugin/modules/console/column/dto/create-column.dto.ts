import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 创建栏目DTO
 */
export class CreateColumnDto {
    /**
     * 栏目名称
     */
    @IsString({ message: "栏目名称必须是字符串" })
    name: string;

    /**
     * 栏目别名/标识
     */
    @IsOptional()
    @IsString({ message: "栏目别名必须是字符串" })
    slug?: string;

    /**
     * 栏目描述
     */
    @IsOptional()
    @IsString({ message: "栏目描述必须是字符串" })
    description?: string;

    /**
     * 栏目图标
     */
    @IsOptional()
    @IsString({ message: "栏目图标必须是字符串" })
    icon?: string;

    /**
     * 栏目封面图
     */
    @IsOptional()
    @IsString({ message: "栏目封面图必须是字符串" })
    coverImage?: string;

    /**
     * 栏目状态：0-禁用，1-启用
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "栏目状态必须是数字" })
    @IsIn([0, 1], { message: "栏目状态只能是0或1" })
    status?: number;

    /**
     * 排序权重
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "排序权重必须是数字" })
    sort?: number;

    /**
     * 是否显示在导航：0-否，1-是
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "导航显示状态必须是数字" })
    @IsIn([0, 1], { message: "导航显示状态只能是0或1" })
    showInNav?: number;

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
}
