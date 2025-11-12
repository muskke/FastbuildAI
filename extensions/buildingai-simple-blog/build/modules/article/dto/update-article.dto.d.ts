import { ArticleStatus } from "../../../db/entities/article.entity";
export declare class UpdateArticleDto {
    title?: string;
    summary?: string;
    content?: string;
    cover?: string;
    status?: ArticleStatus;
    sort?: number;
    categoryId?: string;
}
