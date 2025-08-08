import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CacheService } from "./cache.service";

/**
 * 缓存模块
 *
 * 负责配置和管理缓存功能
 * 使用内存作为存储引擎
 * 从环境变量中读取缓存配置
 */
@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return {
                    // 使用默认的内存存储
                    ttl: configService.get<number>("CACHE_TTL", 60 * 60 * 24), // 默认缓存时间为24小时
                    max: configService.get<number>("CACHE_MAX_ITEMS", 100), // 最大缓存项数
                };
            },
        }),
    ],
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule {}
