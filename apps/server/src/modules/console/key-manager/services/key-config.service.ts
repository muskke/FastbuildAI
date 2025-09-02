import { BaseService } from "@common/base/services/base.service";
import { BooleanNumber, BooleanNumberType } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { AiProviderService } from "@modules/console/ai/services/ai-provider.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Raw, Repository } from "typeorm";

import {
    CreateKeyConfigDto,
    KeyConfigUsageDto,
    QueryKeyConfigDto,
    UpdateKeyConfigDto,
} from "../dto/key-config.dto";
import { KeyConfig } from "../entities/key-config.entity";
import { KeyTemplate } from "../entities/key-template.entity";

/**
 * 密钥配置服务
 */
@Injectable()
export class KeyConfigService extends BaseService<KeyConfig> {
    /**
     * 构造函数
     * @param keyConfigRepository 密钥配置仓库
     * @param keyTemplateRepository 密钥模板仓库
     */
    constructor(
        @InjectRepository(KeyConfig)
        private readonly keyConfigRepository: Repository<KeyConfig>,
        @InjectRepository(KeyTemplate)
        private readonly keyTemplateRepository: Repository<KeyTemplate>,
        private readonly aiProviderService: AiProviderService,
    ) {
        super(keyConfigRepository);
    }

    /**
     * 创建密钥配置
     * @param createKeyConfigDto 创建密钥配置DTO
     * @returns 创建的密钥配置
     */
    async create(createKeyConfigDto: CreateKeyConfigDto): Promise<Partial<KeyConfig>> {
        // 检查模板是否存在且启用
        const template = await this.keyTemplateRepository.findOne({
            where: { id: createKeyConfigDto.templateId, isEnabled: BooleanNumber.YES },
        });

        if (!template) {
            throw HttpExceptionFactory.business("所选模板不存在或已被禁用");
        }

        // 检查在相同模板下配置名称是否已存在
        const existConfig = await super.findOne({
            where: {
                name: createKeyConfigDto.name,
                templateId: createKeyConfigDto.templateId,
            },
        });

        if (existConfig) {
            throw HttpExceptionFactory.business(
                `在模板 ${template.name} 下，配置名称 ${createKeyConfigDto.name} 已存在`,
            );
        }

        // 验证字段值与模板字段配置的匹配性
        this.validateFieldValues(createKeyConfigDto.fieldValues, template.fieldConfig);

        // 处理敏感字段加密
        const processedFieldValues = this.processFieldValues(createKeyConfigDto.fieldValues);
        console.log("createKeyConfigDto", createKeyConfigDto);
        // 创建配置
        const configData = {
            ...createKeyConfigDto,
            fieldValues: processedFieldValues,
        };

        return await super.create(configData);
    }

    /**
     * 更新密钥配置
     * @param id 配置ID
     * @param updateKeyConfigDto 更新密钥配置DTO
     * @returns 更新后的密钥配置
     */
    async updateById(
        id: string,
        updateKeyConfigDto: UpdateKeyConfigDto,
    ): Promise<Partial<KeyConfig>> {
        // 检查配置是否存在
        const config = await this.keyConfigRepository.findOne({
            where: { id },
            relations: ["template"],
        });

        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        // 如果更新了配置名称，检查在相同模板下新的配置名称是否已存在
        if (updateKeyConfigDto.name && updateKeyConfigDto.name !== config.name) {
            const existConfig = await super.findOne({
                where: {
                    name: updateKeyConfigDto.name,
                    templateId: config.templateId,
                },
            });

            if (existConfig) {
                throw HttpExceptionFactory.business(
                    `在模板 ${config.template.name} 下，配置名称 ${updateKeyConfigDto.name} 已存在`,
                );
            }
        }

        // 如果更新了字段值，验证与模板的匹配性
        if (updateKeyConfigDto.fieldValues) {
            this.validateFieldValues(updateKeyConfigDto.fieldValues, config.template.fieldConfig);
            updateKeyConfigDto.fieldValues = this.processFieldValues(
                updateKeyConfigDto.fieldValues,
            );
        }

        return await super.updateById(id, updateKeyConfigDto);
    }

