import { BaseController } from "@buildingai/base";
import { Article } from "../../../../db/entities/article.entity";
import { QueryArticleDto } from "../../dto";
import { ArticleService } from "../../services/article.service";
export declare class ArticleWebController extends BaseController {
    private readonly articleService;
    constructor(articleService: ArticleService);
    findAll(queryArticleDto: QueryArticleDto): Promise<import("@buildingai/base").PaginationResult<Article>>;
    getPublished(categoryId?: string): Promise<Article[]>;
    findOne(id: string): Promise<Article | null>;
}
