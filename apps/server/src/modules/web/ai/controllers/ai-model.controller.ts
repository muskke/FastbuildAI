import { BaseController } from "@common/base/controllers/base.controller";
import { AI_DEFAULT_MODEL } from "@common/constants";
import { Public } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Get, Param } from "@nestjs/common";

import { AiModelService } from "@/modules/console/ai/services/ai-model.service";

/**
 * AI模型信息控制器（前台）
 *
 * 提供AI模型信息查询功能
 */
@WebController("ai-models")
export class AiModelController extends BaseController {
    constructor(
        private readonly aiModelService: AiModelService,
        private readonly dictService: DictService,
    ) {
        super();
    }

    /**
     * 获取用户可用的模型列表
     */
    @Get()
    async getAvailableModels() {
        return await this.aiModelService.getAvailableModels();
    }

    /**
     * 获取模型详细信息
     */
    @Get(":id")
    async getModelInfo(@Param("id") id: string) {
        const result = await this.aiModelService.findOneById(id, {
            excludeFields: ["apiKey"],
        });

        if (!result) {
            throw new Error(`模型 ${id} 不存在`);
        }

        return result;
    }

    /**
     * 获取默认模型
     */
    @Public()
    @Get("default/current")
    async getDefaultModel() {
        const model_id = await this.dictService.get(AI_DEFAULT_MODEL);

        if (model_id) {
            const model = await this.aiModelService.findOneById(model_id, {
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
}
