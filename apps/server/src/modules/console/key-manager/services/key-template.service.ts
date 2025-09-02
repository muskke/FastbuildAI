import { BaseService } from "@common/base/services/base.service";
import { BooleanNumber, BooleanNumberType } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { isEnabled } from "@common/utils/is.util";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

import {
    CreateKeyTemplateDto,
    ImportKeyTemplateJsonDto,
    QueryKeyTemplateDto,
    UpdateKeyTemplateDto,
} from "../dto/key-template.dto";
import { KeyTemplate, KeyTemplateType } from "../entities/key-template.entity";

/**
 * 密钥模板服务
 */
@Injectable()
export class KeyTemplateService extends BaseService<KeyTemplate> {
    /**
     * 构造函数
     * @param keyTemplateRepository 密钥模板仓库
     */
    constructor(
        @InjectRepository(KeyTemplate)
        private readonly keyTemplateRepository: Repository<KeyTemplate>,
    ) {
        super(keyTemplateRepository);
    }

    /**
     * 创建密钥模板
     * @param createKeyTemplateDto 创建密钥模板DTO
     * @returns 创建的密钥模板
     */
    async create(createKeyTemplateDto: CreateKeyTemplateDto): Promise<Partial<KeyTemplate>> {
        // 检查模板名称是否已存在
        const existTemplate = await super.findOne({
            where: { name: createKeyTemplateDto.name },
        });

        if (existTemplate) {
            throw HttpExceptionFactory.business(
                `模板名称 ${createKeyTemplateDto.name} 已存在`,
                BusinessCode.DATA_ALREADY_EXISTS,
            );
        }

        // 验证字段配置的合法性
        this.validateFieldConfig(createKeyTemplateDto.fieldConfig);

        // 创建模板
        return await super.create(createKeyTemplateDto);
    }

    /**
     * 更新密钥模板
     * @param id 模板ID
     * @param updateKeyTemplateDto 更新密钥模板DTO
     * @returns 更新后的密钥模板
     */
    async updateById(
        id: string,
        updateKeyTemplateDto: UpdateKeyTemplateDto,
    ): Promise<Partial<KeyTemplate>> {
        // 检查模板是否存在
        const template = await super.findOneById(id);
        if (!template) {
            throw HttpExceptionFactory.notFound("密钥模板不存在");
        }

        // 如果更新了模板名称，检查新的模板名称是否已存在
        if (updateKeyTemplateDto.name && updateKeyTemplateDto.name !== template.name) {
            const existTemplate = await super.findOne({
                where: { name: updateKeyTemplateDto.name },
            });

            if (existTemplate) {
                throw HttpExceptionFactory.business(
                    `模板名称 ${updateKeyTemplateDto.name} 已存在`,
                    BusinessCode.DATA_ALREADY_EXISTS,
                );
            }
        }

        // 验证字段配置的合法性
        if (updateKeyTemplateDto.fieldConfig) {
            this.validateFieldConfig(updateKeyTemplateDto.fieldConfig);
        }

        return await super.updateById(id, updateKeyTemplateDto);
    }

    /**
     * 分页查询密钥模板
     * @param queryKeyTemplateDto 查询密钥模板DTO
     * @returns 分页结果
     */
    async paginate(queryKeyTemplateDto: QueryKeyTemplateDto) {
        const { name, type, isEnabled, ...paginationDto } = queryKeyTemplateDto;

        // 构建查询条件
        const whereConditions: any = {};

        // 模板名称模糊查询
        if (name) {
            whereConditions.name = Like(`%${name}%`);
        }

        // 模板类型精确查询
        if (type) {
            whereConditions.type = type;
        }

        // 启用状态查询
        if (isEnabled !== undefined) {
            whereConditions.isEnabled = isEnabled;
        }

        return await super.paginate(paginationDto as PaginationDto, {
            where: whereConditions,
            order: {
                sortOrder: "DESC",
                createdAt: "DESC",
            },
        });
    }

    /**
     * 获取所有启用的模板
     * @returns 启用的模板列表
     */
    async getEnabledTemplates(): Promise<KeyTemplate[]> {
        return await super.findAll({
            where: { isEnabled: BooleanNumber.YES },
            relations: ["keyConfigs"],
            order: {
                sortOrder: "DESC",
                createdAt: "DESC",
            },
        });
    }

    /**
     * 设置模板启用状态
     * @param id 模板ID
     * @param isEnabled 是否启用
     * @returns 更新后的模板
     */
    async setEnabled(id: string, isEnabled: BooleanNumberType): Promise<Partial<KeyTemplate>> {
        const template = await super.findOneById(id);
        if (!template) {
            throw HttpExceptionFactory.notFound("密钥模板不存在");
        }

        return await super.updateById(id, { isEnabled });
    }

