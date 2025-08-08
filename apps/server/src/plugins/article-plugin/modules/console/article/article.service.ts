import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Article } from "../../../entities/article.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { QueryArticleDto } from "./dto/query-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

/**
 * 文章服务
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
     * 创建文章
     * @param createArticleDto 创建文章DTO
     * @returns 创建的文章
     */
    async createArticle(createArticleDto: CreateArticleDto): Promise<Partial<Article>> {
        // 处理发布时间
        if (createArticleDto.publishedAt) {
            createArticleDto.publishedAt = new Date(createArticleDto.publishedAt).toISOString();
        } else if (createArticleDto.status === 1) {
            // 如果状态为已发布但没有发布时间，则使用当前时间
            createArticleDto.publishedAt = new Date().toISOString();
        }

        return this.create(createArticleDto);
    }

    /**
     * 分页查询文章列表
     * @param queryArticleDto 查询条件
     * @returns 分页结果
     */
    async findArticles(queryArticleDto: QueryArticleDto) {
        const {
            page = 1,
            pageSize = 10,
            keyword,
            status,
            isTop,
            createdAtStart,
            createdAtEnd,
        } = queryArticleDto;

        const queryBuilder = this.articleRepository.createQueryBuilder("article");

        // 关键词搜索：在标题、作者、标签中搜索
        if (keyword) {
            queryBuilder.andWhere(
                "(article.title ILIKE :keyword OR article.author ILIKE :keyword OR JSON_EXTRACT(article.tags, '$') LIKE :keywordJson)",
                {
                    keyword: `%${keyword}%`,
                    keywordJson: `%"${keyword}"%`,
                },
            );
        }

        if (status !== undefined) {
            queryBuilder.andWhere("article.status = :status", { status });
        }

        if (isTop !== undefined) {
            queryBuilder.andWhere("article.isTop = :isTop", { isTop });
        }

        if (createdAtStart) {
            queryBuilder.andWhere("article.createdAt >= :createdAtStart", { createdAtStart });
        }

        if (createdAtEnd) {
            queryBuilder.andWhere("article.createdAt <= :createdAtEnd", { createdAtEnd });
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
        return article;
    }

    /**
     * 更新文章
     * @param id 文章ID
     * @param updateArticleDto 更新文章DTO
     * @returns 更新后的文章
     */
    async updateArticle(id: string, updateArticleDto: UpdateArticleDto): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);

        // 处理发布时间
        if (updateArticleDto.publishedAt) {
            updateArticleDto.publishedAt = new Date(updateArticleDto.publishedAt).toISOString();
        } else if (updateArticleDto.status === 1 && !article.publishedAt) {
            // 如果状态改为已发布但原来没有发布时间，则使用当前时间
            updateArticleDto.publishedAt = new Date().toISOString();
        }

        return this.updateById(article.id, updateArticleDto);
    }

    /**
     * 删除文章
     * @param id 文章ID
     */
    async removeArticle(id: string): Promise<void> {
        const article = await this.findArticleById(id);
        await this.delete(article.id);
    }

    /**
     * 更新文章阅读量
     * @param id 文章ID
     * @returns 更新后的文章
     */
    async incrementViews(id: string): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);
        article.views += 1;
        return this.updateById(article.id, article);
    }

    /**
     * 设置文章置顶状态
     * @param id 文章ID
     * @param isTop 是否置顶：0-否，1-是
     * @returns 更新后的文章
     */
    async setTopStatus(id: string, isTop: number): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);
        return this.updateById(article.id, { isTop });
    }

    /**
     * 更新文章状态
     * @param id 文章ID
     * @param status 文章状态：0-草稿，1-已发布
     * @returns 更新后的文章
     */
    async updateStatus(id: string, status: number): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);
        const updateData: any = { status };

        // 如果是发布状态且没有发布时间，则设置发布时间
        if (status === 1 && !article.publishedAt) {
            updateData.publishedAt = new Date();
        }

        return this.updateById(article.id, updateData);
    }

    /**
     * 获取文章统计信息
     * @returns 统计信息
     */
    async getStats() {
        const [totalCount, publishedCount, draftCount, topCount, totalViewCount] =
            await Promise.all([
                this.articleRepository.count(),
                this.articleRepository.count({ where: { status: 1 } }),
                this.articleRepository.count({ where: { status: 0 } }),
                this.articleRepository.count({ where: { isTop: 1 } }),
                this.articleRepository
                    .createQueryBuilder("article")
                    .select("SUM(article.views)", "sum")
                    .getRawOne()
                    .then((result) => parseInt(result.sum) || 0),
            ]);

        return {
            totalCount,
            publishedCount,
            draftCount,
            topCount,
            totalViewCount,
            totalLikeCount: 0, // 暂时设为0，后续可以扩展
            totalCommentCount: 0, // 暂时设为0，后续可以扩展
        };
    }

    /**
     * 根据栏目ID获取文章数量
     * @param columnId 栏目ID
     * @returns 文章数量
     */
    async getArticleCountByColumnId(columnId: string): Promise<number> {
        return await this.articleRepository.count({ where: { columnId } });
    }

    /**
     * 复制文章
     * @param id 文章ID
     * @returns 复制的文章
     */
    async copyArticle(id: string): Promise<Partial<Article>> {
        const article = await this.findArticleById(id);

        const copyData = {
            ...article,
            title: `${article.title} - 副本`,
            status: 0, // 复制的文章默认为草稿状态
            views: 0, // 重置阅读量
            isTop: 0, // 取消置顶
            publishedAt: null, // 清空发布时间
        };

        // 移除ID和时间戳字段
        delete copyData.id;
        delete copyData.createdAt;
        delete copyData.updatedAt;

        return this.create(copyData);
    }

    /**
     * 批量删除文章
     * @param ids 文章ID列表
     */
    async batchDelete(ids: string[]): Promise<void> {
        for (const id of ids) {
            await this.removeArticle(id);
        }
    }
}
