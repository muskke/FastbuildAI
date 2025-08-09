import { BaseController } from "@common/base/controllers/base.controller";
import { Public } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { buildWhere } from "@common/utils/helper.util";
import { AiProvider } from "@modules/console/ai/entities/ai-provider.entity";
import { AiProviderService } from "@modules/console/ai/services/ai-provider.service";
import { Get, Param, Query } from "@nestjs/common";
import { Like } from "typeorm";

import { QueryAiProviderDto } from "../dto/ai-provider.dto";

/**
 * AI供应商控制器（前台）
 *
 * 提供AI供应商信息和模型列表查询功能
 */
@WebController("ai-providers")
export class AiProviderController extends BaseController {
    constructor(private readonly aiProviderService: AiProviderService) {
        super();
    }

    /**
     * 获取所有启用的供应商列表
     */
    @Get()
    @Public()
    @BuildFileUrl(["**.iconUrl"])
    async getProviders(@Query() queryDto: QueryAiProviderDto) {
        try {
            const where = [
                buildWhere<AiProvider>({
                    name: queryDto.name ? Like(`%${queryDto.name}%`) : undefined,
                    isActive: true,
                }),
                buildWhere<AiProvider>({
                    provider: queryDto.name ? Like(`%${queryDto.name}%`) : undefined,
                    isActive: true,
                }),
            ];

            // 获取启用的供应商，包含模型关联数据
            const providers = await this.aiProviderService.findAll({
                where,
                relations: ["models"],
                order: { sortOrder: "ASC", createdAt: "DESC" },
                excludeFields: ["apiKey"],
            });

            // 如果指定了supportedModelTypes，则筛选符合条件的模型
            if (queryDto.supportedModelTypes && queryDto.supportedModelTypes.length > 0) {
                // 对每个供应商进行处理
                return providers.map((provider) => {
                    // 筛选模型，只保留modelType在supportedModelTypes中的模型
                    const filteredModels = provider.models.filter((model) => {
                        return (
                            queryDto.supportedModelTypes.includes(model.modelType) && model.isActive
                        );
                    });

                    // 返回处理后的供应商数据，替换原有的models
                    return {
                        ...provider,
                        models: filteredModels,
                    };
                });
            }

            return providers;
        } catch (error) {
            this.logger.error(`获取供应商列表失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取指定供应商信息
     */
    @Get(":id")
    @BuildFileUrl(["**.iconUrl"])
    async getProviderInfo(@Param("id") id: string) {
        try {
            const provider = await this.aiProviderService.findOne({
                where: { id },
                relations: ["models"],
                excludeFields: ["apiKey"],
            });

            if (!provider) {
                throw new Error(`供应商 ${id} 不存在`);
            }

            return provider;
        } catch (error) {
            this.logger.error(`获取供应商信息失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 根据供应商代码获取供应商
     */
    @Get("by-code/:provider")
    @BuildFileUrl(["**.iconUrl"])
    async getProviderByCode(
        @Param("provider") provider: string,
        @Playground() playground: UserPlayground,
    ) {
        try {
            const result = await this.aiProviderService.findOne({
                where: { provider, isActive: true },
                relations: ["models"],
                excludeFields: ["apiKey"],
            });

            if (!result) {
                throw new Error(`供应商 ${provider} 不存在`);
            }

            return result;
        } catch (error) {
            this.logger.error(`获取供应商信息失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}
