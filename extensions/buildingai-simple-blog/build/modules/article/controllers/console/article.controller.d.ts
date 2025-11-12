import { BaseController } from "@buildingai/base";
import { type UserPlayground } from "@buildingai/db/interfaces/context.interface";
import { Article } from "../../../../db/entities/article.entity";
import { CreateArticleDto, QueryArticleDto, UpdateArticleDto } from "../../dto";
import { ArticleService } from "../../services/article.service";
export declare class ArticleController extends BaseController {
    private readonly articleService;
    constructor(articleService: ArticleService);
    create(createArticleDto: CreateArticleDto, user: UserPlayground): Promise<Partial<Article>>;
    findAll(queryArticleDto: QueryArticleDto): Promise<import("@buildingai/base").PaginationResult<Article>>;
    findOne(id: string): Promise<Article | null>;
    update(id: string, updateArticleDto: UpdateArticleDto): Promise<Partial<Article>>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    batchRemove(ids: string[]): Promise<{
        success: boolean;
        message: any;
    }>;
    publish(id: string): Promise<{
        success: boolean;
        message: any;
    }>;
    unpublish(id: string): Promise<{
        success: boolean;
        message: any;
    }>;
}
