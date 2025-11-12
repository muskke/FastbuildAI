import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { Agent } from "@buildingai/db/entities/ai-agent.entity";
import { AgentChatMessage } from "@buildingai/db/entities/ai-agent-chat-message.entity";
import { AgentChatRecord } from "@buildingai/db/entities/ai-agent-chat-record.entity";
import { AiChatMessage } from "@buildingai/db/entities/ai-chat-message.entity";
import { AiChatRecord } from "@buildingai/db/entities/ai-chat-record.entity";
import { AiModel } from "@buildingai/db/entities/ai-model.entity";
import { AiProvider } from "@buildingai/db/entities/ai-provider.entity";
import { Analyse } from "@buildingai/db/entities/analyse.entity";
import { Extension } from "@buildingai/db/entities/extension.entity";
import { RechargeOrder } from "@buildingai/db/entities/recharge-order.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { Module } from "@nestjs/common";

import { AnalyseConsoleController } from "./controller/console/analyse.controller";
import { AnalyseWebController } from "./controller/web/analyse.controller";
import { AnalyseService } from "./services/analyse.service";
import { DashboardService } from "./services/dashboard.service";

/**
 * 数据分析模块
 *
 * 提供后台工作台数据看板相关的功能
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Agent,
            AgentChatRecord,
            AgentChatMessage,
            AiChatRecord,
            AiChatMessage,
            RechargeOrder,
            AccountLog,
            Extension,
            AiModel,
            AiProvider,
            Analyse,
        ]),
    ],
    controllers: [AnalyseConsoleController, AnalyseWebController],
    providers: [DashboardService, AnalyseService],
    exports: [DashboardService, AnalyseService],
})
export class AnalyseModule {}
