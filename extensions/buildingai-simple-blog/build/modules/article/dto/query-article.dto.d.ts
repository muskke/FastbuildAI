import { PaginationDto } from "@buildingai/dto";
import { ArticleStatus } from "../../../db/entities/article.entity";
export declare class QueryArticleDto extends PaginationDto {
    title?: string;
    status?: ArticleStatus;
    categoryId?: string;
}
