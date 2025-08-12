import { User } from "@common/modules/auth/entities/user.entity";
import { BullModule } from "@nestjs/bull";
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiConsoleModule } from "@/modules/console/ai/ai.module";
import { AiDatasetsModule } from "@/modules/console/ai-datasets/datasets.module";
import { Datasets } from "@/modules/console/ai-datasets/entities/datasets.entity";
import { DatasetsDocument } from "@/modules/console/ai-datasets/entities/datasets-document.entity";
import { DatasetsSegments } from "@/modules/console/ai-datasets/entities/datasets-segments.entity";
import { VectorizationQueueService } from "@/modules/console/ai-datasets/services/vectorization-queue.service";

import { DefaultProcessor } from "./processors/default.processor";
import { EmailProcessor } from "./processors/email.processor";
import { VectorizationProcessor } from "./processors/vectorization.processor";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";

/**
 * 队列模块
 *
 * 基于 Bull 实现的任务队列功能
 */
@Module({
    imports: [
        // 注册 Bull 模块，使用 Redis 作为后端存储
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>("REDIS_HOST", "localhost"),
                    port: configService.get<number>("REDIS_PORT", 6379),
                    password: configService.get<string>("REDIS_PASSWORD", ""),
                    db: configService.get<number>("REDIS_DB", 0),
                },
                defaultJobOptions: {
                    attempts: 3, // 默认重试3次
                    removeOnComplete: true, // 完成后删除任务
                    removeOnFail: false, // 失败后不删除任务
                },
            }),
            inject: [ConfigService],
        }),
        // 注册队列
        BullModule.registerQueue(
            {
                name: "default", // 默认队列
            },
            {
                name: "email", // 邮件队列
            },
            {
                name: "vectorization", // 向量化队列
            },
        ),
        // 导入AI模块（用于AiModelService）
        AiConsoleModule,
        // 导入数据库实体
        TypeOrmModule.forFeature([User, Datasets, DatasetsDocument, DatasetsSegments]),
        // 导入 AiDatasetsModule 以便注入 DatasetStatusService
        forwardRef(() => AiDatasetsModule),
    ],
    controllers: [QueueController],
    providers: [
        QueueService,
        DefaultProcessor,
        EmailProcessor,
        VectorizationProcessor,
        VectorizationQueueService,
    ],
    exports: [QueueService],
})
export class QueueModule {}
