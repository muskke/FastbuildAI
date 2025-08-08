import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { RedisService } from "./redis.service";

/**
 * Redis模块
 *
 * 负责配置和管理与Redis的连接
 * 提供Redis客户端实例和高级Redis操作
 * 从环境变量中读取Redis配置
 */
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: RedisService,
            useFactory: (configService: ConfigService) => {
                return new RedisService(configService);
            },
            inject: [ConfigService],
        },
    ],
    exports: [RedisService],
})
export class RedisModule {}