    /**
     * 分页查询密钥配置
     * @param queryKeyConfigDto 查询密钥配置DTO
     * @returns 分页结果
     */
    async paginate(queryKeyConfigDto: QueryKeyConfigDto) {
        const { name, templateId, status, ...paginationDto } = queryKeyConfigDto;

        // 构建查询条件
        const whereConditions: any = {};

        // 配置名称模糊查询
        if (name) {
            whereConditions.name = Like(`%${name}%`);
        }

        // 模板ID精确查询
        if (templateId) {
            whereConditions.templateId = templateId;
        }

        // 配置状态查询
        if (status) {
            whereConditions.status = status;
        }

        return await super.paginate(paginationDto as PaginationDto, {
            where: whereConditions,
            relations: ["template"],
            order: {
                sortOrder: "DESC",
                createdAt: "DESC",
            },
            excludeFields: ["fieldValues"], // 默认不返回敏感字段值
        });
    }

    /**
     * 根据ID获取配置详情（包含字段值）
     * @param id 配置ID
     * @param includeSensitive 是否包含敏感字段值（已废弃，始终返回解密后的值）
     * @returns 配置详情
     */
    async getConfigDetail(id: string, includeSensitive: boolean = false): Promise<any> {
        const config = await this.keyConfigRepository.findOne({
            where: { id },
            relations: ["template"],
        });

        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        // 处理字段值显示 - 始终返回解密后的值
        const processedConfig = { ...config };
        processedConfig.fieldValues = this.decryptFieldValues(config.fieldValues);

        return processedConfig;
    }

    /**
     * 根据模板ID获取配置列表
     * @param templateId 模板ID
     * @param onlyActive 是否只返回激活的配置
     * @returns 配置列表
     */
    async getConfigsByTemplate(
        templateId: string,
        onlyActive: boolean = true,
    ): Promise<KeyConfig[]> {
        const whereConditions: any = { templateId };

        if (onlyActive) {
            whereConditions.status = true;
        }

        return await super.findAll({
            where: whereConditions,
            order: {
                sortOrder: "DESC",
                createdAt: "DESC",
            },
            excludeFields: ["fieldValues"], // 不返回敏感字段值
        });
    }

    /**
     * 设置配置状态
     * @param id 配置ID
     * @param status 配置状态
     * @returns 更新后的配置
     */
    async setStatus(id: string, status: BooleanNumberType): Promise<Partial<KeyConfig>> {
        const config = await super.findOneById(id);
        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        return await super.updateById(id, { status });
    }

