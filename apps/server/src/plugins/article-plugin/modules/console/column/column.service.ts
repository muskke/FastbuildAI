import { BaseService } from "@common/base/services/base.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Article } from "../../../entities/article.entity";
import { ArticleColumn } from "./../../../entities/column.entity";
import { CreateColumnDto } from "./dto/create-column.dto";
import { QueryColumnDto } from "./dto/query-column.dto";

/**
 * 栏目服务
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
     * 创建栏目
     * @param createColumnDto 创建栏目DTO
     * @returns 创建的栏目
     */
    async createColumn(createColumnDto: CreateColumnDto): Promise<Partial<ArticleColumn>> {
        // 检查栏目名称是否重复
        const existingColumn = await this.findOne({
            where: { name: createColumnDto.name },
        });
        if (existingColumn) {
            throw new BadRequestException("栏目名称已存在");
        }

        // 生成slug
        if (!createColumnDto.slug && createColumnDto.name) {
            createColumnDto.slug = this.generateSlug(createColumnDto.name);
        }

        const columnData = {
            ...createColumnDto,
            status: createColumnDto.status ?? 1,
            sort: createColumnDto.sort ?? 0,
            showInNav: createColumnDto.showInNav ?? 1,
        };

        return this.create(columnData);
    }

    /**
     * 分页查询栏目列表
     */
    async list(queryDto: QueryColumnDto) {
        const queryBuilder = this.columnRepository.createQueryBuilder("column");

        // 名称模糊搜索
        if (queryDto.name) {
            queryBuilder.andWhere("column.name LIKE :name", { name: `%${queryDto.name}%` });
        }

        // 状态筛选
        if (queryDto.status !== undefined && queryDto.status !== null) {
            queryBuilder.andWhere("column.status = :status", { status: queryDto.status });
        }

        // 导航显示筛选
        if (queryDto.showInNav !== undefined) {
            queryBuilder.andWhere("column.showInNav = :showInNav", {
                showInNav: queryDto.showInNav,
            });
        }

        // 创建时间范围筛选
        if (queryDto.createdAtStart) {
            queryBuilder.andWhere("column.createdAt >= :createdAtStart", {
                createdAtStart: queryDto.createdAtStart,
            });
        }
        if (queryDto.createdAtEnd) {
            queryBuilder.andWhere("column.createdAt <= :createdAtEnd", {
                createdAtEnd: queryDto.createdAtEnd,
            });
        }

        // 排序
        queryBuilder.orderBy("column.sort", "DESC").addOrderBy("column.createdAt", "DESC");

        return this.paginateQueryBuilder(queryBuilder, queryDto);
    }

    /**
     * 获取栏目统计
     */
    async getStats() {
        const totalCount = await this.columnRepository.count();
        const enabledCount = await this.columnRepository.count({ where: { status: 1 } });
        const disabledCount = await this.columnRepository.count({ where: { status: 0 } });

        return {
            totalCount,
            enabledCount,
            disabledCount,
            totalArticleCount: 0, // 这里可以关联文章表统计
        };
    }

    /**
     * 批量删除栏目
     */
    async batchDelete(ids: string[]) {
        return this.columnRepository.delete(ids);
    }

    /**
     * 更新栏目状态
     */
    async updateStatus(id: string, status: number) {
        return this.columnRepository.update(id, { status });
    }

    /**
     * 生成slug
     * @param name 栏目名称
     * @returns slug
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");
    }
}
