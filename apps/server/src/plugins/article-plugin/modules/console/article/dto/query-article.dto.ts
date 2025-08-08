import { PaginationDto } from "@common/dto/pagination.dto";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 文章查询DTO
 */
export class QueryArticleDto extends PaginationDto {
    /**
     * 关键词搜索（标题、作者、标签、栏目）
     */
    @IsOptional()
    @IsString({ message: "关键词必须是字符串" })
    keyword?: string;

    /**
     * 文章状态：0-草稿，1-已发布
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "文章状态必须是数字" })
    status?: number;

    /**
     * 是否置顶：0-否，1-是
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber({}, { message: "置顶状态必须是数字" })
    isTop?: number;

    /**
     * 创建时间范围 - 开始
     */
    @IsOptional()
    @IsString({ message: "创建开始时间必须是字符串" })
    createdAtStart?: string;

    /**
     * 创建时间范围 - 结束
     */
    @IsOptional()
    @IsString({ message: "创建结束时间必须是字符串" })
    createdAtEnd?: string;
}
