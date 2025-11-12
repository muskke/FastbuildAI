import { BaseService } from "@buildingai/base";
import { Repository } from "@buildingai/db/typeorm";
import { PublicUserService } from "@buildingai/extension-sdk/services/user.service";
import { Article } from "../../../db/entities/article.entity";
import { CategoryService } from "../../category/services/category.service";
import { CreateArticleDto, QueryArticleDto, UpdateArticleDto } from "../dto";
export declare class ArticleService extends BaseService<Article> {
    private readonly articleRepository;
    private readonly categoryService;
    private readonly userService;
    constructor(articleRepository: Repository<Article>, categoryService: CategoryService, userService: PublicUserService);
    private formatArticleAuthor;
    private formatArticleListAuthors;
    createArticle(createArticleDto: CreateArticleDto, authorId: string): Promise<Partial<Article>>;
    list(queryArticleDto: QueryArticleDto): Promise<import("@buildingai/base").PaginationResult<Article>>;
    findArticleById(id: string): Promise<Article | null>;
    updateArticleById(id: string, updateArticleDto: UpdateArticleDto): Promise<Partial<Article>>;
    delete(id: string): Promise<void>;
    batchDelete(ids: string[]): Promise<void>;
    publish(id: string): Promise<Partial<Article>>;
    unpublish(id: string): Promise<Partial<Article>>;
    incrementViewCount(id: string): Promise<void>;
    getPublishedArticles(categoryId?: string): Promise<Article[]>;
}