    /**
     * 删除模板（检查是否有关联的密钥配置）
     * @param id 模板ID
     */
    async delete(id: string): Promise<void> {
        const template = await this.keyTemplateRepository.findOne({
            where: { id },
            relations: ["keyConfigs"],
        });

        if (!template) {
            throw HttpExceptionFactory.notFound("密钥模板不存在");
        }

        // 检查是否有关联的密钥配置
        if (template.keyConfigs && template.keyConfigs.length > 0) {
            throw HttpExceptionFactory.business("该模板下还有密钥配置，无法删除");
        }

        await super.delete(id);
    }

    /**
     * 批量删除模板
     * @param ids 模板ID数组
     * @returns 删除的数量
     */
    async batchDelete(ids: string[]): Promise<number> {
        if (!ids || ids.length === 0) {
            throw HttpExceptionFactory.paramError("请选择要删除的模板");
        }

        // 检查每个模板是否有关联的密钥配置
        for (const id of ids) {
            const template = await this.keyTemplateRepository.findOne({
                where: { id },
                relations: ["keyConfigs"],
            });

            if (template && template.keyConfigs && template.keyConfigs.length > 0) {
                throw HttpExceptionFactory.business(
                    `模板 "${template.name}" 下还有密钥配置，无法删除`,
                );
            }
        }

        return await super.deleteMany(ids);
    }

    /**
     * 验证字段配置的合法性
     * @param fieldConfig 字段配置数组
     */
    private validateFieldConfig(fieldConfig: any[]): void {
        if (!fieldConfig || fieldConfig.length === 0) {
            throw HttpExceptionFactory.paramError("字段配置不能为空");
        }

        // 检查字段名称是否重复
        const fieldNames = fieldConfig.map((field) => field.name);
        const uniqueNames = new Set(fieldNames);
        if (fieldNames.length !== uniqueNames.size) {
            throw HttpExceptionFactory.paramError("字段名称不能重复");
        }

        // 检查必填字段
        for (const field of fieldConfig) {
            if (!field.name || !field.type) {
                throw HttpExceptionFactory.paramError("字段名称、标签和类型不能为空");
            }

            // 验证字段名称格式（只允许字母、数字、下划线）
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
                throw HttpExceptionFactory.paramError(
                    `字段名称 "${field.name}" 格式不正确，只允许字母、数字、下划线，且不能以数字开头`,
                );
            }
        }
    }

    /**
     * 通过导入JSON创建密钥模板
     * @param importDto 导入JSON的DTO
     * @returns 创建的密钥模板列表
     */
    async importFromJson(importDto: ImportKeyTemplateJsonDto): Promise<Partial<KeyTemplate>[]> {
        try {
            // 解析JSON数据
            const jsonData = JSON.parse(importDto.jsonData);

            // 判断是单个模板还是模板数组
            const templateDataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

            if (templateDataArray.length === 0) {
                throw HttpExceptionFactory.paramError("JSON数据不包含有效的模板信息");
            }

            const results: Partial<KeyTemplate>[] = [];

            // 逐个处理模板数据
            for (const templateData of templateDataArray) {
                // 验证必要字段
                if (!templateData.name || !templateData.fieldConfig) {
                    throw HttpExceptionFactory.paramError(
                        "模板数据缺少必要字段：name或fieldConfig",
                    );
                }

                // 构建CreateKeyTemplateDto对象
                const createDto: CreateKeyTemplateDto = {
                    name: templateData.name,
                    type: templateData.type || KeyTemplateType.CUSTOM,
                    fieldConfig: templateData.fieldConfig,
                    isEnabled:
                        templateData.isEnabled !== undefined
                            ? templateData.isEnabled
                            : BooleanNumber.YES,
                    sortOrder: templateData.sortOrder || 0,
                };

                // 验证字段配置
                this.validateFieldConfig(createDto.fieldConfig);

                // 检查模板名称是否已存在
                const existTemplate = await super.findOne({
                    where: { name: createDto.name },
                });

                if (existTemplate) {
                    throw HttpExceptionFactory.business(
                        `模板名称 ${createDto.name} 已存在`,
                        BusinessCode.DATA_ALREADY_EXISTS,
                    );
                }

                // 创建模板
                const result = await super.create(createDto);
                results.push(result);
            }

            return results;
        } catch (error) {
            // 处理JSON解析错误
            if (error instanceof SyntaxError) {
                throw HttpExceptionFactory.paramError("JSON格式不正确，无法解析");
            }

            // 抛出其他错误
            throw error;
        }
    }
}
