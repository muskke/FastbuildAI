import { BaseService, FieldFilterOptions } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

import { CreateAiProviderDto, UpdateAiProviderDto } from "../dto/ai-provider.dto";
import { AiProvider } from "../entities/ai-provider.entity";

/**
 * AI供应商服务
 *
 * 管理AI供应商的CRUD操作和连接测试功能
 */
@Injectable()
export class AiProviderService extends BaseService<AiProvider> {
    constructor(
        @InjectRepository(AiProvider)
        private readonly aiProviderRepository: Repository<AiProvider>,
    ) {
        super(aiProviderRepository);
    }

    /**
     * 创建AI供应商
     */
    async createProvider(
        dto: CreateAiProviderDto,
        options?: FieldFilterOptions<AiProvider>,
    ): Promise<Partial<AiProvider>> {
        this.logger.log(`正在创建AI供应商: ${dto.provider}`);

        // 检查供应商标识是否已存在
        const existingProvider = await this.findOne({
            where: { provider: dto.provider },
        });

        if (existingProvider) {
            throw HttpExceptionFactory.badRequest(`供应商标识 '${dto.provider}' 已存在`);
        }

        try {
            const provider = await this.create(dto, options);
            this.logger.log(`AI供应商创建成功: ${provider.id}`);
            return provider;
        } catch (error) {
            this.logger.error(`创建AI供应商失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("创建AI供应商失败");
        }
    }

    /**
     * 更新AI供应商
     */
    async updateProvider(
        id: string,
        dto: UpdateAiProviderDto,
        options?: FieldFilterOptions<AiProvider>,
    ): Promise<Partial<AiProvider>> {
        this.logger.log(`正在更新AI供应商: ${id}`);

        // 如果更新了provider标识，检查是否冲突
        if (dto.provider) {
            const conflictProvider = await this.findOne({
                where: { provider: dto.provider },
            });

            if (conflictProvider && conflictProvider.id !== id) {
                throw HttpExceptionFactory.badRequest(`供应商标识 '${dto.provider}' 已存在`);
            }
        }

        try {
            const provider = await this.updateById(id, dto, options);
            this.logger.log(`AI供应商更新成功: ${id}`);
            return provider;
        } catch (error) {
            this.logger.error(`更新AI供应商失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("更新AI供应商失败");
        }
    }

    /**
     * 分页查询AI供应商列表
     */
    async getProviderList(
        paginationDto: PaginationDto,
        queryOptions: {
            keyword?: string;
            isActive?: boolean;
        } = {},
        excludeFields: string[] = ["apiKey"],
    ) {
        const where: any = {};

        // 构建查询条件
        if (typeof queryOptions.isActive === "boolean") {
            where.isActive = queryOptions.isActive;
        }

        // 关键词搜索（名称、标识符或描述）
        const whereConditions: any[] = [];
        if (queryOptions.keyword) {
            whereConditions.push(
                { ...where, ...{ name: Like(`%${queryOptions.keyword}%`) } },
                { ...where, ...{ provider: Like(`%${queryOptions.keyword}%`) } },
                {
                    ...where,
                    ...{ description: Like(`%${queryOptions.keyword}%`) },
                },
            );
        } else {
            whereConditions.push(where);
        }

        try {
            return this.paginate(paginationDto, {
                where: whereConditions.length > 1 ? whereConditions : where,
                relations: ["models"],
                order: {
                    sortOrder: "DESC",
                    createdAt: "DESC",
                },
                excludeFields,
            });
        } catch (error) {
            this.logger.error(`查询AI供应商列表失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal("查询AI供应商列表失败");
        }
    }

    /**
     * 获取供应商详情
     */
    async getProviderDetail(
        id: string,
        excludeFields: string[] = ["apiKey"],
    ): Promise<Partial<AiProvider>> {
        this.logger.log(`正在获取AI供应商详情: ${id}`);

        try {
            const provider = await this.findOne({
                where: { id },
                relations: ["models"],
                excludeFields,
            });

            if (!provider) {
                throw HttpExceptionFactory.notFound("供应商不存在");
            }

            return provider;
        } catch (error) {
            this.logger.error(`获取AI供应商详情失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal("获取AI供应商详情失败");
        }
    }

    /**
     * 删除AI供应商
     */
    async deleteProvider(id: string): Promise<void> {
        this.logger.log(`正在删除AI供应商: ${id}`);

        try {
            await this.delete(id);
            this.logger.log(`AI供应商删除成功: ${id}`);
        } catch (error) {
            this.logger.error(`删除AI供应商失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("删除AI供应商失败");
        }
    }

    /**
     * 获取所有启用的供应商
     */
    async getActiveProviders(excludeFields: string[] = ["apiKey"]): Promise<Partial<AiProvider>[]> {
        return this.findAll({
            where: { isActive: true },
            order: { sortOrder: "ASC", createdAt: "DESC" },
            excludeFields,
        });
    }

    /**
     * 根据供应商标识获取供应商
     */
    async getProviderByCode(
        provider: string,
        excludeFields: string[] = ["apiKey"],
    ): Promise<Partial<AiProvider> | null> {
        return this.findOne({
            where: { provider, isActive: true },
            excludeFields,
        });
    }
}
