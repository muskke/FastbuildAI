import { BaseService } from "@common/base/services/base.service";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DICT_CACHE_EVENTS } from "../constants/dict-events.constant";
import { CreateDictDto } from "../dto/create-dict.dto";
import { UpdateDictDto } from "../dto/update-dict.dto";
import { Dict } from "../entities/dict.entity";

/**
 * 字典配置服务
 */
@Injectable()
export class DictService extends BaseService<Dict> {
    /**
     * 构造函数
     * @param dictRepository 字典配置仓库
     */
    constructor(
        @InjectRepository(Dict)
        private readonly dictRepository: Repository<Dict>,
        private readonly eventEmitter: EventEmitter2,
    ) {
        super(dictRepository);
    }

    /**
     * 创建字典配置
     * @param createDictDto 创建字典配置DTO
     * @returns 创建的字典配置
     */
    async create(createDictDto: CreateDictDto): Promise<Partial<Dict>> {
        // 检查配置键是否已存在
        const existDict = await super.findOne({
            where: { key: createDictDto.key },
        });

        if (existDict) {
            throw HttpExceptionFactory.business(
                `配置键 ${createDictDto.key} 已存在`,
                BusinessCode.DATA_ALREADY_EXISTS,
            );
        }

        // 创建配置
        const dict = await super.create(createDictDto);

        // 发射字典更新事件
        this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_UPDATED, dict);

