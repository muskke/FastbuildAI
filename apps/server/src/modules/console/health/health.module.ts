import { DatabaseModule } from "@core/database/database.module";
import { RedisModule } from "@core/redis/redis.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { HealthController } from "./health.controller";
import { AppHealthIndicator } from "./indicators/app.health";
import { DatabaseHealthIndicator } from "./indicators/database.health";
import { RedisHealthIndicator } from "./indicators/redis.health";

/**
 * 健康检查模块
 * 提供应用程序和依赖服务的健康状态监控
 */
@Module({
    imports: [
        TerminusModule.forRoot({
            errorLogStyle: "pretty",
        }),
        HttpModule,
        RedisModule,
        DatabaseModule,
    ],
    controllers: [HealthController],
    providers: [AppHealthIndicator, DatabaseHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
