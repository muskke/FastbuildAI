import {
    BaseService,
    FieldFilterOptions,
    PaginationResult,
} from "@common/base/services/base.service";
import { AI_DEFAULT_MODEL } from "@common/constants";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { DictService } from "@common/modules/dict/services/dict.service";
import { buildWhere } from "@common/utils/helper.util";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, In, Repository } from "typeorm";

import { CreateAiModelDto, QueryAiModelDto, UpdateAiModelDto } from "../dto/ai-model.dto";
import { AiModel } from "../entities/ai-model.entity";

/**
 * AI模型管理服务
 *
 * 提供AI模型的完整CRUD操作和业务逻辑
 */
@Injectable()
export class AiModelService extends BaseService<AiModel> {
    constructor(
        @InjectRepository(AiModel)
        private readonly aiModelRepository: Repository<AiModel>,
        private readonly dictService: DictService,
    ) {
        super(aiModelRepository);
    }

    /**
     * 创建AI模型配置
     *
     * @param dto 创建AI模型DTO
     * @param options 字段过滤选项
     * @returns 创建的AI模型实体
     */
    async createModel(
        dto: CreateAiModelDto,
        options?: FieldFilterOptions<AiModel>,
    ): Promise<Partial<AiModel>> {
        // 设置默认值
        const modelData = {
            ...dto,
        };

        try {
            const result = await this.create(modelData, options);
            if (dto.isDefault) {
                await this.dictService.set(AI_DEFAULT_MODEL, result.id);
            }
            return result;
        } catch (error) {
            this.logger.error(`创建AI模型失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to create AI model.");
        }
    }

    /**
     * 更新AI模型配置
     *
     * @param id 模型ID
     * @param dto 更新AI模型DTO
     * @param options 字段过滤选项
     * @returns 更新后的AI模型实体
     */
    async updateModel(
        id: string,
        dto: UpdateAiModelDto,
        options?: FieldFilterOptions<AiModel>,
    ): Promise<Partial<AiModel>> {
        // 如果设置为默认模型，先取消其他默认模型
        if (dto.isDefault) {
            await this.dictService.set(AI_DEFAULT_MODEL, id);
        } else {
            await this.dictService.deleteByKey(AI_DEFAULT_MODEL);
        }

        try {
            return await this.updateById(id, dto, options);
        } catch (error) {
            this.logger.error(`更新AI模型失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to update AI model.");
        }
    }

    /**
     * 获取可用的模型列表
     *
     * @param excludeFields 要排除的字段
     * @returns 可用的AI模型列表
     */
    async getAvailableModels(excludeFields: string[] = ["apiKey"]) {
        try {
            const models = await this.findAll({
                where: { isActive: true },
                order: {
                    sortOrder: "ASC",
                    createdAt: "DESC",
                },
                excludeFields,
            });

            return models;
        } catch (error) {
            this.logger.error(`获取可用模型列表失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal("Failed to get available models.");
        }
    }

    /**
     * 分页查询AI模型
     *
     * @param paginationDto 分页参数
     * @param queryDto 查询条件
     * @param excludeFields 要排除的字段
     * @returns 分页结果
     */
    async paginateModels(
        paginationDto: PaginationDto,
        queryDto: QueryAiModelDto = {},
        excludeFields: string[] = ["apiKey"],
    ) {
        const where = buildWhere<AiModel>({
            providerId: queryDto.providerId,
            isActive: queryDto.isActive,
        });

        if (queryDto.modelType && queryDto.modelType.length > 0) {
            where.modelType = In(queryDto.modelType);
        }

        // 关键词搜索（名称或描述）
        const whereConditions: FindOptionsWhere<AiModel>[] = [];
        if (queryDto.keyword) {
            whereConditions.push(
                { ...where, ...this.ilike("name", queryDto.keyword) },
                { ...where, ...this.ilike("description", queryDto.keyword) },
            );
        } else {
            whereConditions.push(where);
        }

        try {
            const result = (await this.paginate(paginationDto, {
                where: whereConditions.length > 1 ? whereConditions : where,
                order: {
                    sortOrder: "ASC",
                    createdAt: "DESC",
                },
                excludeFields,
            })) as PaginationResult<AiModel & { isDefault: boolean }>;

            const defaultModelId = await this.dictService.get(AI_DEFAULT_MODEL);

            result.items.forEach((item) => {
                item.isDefault = item.id === defaultModelId;
            });

            return result;
        } catch (error) {
            this.logger.error(`分页查询AI模型失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal("Failed to paginate AI models.");
        }
    }
}
