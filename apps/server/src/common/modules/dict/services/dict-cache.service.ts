import { TerminalLogger } from "@common/utils/log.util";
import { CacheService } from "@core/cache/cache.service";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DICT_CACHE_EVENTS } from "../constants/dict-events.constant";
import { Dict } from "../entities/dict.entity";
import { DictService } from "./dict.service";

/**
 * 字典缓存服务
 *
 * 提供字典配置的缓存管理功能，包括：
 * 1. 在模块初始化时加载所有字典配置到内存缓存
 * 2. 监听字典更新事件，同步更新内存缓存
 * 3. 提供缓存查询接口，优先从缓存获取字典配置
 */
@Injectable()
export class DictCacheService {
    private readonly logger = new Logger(DictCacheService.name);
    private readonly CACHE_KEY_PREFIX = "dict:";
    private readonly ALL_DICTS_CACHE_KEY = "dict:all";

    /**
     * 构造函数
     * @param dictRepository 字典配置仓库
     * @param cacheService 缓存服务
     */
    constructor(
        @InjectRepository(Dict)
        private readonly dictRepository: Repository<Dict>,
        private readonly cacheService: CacheService,
        private readonly dictService: DictService,
    ) {}

    /**
     * 加载所有字典配置到缓存
     */
    async loadAllDictsToCache() {
        try {
            // 查询所有字典配置
            const dicts = await this.dictRepository.find();

            // 缓存所有字典配置
            await this.cacheService.set(this.ALL_DICTS_CACHE_KEY, dicts);

            // 按照 key:group 分别缓存
            for (const dict of dicts) {
                const cacheKey = this.getCacheKey(dict.key, dict.group);
                await this.cacheService.set(cacheKey, dict);
            }

            this.logger.log(`已加载 ${dicts.length} 个字典配置到缓存`);
        } catch (error) {
            this.logger.error("加载字典配置到缓存失败", error);
        }
    }

    /**
     * 监听字典更新事件
     * @param dict 更新后的字典配置
     */
    @OnEvent(DICT_CACHE_EVENTS.DICT_UPDATED)
    async handleDictUpdatedEvent(dict: Dict) {
        this.logger.debug(`字典配置已更新: ${dict.key}@${dict.group}`);

        // 更新单个字典缓存
        const cacheKey = this.getCacheKey(dict.key, dict.group);
        await this.cacheService.set(cacheKey, dict);

        // 更新全部字典缓存
        await this.refreshAllDictsCache();
    }

    /**
     * 监听字典删除事件
     * @param params 删除的字典配置参数
     */
    @OnEvent(DICT_CACHE_EVENTS.DICT_DELETED)
    async handleDictDeletedEvent(params: { key: string; group: string }) {
        const { key, group } = params;
        this.logger.debug(`字典配置已删除: ${key}@${group}`);

        // 删除单个字典缓存
        const cacheKey = this.getCacheKey(key, group);
        await this.cacheService.del(cacheKey);

        // 更新全部字典缓存
        await this.refreshAllDictsCache();
    }

    /**
     * 刷新全部字典缓存
     */
    private async refreshAllDictsCache() {
        const dicts = await this.dictRepository.find();
        await this.cacheService.set(this.ALL_DICTS_CACHE_KEY, dicts);
    }

    /**
     * 获取字典配置缓存键
     * @param key 配置键
     * @param group 配置分组
     * @returns 缓存键
     */
    private getCacheKey(key: string, group: string = "default"): string {
        return `${this.CACHE_KEY_PREFIX}${group}:${key}`;
    }

    /**
     * 从缓存获取字典配置值
     * @param key 配置键
     * @param defaultValue 默认值
     * @param group 配置分组，默认为 default
     * @returns 配置值
     */
    async get<T = any>(key: string, defaultValue?: T, group: string = "default"): Promise<T> {
        try {
            // 尝试从缓存获取
            const cacheKey = this.getCacheKey(key, group);
            const cachedDict = await this.cacheService.get<Dict>(cacheKey);

            if (cachedDict && cachedDict.isEnabled) {
                return this.dictService.parseValue<T>(cachedDict.value);
            }

            // 缓存未命中，从数据库获取并更新缓存
            const value = await this.dictService.get<T>(key, defaultValue, group);

            // 如果从数据库获取成功，更新缓存
            const dict = await this.dictRepository.findOne({
                where: { key, group, isEnabled: true },
            });

            if (dict) {
                await this.cacheService.set(cacheKey, dict);
            }

            return value;
        } catch (error) {
            return defaultValue as T;
        }
    }

    /**
     * 获取所有字典配置
     * @returns 所有字典配置
     */
    async getAll(): Promise<Dict[]> {
        try {
            // 尝试从缓存获取
            const cachedDicts = await this.cacheService.get<Dict[]>(this.ALL_DICTS_CACHE_KEY);

            if (cachedDicts) {
                return cachedDicts;
            }

            // 缓存未命中，从数据库获取并更新缓存
            await this.loadAllDictsToCache();
            return (await this.cacheService.get<Dict[]>(this.ALL_DICTS_CACHE_KEY)) || [];
        } catch (error) {
            this.logger.error("获取所有字典配置失败", error);
            return [];
        }
    }

    /**
     * 根据组别获取所有配置
     * @param group 配置分组
     * @param onlyEnabled 是否只返回已启用的配置，默认为 true
     * @returns 配置记录数组
     */
    async getByGroup(group: string, onlyEnabled: boolean = true): Promise<Dict[]> {
        try {
            // 先获取所有配置
            const allDicts = await this.getAll();

            // 过滤出指定组别的配置
            return allDicts.filter((dict) => {
                // 匹配组别
                const groupMatch = dict.group === group;

                // 如果需要过滤启用状态
                if (onlyEnabled) {
                    return groupMatch && dict.isEnabled;
                }

                return groupMatch;
            });
        } catch (error) {
            this.logger.error(`获取组别 ${group} 的配置失败`, error);
            return [];
        }
    }

    /**
     * 根据组别获取配置值映射
     * @param group 配置分组
     * @param onlyEnabled 是否只返回已启用的配置，默认为 true
     * @returns 配置键值对映射
     */
    async getGroupValues<T = any>(group: string, onlyEnabled: boolean = true): Promise<T> {
        try {
            const configs = await this.getByGroup(group, onlyEnabled);
            const result: Record<string, any> = {};

            for (const config of configs) {
                result[config.key] = this.dictService.parseValue(config.value);
            }

            return result as T;
        } catch (error) {
            this.logger.error(`获取组别 ${group} 的配置值映射失败`, error);
            return {} as T;
        }
    }

    /**
     * 清除字典缓存
     */
    async clearCache() {
        this.logger.log("清除字典缓存");

        // 获取所有字典配置
        const dicts = await this.dictRepository.find();

        // 删除所有单个字典缓存
        for (const dict of dicts) {
            const cacheKey = this.getCacheKey(dict.key, dict.group);
            await this.cacheService.del(cacheKey);
        }

        // 删除全部字典缓存
        await this.cacheService.del(this.ALL_DICTS_CACHE_KEY);
    }
}