    /**
     * 删除密钥配置
     * @param id 密钥配置ID
     */
    async delete(id: string): Promise<void> {
        // 先查询密钥配置是否存在
        const config = await super.findOneById(id);
        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        try {
            // 查询并更新所有绑定了该密钥配置的AI供应商
            const aiProviders = await this.aiProviderService.findAll({
                where: { bindKeyConfigId: id },
            });

            // 清除所有供应商的bindKeyConfigId
            for (const provider of aiProviders) {
                await this.aiProviderService.updateById(provider.id, {
                    bindKeyConfigId: null,
                    // 如果供应商处于激活状态，则设置为非激活
                    isActive: false,
                });
                this.logger.log(`已清除AI供应商 ${provider.name}(${provider.id}) 的密钥配置绑定`);
            }

            // 删除密钥配置
            await super.delete(id);
            this.logger.log(`密钥配置 ${id} 删除成功`);
        } catch (error) {
            this.logger.error(`删除密钥配置失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal("删除密钥配置失败");
        }
    }

    /**
     * 批量删除密钥配置
     * @param ids 密钥配置ID数组
     * @returns 成功删除的数量
     */
    async batchDelete(ids: string[]): Promise<number> {
        if (!ids || ids.length === 0) {
            return 0;
        }

        let successCount = 0;
        const errors = [];

        for (const id of ids) {
            try {
                // 查询并更新所有绑定了该密钥配置的AI供应商
                const aiProviders = await this.aiProviderService.findAll({
                    where: { bindKeyConfigId: id },
                });

                // 清除所有供应商的bindKeyConfigId
                for (const provider of aiProviders) {
                    await this.aiProviderService.updateById(provider.id, {
                        bindKeyConfigId: null,
                        // 如果供应商处于激活状态，则设置为非激活
                        isActive: false,
                    });
                    this.logger.log(
                        `已清除AI供应商 ${provider.name}(${provider.id}) 的密钥配置绑定`,
                    );
                }

                // 删除密钥配置
                await super.delete(id);
                this.logger.log(`密钥配置 ${id} 删除成功`);
                successCount++;
            } catch (error) {
                this.logger.error(`删除密钥配置 ${id} 失败: ${error.message}`, error.stack);
                errors.push({ id, message: error.message });
            }
        }

        if (errors.length > 0 && successCount === 0) {
            throw HttpExceptionFactory.internal(`批量删除密钥配置失败: ${JSON.stringify(errors)}`);
        }

        return successCount;
    }

    /**
     * 记录配置使用情况
     * @param keyConfigUsageDto 使用统计DTO
     */
    async recordUsage(keyConfigUsageDto: KeyConfigUsageDto): Promise<void> {
        const { configId } = keyConfigUsageDto;

        const config = await super.findOneById(configId);
        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        // 更新使用统计
        await super.updateById(configId, {
            lastUsedAt: new Date(),
            usageCount: (config.usageCount || 0) + 1,
        });
    }

    /**
     * 检查并更新过期状态
     * 注意: 由于状态改为布尔值，此方法已不再需要
     */
    async checkAndUpdateExpiredConfigs(): Promise<number> {
        // 状态改为布尔值后，不再有过期状态的概念
        return 0;
    }

    /**
     * 获取配置的键值对
     * @param id 配置ID
     * @returns 配置的键值对对象，值包含value和required属性
     */
    async getConfigKeyValuePairs(
        id: string,
    ): Promise<Record<string, { value: string; required: boolean }>> {
        const config = await this.keyConfigRepository.findOne({
            where: { id },
            relations: ["template"],
        });

        if (!config) {
            throw HttpExceptionFactory.notFound("密钥配置不存在");
        }

        // 创建模板字段映射，方便查找字段的required属性
        const templateFieldMap = new Map();
        if (config.template && config.template.fieldConfig) {
            config.template.fieldConfig.forEach((field) => {
                templateFieldMap.set(field.name, field);
            });
        }

        // 将字段配置转换为键值对
        const keyValuePairs: Record<string, { value: string; required: boolean }> = {};

        if (config.fieldValues && Array.isArray(config.fieldValues)) {
            config.fieldValues.forEach((field) => {
                if (field.name && field.value !== undefined) {
                    // 如果字段被加密，先解密
                    const value = field.encrypted ? this.decryptValue(field.value) : field.value;

                    // 获取模板中该字段的配置信息
                    const templateField = templateFieldMap.get(field.name);

                    keyValuePairs[field.name] = {
                        value: value || "",
                        required: templateField?.required || false,
                    };
                }
            });
        }

        return keyValuePairs;
    }

    /**
     * 获取配置统计信息
     * @param templateId 可选的模板ID，用于筛选特定模板的统计
     * @returns 统计信息
     */
    async getConfigStats(templateId?: string): Promise<any> {
        const queryBuilder = this.keyConfigRepository.createQueryBuilder("config");

        if (templateId) {
            queryBuilder.where("config.templateId = :templateId", { templateId });
        }

        const [total, active, inactive] = await Promise.all([
            queryBuilder.getCount(),
            queryBuilder.clone().andWhere("config.status = :status", { status: true }).getCount(),
            queryBuilder.clone().andWhere("config.status = :status", { status: false }).getCount(),
        ]);

        return {
            total,
            active,
            inactive,
        };
    }

    /**
     * 验证字段值与模板字段配置的匹配性
     * @param fieldValues 字段值数组
     * @param templateFields 模板字段配置数组
     */
    private validateFieldValues(fieldValues: any[], templateFields: any[]): void {
        // 创建模板字段映射
        const templateFieldMap = new Map();
        templateFields.forEach((field) => {
            templateFieldMap.set(field.name, field);
        });

        // 验证必填字段
        const requiredFields = templateFields.filter((field) => field.required);
        const providedFieldNames = fieldValues.map((fv) => fv.name);

        for (const requiredField of requiredFields) {
            if (!providedFieldNames.includes(requiredField.name)) {
                throw HttpExceptionFactory.paramError(`必填字段 "${requiredField.label}" 不能为空`);
            }
        }

        // 验证字段值
        for (const fieldValue of fieldValues) {
            const templateField = templateFieldMap.get(fieldValue.name);
            if (!templateField) {
                throw HttpExceptionFactory.paramError(`字段 "${fieldValue.name}" 不存在于模板中`);
            }

            // 对于必填字段，只验证字段是否存在，允许空值保存
            // 移除对空字符串的验证，允许保存空值
        }
    }

    /**
     * 处理字段值（加密敏感字段）
     * @param fieldValues 字段值数组
     * @returns 处理后的字段值数组
     */
    private processFieldValues(fieldValues: any[]): any[] {
        return fieldValues.map((fieldValue) => {
            // 确保即使是空值也保存，将 undefined 和 null 转换为空字符串
            const processedValue = fieldValue.value ?? "";

            // 对于密码类型的字段，标记为加密
            if (
                fieldValue.name.toLowerCase().includes("password") ||
                fieldValue.name.toLowerCase().includes("secret") ||
                fieldValue.name.toLowerCase().includes("key")
            ) {
                return {
                    ...fieldValue,
                    encrypted: true,
                    // 这里应该实际加密，暂时简化处理
                    value: this.encryptValue(processedValue),
                };
            }
            return {
                ...fieldValue,
                value: processedValue,
            };
        });
    }

    /**
     * 加密字段值（简化实现）
     * @param value 原始值
     * @returns 加密后的值
     */
    private encryptValue(value: string): string {
        // 这里应该使用真正的加密算法，暂时使用Base64编码作为示例
        return Buffer.from(value).toString("base64");
    }

    /**
     * 解密字段值（简化实现）
     * @param fieldValues 字段值数组
     * @returns 解密后的字段值数组
     */
    private decryptFieldValues(fieldValues: any[]): any[] {
        return fieldValues.map((fieldValue) => {
            if (fieldValue.encrypted) {
                return {
                    ...fieldValue,
                    value: this.decryptValue(fieldValue.value),
                };
            }
            return fieldValue;
        });
    }

    /**
     * 解密字段值（简化实现）
     * @param encryptedValue 加密的值
     * @returns 解密后的值
     */
    private decryptValue(encryptedValue: string): string {
        try {
            return Buffer.from(encryptedValue, "base64").toString();
        } catch {
            return encryptedValue; // 解密失败返回原值
        }
    }

    /**
     * 掩码敏感字段
     * @param fieldValues 字段值数组
     * @returns 掩码后的字段值数组
     */
    private maskSensitiveFields(fieldValues: any[]): any[] {
        return fieldValues.map((fieldValue) => {
            if (fieldValue.encrypted) {
                return {
                    ...fieldValue,
                    value: "******", // 敏感字段用星号掩码
                };
            }
            return fieldValue;
        });
    }
}
