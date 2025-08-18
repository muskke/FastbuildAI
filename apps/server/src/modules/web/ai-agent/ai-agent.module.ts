import { AiAgentModule as ConsoleAiAgentModule } from "@modules/console/ai-agent/agent.module";
import { Module } from "@nestjs/common";

import { AiAgentController } from "./controllers/ai-agent.controller";

/**
 * AI智能体模块（前台）
 *
 * 提供公开智能体查询功能
 */
@Module({
    imports: [ConsoleAiAgentModule],
    controllers: [AiAgentController],
    providers: [],
})
export class AiAgentModule {}