        return dict;
    }

    /**
     * 获取字典配置值
     * @param key 配置键
     * @param group 配置分组，默认为 default
     * @returns 配置值（自动转换为合适的类型）
     */
    async getValue<T = any>(key: string, group: string = "default"): Promise<T> {
        const dict = await super.findOne({
            where: { key, group },
        });

        if (!dict) {
            throw HttpExceptionFactory.business(`配置 ${key} 在分组 ${group} 中不存在`);
        }

        if (!dict.isEnabled) {
            throw HttpExceptionFactory.business(`配置 ${key} 已被禁用`);
        }

        return this.parseValue<T>(dict.value);
    }

    /**
     * 简化的获取配置方法
     * @param key 配置键
     * @param defaultValue 默认值（如果配置不存在或被禁用时返回）
     * @param group 配置分组，默认为 default
     * @returns 配置值（自动转换为合适的类型）
     */
    async get<T = any>(key: string, defaultValue?: T, group: string = "default"): Promise<T> {
        try {
            const dict = await super.findOne({
                where: { key, group, isEnabled: true },
            });

            if (!dict) {
                return defaultValue as T;
            }

            return this.parseValue<T>(dict.value);
        } catch (error) {
            return defaultValue as T;
        }
    }

    /**
     * 简化的设置配置方法
     * @param key 配置键
     * @param value 配置值（将被自动转换为JSON字符串）
     * @param options 可选参数（分组、描述等）
     * @returns 配置实体
     */
    async set<T = any>(
        key: string,
        value: T,
        options?: {
            group?: string;
            description?: string;
            sort?: number;
            isEnabled?: boolean;
        },
    ): Promise<Partial<Dict>> {
        const group = options?.group || "default";

        // 检查配置是否已存在（同时检查key和group）
        const existDict = await super.findOne({
            where: { key, group },
        });

        // 将值转换为字符串
        const stringValue = this.stringifyValue(value);

        if (existDict) {
            // 更新现有配置，保留原有的group
            const updateData: UpdateDictDto = {
                value: stringValue,
                description:
                    options?.description !== undefined
                        ? options.description
                        : existDict.description,
                sort: options?.sort !== undefined ? options.sort : existDict.sort,
                isEnabled:
                    options?.isEnabled !== undefined ? options.isEnabled : existDict.isEnabled,
            };

            return super.updateById(existDict.id, updateData);
        } else {
            // 创建新配置
            const createData: CreateDictDto = {
                key,
                value: stringValue,
                group,
                description: options?.description,
                sort: options?.sort || 0,
                isEnabled: options?.isEnabled !== undefined ? options.isEnabled : true,
            };

            return super.create(createData);
        }
    }

    /**
     * 将任意值转换为存储用的字符串
     * @param value 要转换的值
     * @returns 存储用的字符串
     */
    private stringifyValue(value: any): string {
        // 如果是简单类型，直接转字符串
        if (value === null || value === undefined) {
            return "";
        }

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        // 其他复杂类型转为JSON
        return JSON.stringify(value);
    }

    /**
     * 将存储的字符串解析为适当的类型
     * @param value 存储的字符串值
     * @returns 解析后的值
     */
    public parseValue<T = any>(value: string): T {
        if (!value) {
            return null as unknown as T;
        }

        // 尝试解析为JSON
        try {
            // 判断是否可能是JSON
            if (
                (value.startsWith("{") && value.endsWith("}")) ||
                (value.startsWith("[") && value.endsWith("]")) ||
                value === "true" ||
                value === "false" ||
                value === "null" ||
                !isNaN(Number(value))
            ) {
                return JSON.parse(value) as T;
            }
        } catch (e) {
            // 解析失败，忽略错误
        }

        // 如果不是JSON，返回原始字符串
        return value as unknown as T;
    }

    /**
     * 更新字典配置
     * @param id 字典配置ID
     * @param updateDictDto 更新字典配置DTO
     * @returns 更新后的字典配置
     */
    async updateById(id: string, updateDictDto: UpdateDictDto): Promise<Dict> {
        // 检查配置是否存在
        const dict = (await super.findOneById(id)) as Dict;

        // 如果更新了配置键，检查新的配置键是否已存在
        if (updateDictDto.key && updateDictDto.key !== dict.key) {
            const existDict = await this.dictRepository.findOne({
                where: { key: updateDictDto.key },
            });

            if (existDict) {
                throw HttpExceptionFactory.business(
                    `配置键 ${updateDictDto.key} 已存在`,
                    BusinessCode.DATA_ALREADY_EXISTS,
                );
            }
        }

        const updatedDict = (await super.updateById(id, updateDictDto)) as Dict;

        // 发射字典更新事件
        this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_UPDATED, updatedDict);

        return updatedDict;
    }

    /**
     * 根据ID删除字典配置
     * @param id 字典配置ID
     */
    async remove(id: string): Promise<void> {
        // 获取要删除的字典配置
        const dict = (await super.findOneById(id)) as Dict;

        if (dict) {
            await super.delete(id);

            // 发射字典删除事件
            this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_DELETED, {
                key: dict.key,
                group: dict.group,
            });
        }
    }

    /**
     * 批量删除字典配置
     * @param ids 字典配置ID数组
     */
    async batchRemove(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) {
            throw HttpExceptionFactory.paramError("请选择要删除的配置");
        }

        // 获取要删除的字典配置
        const dicts = await this.dictRepository.findByIds(ids);

        await super.deleteMany(ids);

        // 发射字典删除事件
        for (const dict of dicts) {
            this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_DELETED, {
                key: dict.key,
                group: dict.group,
            });
        }
    }

    /**
     * 设置字典配置启用状态
     * @param id 字典配置ID
     * @param isEnabled 是否启用
     * @returns 更新后的字典配置
     */
    async setEnabled(id: string, isEnabled: boolean): Promise<Partial<Dict>> {
        // 更新启用状态
        const updatedDict = await super.updateById(id, { isEnabled });

        // 发射字典更新事件
        this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_UPDATED, updatedDict);

        return updatedDict;
    }

    /**
     * 根据键启用或禁用配置
     * @param key 配置键
     * @param isEnabled 是否启用
     * @param group 配置分组，默认为 default
     * @returns 更新后的字典配置
     */
    async enable(
        key: string,
        isEnabled: boolean = true,
        group: string = "default",
    ): Promise<Partial<Dict>> {
        const dict = await super.findOne({
            where: { key, group },
        });

        if (!dict) {
            throw HttpExceptionFactory.business(`配置 ${key} 在分组 ${group} 中不存在`);
        }

        const updatedDict = await super.updateById(dict.id, { isEnabled });

        // 发射字典更新事件
        this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_UPDATED, updatedDict);

        return updatedDict;
    }

    /**
     * 根据组别查询所有该组别的配置记录
     * @param group 配置分组
     * @param onlyEnabled 是否只返回已启用的配置，默认为 true
     * @returns 配置记录数组
     */
    async getByGroup(group: string, onlyEnabled: boolean = true): Promise<Dict[]> {
        const whereCondition: any = { group };

        // 如果只查询启用的配置
        if (onlyEnabled) {
            whereCondition.isEnabled = true;
        }

        return await this.dictRepository.find({
            where: whereCondition,
            order: {
                sort: "ASC",
                createdAt: "DESC",
            },
        });
    }

    /**
     * 根据组别获取配置值映射
     * @param group 配置分组
     * @param onlyEnabled 是否只返回已启用的配置，默认为 true
     * @returns 配置键值对映射
     */
    async getGroupValues<T = any>(
        group: string,
        onlyEnabled: boolean = true,
    ): Promise<Record<string, T>> {
        const configs = await this.getByGroup(group, onlyEnabled);
        const result: Record<string, any> = {};

        for (const config of configs) {
            result[config.key] = this.parseValue(config.value);
        }

        return result as Record<string, T>;
    }

    /**
     * 删除配置
     * @param key 配置键
     * @param group 配置分组，默认为 default
     * @returns 是否成功删除
     */
    async deleteByKey(key: string, group: string = "default"): Promise<boolean> {
        try {
            const dict = (await super.findOne({
                where: { key, group },
            })) as Dict;

            if (!dict) {
                return false;
            }

            await super.delete(dict.id);

            // 发射字典删除事件
            this.eventEmitter.emit(DICT_CACHE_EVENTS.DICT_DELETED, {
                key,
                group,
            });

            return true;
        } catch (error) {
            return false;
        }
    }
}
