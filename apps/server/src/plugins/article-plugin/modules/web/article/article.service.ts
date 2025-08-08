import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { In, Not } from "typeorm";

import { Article } from "../../../entities/article.entity";
import { QueryArticleDto } from "./dto/query-article.dto";

/**
 * 前台文章服务
 */
@Injectable()
export class ArticleService extends BaseService<Article> {
    /**
     * 构造函数
     * @param articleRepository 文章仓库
     */
    constructor(
        @InjectRepository(Article)
        private readonly articleRepository: Repository<Article>,
    ) {
        super(articleRepository);
    }

    /**
     * 查询文章列表
     * @param queryArticleDto 查询参数
     * @returns 分页数据
     */
    async findArticles(queryArticleDto: QueryArticleDto) {
        const { page = 1, pageSize = 10, keyword, columnId, tag } = queryArticleDto;

        const queryBuilder = this.articleRepository.createQueryBuilder("article");

        // 只查询已发布的文章
        queryBuilder.where("article.status = :status", { status: 1 });

        // 构建查询条件
        if (keyword) {
            queryBuilder.andWhere(
                "(article.title ILIKE :keyword OR article.content ILIKE :keyword OR article.summary ILIKE :keyword)",
                { keyword: `%${keyword}%` },
            );
        }

        if (columnId) {
            queryBuilder.andWhere("article.columnId = :columnId", { columnId });
        }

        if (tag) {
            queryBuilder.andWhere("JSON_CONTAINS(article.tags, :tag)", {
                tag: JSON.stringify(tag),
            });
        }

        // 排序：置顶文章优先，然后按排序值降序，再按创建时间降序
        queryBuilder
            .orderBy("article.isTop", "DESC")
            .addOrderBy("article.sort", "DESC")
            .addOrderBy("article.createdAt", "DESC");

        return this.paginateQueryBuilder(queryBuilder, { page, pageSize });
    }

    /**
     * 根据ID查询文章
     * @param id 文章ID
     * @returns 文章信息
     */
    async findArticleById(id: string): Promise<Partial<Article>> {
        const article = await this.findOneById(id);
        if (!article) {
            throw HttpExceptionFactory.notFound("文章不存在");
        }

        // 只能查询已发布的文章
        if (article.status !== 1) {
            throw HttpExceptionFactory.notFound("文章不存在或未发布");
        }

        return article;
    }

