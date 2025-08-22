import { BaseController } from "@common/base/controllers/base.controller";
import { AI_DEFAULT_MODEL } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { DictService } from "@common/modules/dict/services/dict.service";
import { isEnabled } from "@common/utils/is.util";
import { Body, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { getModelFeaturesWithDescriptions, getModelTypesWithDescriptions } from "@sdk/ai";

import { AiModel } from "../entities/ai-model.entity";
import { AiProviderService } from "../services/ai-provider.service";
import { CreateAiModelDto, QueryAiModelDto, UpdateAiModelDto } from "./../dto/ai-model.dto";
import { AiModelService } from "./../services/ai-model.service";

/**
 * AI模型管理控制器（后台）
 *
 * 提供AI模型的完整管理功能
 */
@ConsoleController("ai-models", "AI模型管理")
export class AiModelController extends BaseController {
    constructor(
        private readonly aiModelService: AiModelService,
        private readonly aiProviderService: AiProviderService,
        private readonly dictService: DictService,
    ) {
        super();
    }

    /**
     * 创建AI模型配置
     */
    @Post()
    @Permissions({
        code: "create",
        name: "创建AI模型",
    })
    async create(@Body() dto: CreateAiModelDto) {
        if (dto.modelType !== undefined) {
            const provider = await this.aiProviderService.findOneById(dto.providerId);
            if (!provider) {
                throw HttpExceptionFactory.business("AI供应商不存在");
            }

            if (!provider.supportedModelTypes.includes(dto.modelType)) {
                throw HttpExceptionFactory.business("AI供应商不支持该模型类型");
            }
        }
        return await this.aiModelService.createModel(dto);
    }

    /**
     * 获取AI模型列表（分页）
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查看AI模型",
    })
    async list(@Query() query: QueryAiModelDto) {
        return await this.aiModelService.paginateModels(query, query, ["apiKey"]);
    }

    /**
     * 获取单个AI模型详情
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看AI模型",
    })
    async findOne(@Param("id") id: string) {
        const result = (await this.aiModelService.findOneById(id, {
            excludeFields: ["apiKey"],
        })) as AiModel & { isDefault: boolean };

        result.isDefault = result.id === (await this.dictService.get(AI_DEFAULT_MODEL));

        result.modelConfig = Object.keys(result.modelConfig).map((key) => {
            return {
                field: key,
                ...result.modelConfig[key],
            };
        });

        return result;
    }

    /**
     * 获取模型类型
     */
    @Get("type-father/list")
    @Permissions({
        code: "type-father-list",
        name: "查看AI供应商类型",
    })
    async getFatherProviderTypeList(@Query("providerId") providerId?: string) {
        if (!providerId) {
            return getModelTypesWithDescriptions();
        }
        const provider = await this.aiProviderService.findOneById(providerId);
        if (!provider) {
            throw HttpExceptionFactory.business("AI供应商不存在");
        }
        const typeList = getModelTypesWithDescriptions();
        return typeList.filter((type) => provider.supportedModelTypes?.includes(type.value));
    }

    /**
     * 获取模型类型
     */
    @Get("type/list")
    @Permissions({
        code: "type-list",
        name: "查看AI供应商类型",
    })
    async getProviderTypeList() {
        return getModelTypesWithDescriptions();
    }

    /**
     * 获取AI模型特性
     */
    @Get("features/list")
    @Permissions({
        code: "features-list",
        name: "管理AI模型",
    })
    async getFeaturesList() {
        return getModelFeaturesWithDescriptions();
    }

    /**
     * 获取单个AI模型详情（包含敏感信息）
     */
    @Get(":id/full")
    @Permissions({
        code: "detail-full",
        name: "管理AI模型",
    })
    async findOneFull(@Param("id") id: string) {
        return await this.aiModelService.findOneById(id);
    }

    /**
     * 批量启用/禁用AI 模型
     */
    @Patch("batch-toggle-active")
    @Permissions({
        code: "batch-toggle-active",
        name: "更新AI模型",
    })
    async batchToggleActive(@Body("ids") ids: string[], @Body("isActive") isActive: boolean) {
        if (!Array.isArray(ids)) {
            throw HttpExceptionFactory.business("参数 ids 必须是数组");
        }
        if (typeof isActive !== "boolean") {
            throw HttpExceptionFactory.business("参数 isActive 必须是布尔值");
        }
        // 批量检查模型是否存在
        const models = await Promise.all(ids.map((id) => this.aiModelService.findOneById(id)));
        if (models.length === 0) {
            throw HttpExceptionFactory.business("模型不存在");
        }

        return await this.aiModelService.updateModelMany(ids, { isActive });
    }

    /**
     * 更新AI模型配置
     */
    @Patch(":id")
    @Permissions({
        code: "update",
        name: "更新AI模型",
    })
    async update(@Param("id") id: string, @Body() dto: UpdateAiModelDto) {
        if (dto.modelType) {
            const provider = await this.aiProviderService.findOneById(dto.providerId);
            if (!provider) {
                throw HttpExceptionFactory.business("AI供应商不存在");
            }

            if (!provider.supportedModelTypes.includes(dto.modelType)) {
                throw HttpExceptionFactory.business("AI供应商不支持该模型类型");
            }
        }

        return await this.aiModelService.updateModel(id, dto);
    }

    /**
     * 启用/禁用AI模型
     */
    @Patch(":id/toggle-active")
    @Permissions({
        code: "toggle-active",
        name: "启用/禁用AI模型",
    })
    async toggleActive(@Param("id") id: string, @Body("isActive") isActive: boolean) {
        if (typeof isActive !== "boolean") {
            throw HttpExceptionFactory.business("参数 isActive 必须是布尔值");
        }
        const model = await this.aiModelService.findOneById(id);
        if (!model) {
            throw HttpExceptionFactory.business("模型不存在");
        }
        return await this.aiModelService.updateModel(id, { isActive });
    }

    /**
     * 删除AI模型
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除AI模型",
    })
    async remove(@Param("id") id: string) {
        // 检查是否为内置模型
        const model = await this.aiModelService.findOneById(id);
        if (!model) {
            throw HttpExceptionFactory.business("AI模型不存在");
        }

        if (model.isBuiltIn) {
            throw HttpExceptionFactory.business(
                "系统内置模型不允许删除",
                BusinessCode.OPERATION_NOT_ALLOWED,
            );
        }

        // 检查是否是默认模型
        const defaultModelId = await this.dictService.get(AI_DEFAULT_MODEL);
        if (defaultModelId === id) {
            await this.dictService.deleteByKey(AI_DEFAULT_MODEL);
        }

        await this.aiModelService.delete(id);
        return { message: "AI model deleted successfully" };
    }

    /**
     * 批量删除AI模型
     */
    @Delete()
    @Permissions({
        code: "batch-delete",
        name: "删除AI模型",
    })
    async removeMany(@Body("ids") ids: string[]) {
        // 批量检查是否包含内置模型
        const models = await Promise.all(ids.map((id) => this.aiModelService.findOneById(id)));

        const builtInModels = models.filter((model) => model?.isBuiltIn);
        if (builtInModels.length > 0) {
            const builtInNames = builtInModels.map((m) => m.name).join("、");
            throw HttpExceptionFactory.business(
                `以下系统内置模型不允许删除：${builtInNames}`,
                BusinessCode.OPERATION_NOT_ALLOWED,
            );
        }

        // 过滤掉不存在的模型 ID
        const validIds = models
            .map((model, index) => (model ? ids[index] : null))
            .filter((id) => id !== null);

        if (validIds.length === 0) {
            throw HttpExceptionFactory.business("没有找到可删除的AI模型");
        }

        // 检查是否包含默认模型
        const defaultModelId = await this.dictService.get(AI_DEFAULT_MODEL);
        if (defaultModelId && validIds.includes(defaultModelId)) {
            await this.dictService.deleteByKey(AI_DEFAULT_MODEL);
        }

        const deleted = await this.aiModelService.deleteMany(validIds);
        return {
            message: `Successfully deleted ${deleted} AI models`,
            deleted,
        };
    }

    /**
     * 获取可用模型列表（不分页）
     */
    @Get("available/all")
    @Permissions({
        code: "available-all",
        name: "查看AI模型",
    })
    async getAvailableModels() {
        return await this.aiModelService.getAvailableModels(["apiKey"]);
    }

    /**
     * 获取默认模型
     */
    @Get("default/current")
    @Permissions({
        code: "default-current",
        name: "查看AI模型",
    })
    async getDefaultModel() {
        const model_id = await this.dictService.get(AI_DEFAULT_MODEL);

        if (model_id) {
            const model = await this.aiModelService.findOne({
                where: { id: model_id },
                excludeFields: ["apiKey"],
            });
            if (model && model.isActive) {
                return model;
            }
        }

        const model = await this.aiModelService.findOne({
            where: { isActive: true },
            order: { createdAt: "ASC" },
            excludeFields: ["apiKey"],
        });

        if (model && model.isActive) {
            return model;
        }

        return null;
    }

    /**
     * 设置默认模型
     */
    @Put(":id/default")
    @Permissions({
        code: "default-update",
        name: "设置默认AI模型",
    })
    async setDefault(@Param("id") id: string) {
        await this.dictService.set(AI_DEFAULT_MODEL, id);
        return { message: "Default model set successfully" };
    }
}
