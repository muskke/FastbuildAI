import type { Cache } from "@nestjs/cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";

/**
 * 缓存服务
 *
 * 提供缓存操作的封装，包括基本的缓存操作
 * 使用NestJS的CacheManager进行缓存管理
 * 使用内存存储，适用于非分布式部署场景
 */
@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存值
     */
    async get<T>(key: string): Promise<T | undefined> {
        return this.cacheManager.get<T>(key);
    }

    /**
     * 设置缓存
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 过期时间（秒），可选
     */
    async set(key: string, value: any, ttl?: number): Promise<void> {
        await this.cacheManager.set(key, value, { ttl: ttl ? ttl * 1000 : undefined } as any);
    }

    /**
     * 删除缓存
     * @param key 缓存键
     */
    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    /**
     * 重置所有缓存
     */
    async reset(): Promise<void> {
        await this.cacheManager.clear();
    }
}
