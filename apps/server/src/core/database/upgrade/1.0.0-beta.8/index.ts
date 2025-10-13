import { AiModel } from "@modules/console/ai/entities/ai-model.entity";
import { AiProvider } from "@modules/console/ai/entities/ai-provider.entity";
import { Logger } from "@nestjs/common";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";

import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.8 升级逻辑
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);
    /**
     * 供应商Dao
     */
    private readonly aiProviderRepository: Repository<AiProvider>;
    /**
     * 模型Dao
     */
    private readonly aiModelRepository: Repository<AiModel>;

    constructor(dataSource: DataSource, permissionService: PermissionService) {
        this.aiProviderRepository = dataSource.getRepository(AiProvider);
        this.aiModelRepository = dataSource.getRepository(AiModel);
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.8 版本升级逻辑");

        try {
            // 新增初始化供应商
            await this.insertInitializeAiProviders();

            this.logger.debug("✅ 1.0.0-beta.8 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.8 版本升级逻辑执行失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 执行默认供应商信息同步
     */
    private async insertInitializeAiProviders() {
        // 读取新增供应商Json数据
        this.logger.log("开始执行 1.0.0-beta.8 默认供应商信息同步");
        try {
            // 从本地配置文件获取模型配置
            const modelConfigPath = this.getConfigFilePath("model-config.json");
            if (!modelConfigPath) {
                throw new Error("无法找到 model-config.json 文件");
            }

            // 读取配置文件
            const modelConfigData = await fse.readJson(modelConfigPath);
            if (!modelConfigData || !Array.isArray(modelConfigData.configs)) {
                throw new Error("model-config.json 格式不正确，缺少 configs 数组");
            }

            const providerConfigs = modelConfigData.configs;
            const results = [];

            this.logger.log(`从配置文件中读取到 ${providerConfigs.length} 个提供商配置`);

            // 遍历每个供应商配置
            for (const config of providerConfigs) {
                // 查找是否已存在该供应商
                let provider = await this.aiProviderRepository.findOne({
                    where: { provider: config.provider },
                });

                // 准备供应商数据
                const providerData = {
                    provider: config.provider,
                    name: config.label,
                    iconUrl: config.icon_url,
                    isBuiltIn: true,
                    isActive: false,
                    supportedModelTypes: config.supported_model_types,
                    sortOrder: 0,
                };

                // 如果不存在，则创建新供应商
                if (!provider) {
                    provider = await this.aiProviderRepository.save(providerData);
                    this.logger.log(`创建 AI 提供商: ${provider.name}`);
                }
                // 如果存在，则更新供应商信息
                else {
                    await this.aiProviderRepository.update(provider.id, providerData);
                    provider = await this.aiProviderRepository.findOne({
                        where: { id: provider.id },
                    });
                    this.logger.log(`更新 AI 提供商: ${provider.name}`);
                }

                const providerResult = {
                    provider: provider.provider,
                    id: provider.id,
                    models: [],
                };

                // 处理该供应商的所有模型
                for (const modelConfig of config.models) {
                    // 查找是否已存在该模型
                    let model = await this.aiModelRepository.findOne({
                        where: {
                            providerId: provider.id,
                            model: modelConfig.model,
                        },
                    });

                    // 准备模型数据
                    const modelData = {
                        providerId: provider.id,
                        name: modelConfig.label,
                        model: modelConfig.model,
                        modelType: modelConfig.model_type,
                        features: Array.isArray(modelConfig.features) ? modelConfig.features : [],
                        isActive: true,
                        isBuiltIn: true,
                        sortOrder: 0,
                        modelConfig: {
                            ...modelConfig.model_properties,
                        },
                    };

                    // 如果存在上下文大小信息，设置到maxContext字段
                    if (modelConfig.model_properties?.context_size) {
                        modelData.modelConfig.maxContext =
                            modelConfig.model_properties.context_size;
                    }

                    // 如果不存在，则创建新模型
                    if (!model) {
                        model = await this.aiModelRepository.save(modelData);
                        this.logger.log(`创建 AI 模型: ${model.name}`);
                    }
                    // 如果存在，则更新模型信息
                    else {
                        await this.aiModelRepository.update(model.id, modelData);
                        model = await this.aiModelRepository.findOne({
                            where: { id: model.id },
                        });
                        this.logger.log(`更新 AI 模型: ${model.name}`);
                    }

                    providerResult.models.push({
                        id: model.id,
                        name: model.name,
                        model: model.model,
                    });
                }

                results.push(providerResult);
            }
            this.logger.log(`✅ 同步 AI 默认供应商信息完成，共 ${results.length} 个提供商`);
        } catch (error) {
            this.logger.error(`❌ 同步 AI 默认供应商信息失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取配置文件路径
     *
     * 检查多个可能的路径，返回第一个存在的文件路径
     *
     * @param fileName 配置文件名
     * @returns 文件路径，如果找不到则返回 null
     */
    private getConfigFilePath(fileName: string): string | null {
        const possiblePaths = [
            path.join(process.cwd(), `src/core/database/install/${fileName}`), // 在 apps/server 目录下运行
            path.join(process.cwd(), `apps/server/src/core/database/install/${fileName}`), // 在项目根目录下运行
            path.join(__dirname, `install/${fileName}`), // 编译后的路径
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }
}