    /**
     * 增加文章阅读量
     * @param id 文章ID
     * @returns 更新后的文章
     */
    async incrementViews(id: string): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);
        article.views += 1;
        return this.updateById(article.id, article);
    }

    /**
     * 获取热门文章列表
     * @param limit 限制数量
     * @returns 热门文章列表
     */
    async findHotArticles(limit: number = 5): Promise<Article[]> {
        return this.articleRepository.find({
            where: { status: 1 },
            order: { views: "DESC" },
            take: limit,
        });
    }

    /**
     * 获取最新文章列表
     * @param limit 限制数量
     * @returns 最新文章列表
     */
    async findLatestArticles(limit: number = 5): Promise<Article[]> {
        return this.articleRepository.find({
            where: { status: 1 },
            order: { createdAt: "DESC" },
            take: limit,
        });
    }

    /**
     * 获取所有文章栏目
     * @returns 栏目列表
     */
    async findAllColumns(): Promise<string[]> {
        const result = await this.articleRepository
            .createQueryBuilder("article")
            .select("DISTINCT article.columnId")
            .where("article.status = :status", { status: 1 })
            .andWhere("article.columnId IS NOT NULL")
            .getRawMany();

        return result.map((item) => item.columnId).filter(Boolean);
    }

    /**
     * 获取所有文章标签
     * @returns 标签列表
     */
    async findAllTags(): Promise<string[]> {
        const articles = await this.articleRepository.find({
            where: { status: 1 },
            select: ["tags"],
        });

        // 提取所有标签并去重
        const tagSet = new Set<string>();
        articles.forEach((article) => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach((tag) => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag) {
                        tagSet.add(trimmedTag);
                    }
                });
            }
        });

        return Array.from(tagSet);
    }

    /**
     * 搜索文章
     * @param params 搜索参数
     * @returns 搜索结果
     */
    async searchArticles(params: { q: string; page?: number; pageSize?: number }) {
        const { q, page = 1, pageSize = 10 } = params;

        const queryBuilder = this.articleRepository.createQueryBuilder("article");

        // 只查询已发布的文章
        queryBuilder.where("article.status = :status", { status: 1 });

        // 搜索关键词
        if (q) {
            queryBuilder.andWhere(
                "(article.title ILIKE :keyword OR article.content ILIKE :keyword OR article.summary ILIKE :keyword)",
                { keyword: `%${q}%` },
            );
        }

        // 排序：置顶文章优先，然后按排序值降序，再按创建时间降序
        queryBuilder
            .orderBy("article.isTop", "DESC")
            .addOrderBy("article.sort", "DESC")
            .addOrderBy("article.createdAt", "DESC");

        return this.paginateQueryBuilder(queryBuilder, { page, pageSize });
    }

    /**
     * 获取相关文章列表
     * @param id 文章ID
     * @param limit 限制数量
     * @returns 相关文章列表
     */
    async findRelatedArticles(id: string, limit: number = 5): Promise<Article[]> {
        // 先获取当前文章
        const currentArticle = await this.findArticleById(id);

        const queryBuilder = this.articleRepository.createQueryBuilder("article");

        // 排除当前文章，只查询已发布的文章
        queryBuilder
            .where("article.status = :status", { status: 1 })
            .andWhere("article.id != :id", { id });

        // 如果有栏目ID，优先推荐同栏目的文章
        if (currentArticle.columnId) {
            queryBuilder.andWhere("article.columnId = :columnId", {
                columnId: currentArticle.columnId,
            });
        }

        // 按阅读量和创建时间排序
        queryBuilder
            .orderBy("article.views", "DESC")
            .addOrderBy("article.createdAt", "DESC")
            .take(limit);

        const relatedArticles = await queryBuilder.getMany();

        // 如果同栏目文章不够，补充其他文章
        if (relatedArticles.length < limit) {
            const remainingCount = limit - relatedArticles.length;
            const excludeIds = [id, ...relatedArticles.map((a) => a.id)];

            const additionalArticles = await this.articleRepository.find({
                where: {
                    status: 1,
                    id: Not(In(excludeIds)),
                },
                order: { views: "DESC", createdAt: "DESC" },
                take: remainingCount,
            });

            relatedArticles.push(...additionalArticles);
        }

        return relatedArticles;
    }

    /**
     * 获取文章归档
     * @returns 归档数据
     */
    async getArchive(): Promise<
        {
            year: number;
            months: {
                month: number;
                count: number;
                articles: Article[];
            }[];
        }[]
    > {
        const articles = await this.articleRepository.find({
            where: { status: 1 },
            order: { createdAt: "DESC" },
            select: ["id", "title", "createdAt", "publishedAt"],
        });

        // 按年月分组
        const archiveMap = new Map<number, Map<number, Article[]>>();

        articles.forEach((article) => {
            const date = new Date(article.publishedAt || article.createdAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            if (!archiveMap.has(year)) {
                archiveMap.set(year, new Map());
            }

            const yearMap = archiveMap.get(year)!;
            if (!yearMap.has(month)) {
                yearMap.set(month, []);
            }

            yearMap.get(month)!.push(article);
        });

        // 转换为返回格式
        const result = Array.from(archiveMap.entries())
            .map(([year, monthMap]) => ({
                year,
                months: Array.from(monthMap.entries())
                    .map(([month, articles]) => ({
                        month,
                        count: articles.length,
                        articles,
                    }))
                    .sort((a, b) => b.month - a.month), // 月份降序
            }))
            .sort((a, b) => b.year - a.year); // 年份降序

        return result;
    }

    /**
     * 点赞文章
     * @param id 文章ID
     * @returns 更新后的点赞数
     */
    async likeArticle(id: string): Promise<{ likeCount: number; liked: boolean }> {
        const article = await this.findArticleById(id);

        // 简单实现：直接增加点赞数（实际项目中需要记录用户点赞状态）
        const likeCount = (article.likeCount || 0) + 1;
        await this.updateById(article.id, { likeCount });

        return { likeCount, liked: true };
    }
}
