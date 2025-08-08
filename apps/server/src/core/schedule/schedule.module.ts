import { Module } from "@nestjs/common";
import { ScheduleModule as NestScheduleModule } from "@nestjs/schedule";

import { ScheduleController } from "./schedule.controller";
import { ScheduleService } from "./schedule.service";

/**
 * 定时任务模块
 *
 * 基于 NestJS 内置的 ScheduleModule 实现的简单定时任务模块
 */
@Module({
    imports: [
        // 导入 NestJS 内置的定时任务模块
        NestScheduleModule.forRoot(),
    ],
    controllers: [ScheduleController],
    providers: [ScheduleService],
    exports: [ScheduleService],
})
export class ScheduleModule {}
