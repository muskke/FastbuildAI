import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Article } from "../../../entities/article.entity";
import { ArticleColumn } from "../../../entities/column.entity";
import { QueryColumnDto } from "./dto/query-column.dto";

/**
 * 前台栏目服务
 */
@Injectable()
export class ColumnService extends BaseService<ArticleColumn> {
    /**
     * 构造函数
     * @param columnRepository 栏目仓库
     * @param articleRepository 文章仓库
     */
    constructor(
        @InjectRepository(ArticleColumn)
        private readonly columnRepository: Repository<ArticleColumn>,
        @InjectRepository(Article)
        private readonly articleRepository: Repository<Article>,
    ) {
        super(columnRepository);
    }

    /**
     * 获取启用的栏目列表
     * @param queryColumnDto 查询参数
     * @returns 栏目列表
     */
    async findEnabledColumns(queryColumnDto: QueryColumnDto) {
        const queryBuilder = this.columnRepository.createQueryBuilder("column");

        // 只查询启用的栏目
        queryBuilder.where("column.status = :status", { status: 1 });

        // 按排序值降序，创建时间升序
        queryBuilder.orderBy("column.sort", "DESC").addOrderBy("column.createdAt", "ASC");

        return queryBuilder.getMany();
    }

    /**
     * 根据ID查询栏目详情
     * @param id 栏目ID
     * @returns 栏目详情
     */
    async findColumnById(id: string): Promise<ArticleColumn> {
        const column = (await this.findOneById(id)) as ArticleColumn;
        if (!column) {
            throw HttpExceptionFactory.notFound("栏目不存在");
        }

        // 只能查询启用的栏目
        if (column.status !== 1) {
            throw HttpExceptionFactory.notFound("栏目不存在或已禁用");
        }

        return column;
    }

    /**
     * 根据slug查询栏目详情
     * @param slug 栏目slug
     * @returns 栏目详情
     */
    async findColumnBySlug(slug: string): Promise<ArticleColumn> {
        const column = await this.columnRepository.findOne({
            where: { slug, status: 1 },
        });

        if (!column) {
            throw HttpExceptionFactory.notFound("栏目不存在");
        }

        return column;
    }

    /**
     * 获取导航栏目
     * @returns 导航栏目列表
     */
    async findNavColumns(): Promise<ArticleColumn[]> {
        return this.columnRepository.find({
            where: { status: 1, showInNav: 1 },
            order: { sort: "DESC", createdAt: "ASC" },
        });
    }

    /**
     * 获取栏目的文章列表
     * @param columnId 栏目ID
     * @param params 查询参数
     * @returns 文章列表
     */
    async findColumnArticles(
        columnId: string,
        params: {
            page?: number;
            pageSize?: number;
            keyword?: string;
        },
    ) {
        const { page = 1, pageSize = 10, keyword } = params;

        // 先验证栏目是否存在
        await this.findColumnById(columnId);

        // 构建查询条件
        const where: any = {
            columnId,
            status: 1, // 只查询已发布的文章
        };

        // 关键词搜索条件
        let queryBuilder = null;
        if (keyword) {
            queryBuilder = this.articleRepository
                .createQueryBuilder("article")
                .where("article.columnId = :columnId", { columnId })
                .andWhere("article.status = :status", { status: 1 })
                .andWhere(
                    "(article.title ILIKE :keyword OR article.content ILIKE :keyword OR article.summary ILIKE :keyword)",
                    { keyword: `%${keyword}%` },
                )
                .orderBy("article.isTop", "DESC")
                .addOrderBy("article.sort", "DESC")
                .addOrderBy("article.createdAt", "DESC");

            // 手动分页
            const [data, total] = await queryBuilder
                .skip((page - 1) * pageSize)
                .take(pageSize)
                .getManyAndCount();

            const totalPages = Math.ceil(total / pageSize);

            return {
                items: data,
                total,
                page,
                pageSize,
                totalPages,
            };
        }

        // 没有关键词时使用简单查询
        return this.articleRepository
            .findAndCount({
                where,
                order: {
                    isTop: "DESC",
                    sort: "DESC",
                    createdAt: "DESC",
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            })
            .then(([data, total]) => {
                const totalPages = Math.ceil(total / pageSize);
                return {
                    items: data,
                    total,
                    page,
                    pageSize,
                    totalPages,
                };
            });
    }
}
