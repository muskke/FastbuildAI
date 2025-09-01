import { AccountLogModule } from "@common/modules/account/account-log.module";
import { User } from "@common/modules/auth/entities/user.entity";
import { KeyManagerModule } from "@modules/console/key-manager/key-manager.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiConsoleModule } from "@/modules/console/ai/ai.module";

import { AiDatasetsModule } from "../ai-datasets/datasets.module";
import { AgentController } from "./controllers/agent.controller";
import { AgentAnnotationController } from "./controllers/agent-annotation.controller";
import { AgentChatMessageController } from "./controllers/agent-chat-message.controller";
import { AgentChatRecordController } from "./controllers/agent-chat-record.controller";
import { V1Controller } from "./controllers/v1.controller";
import { Agent } from "./entities/agent.entity";
import { AgentAnnotation } from "./entities/agent-annotation.entity";
import { AgentChatMessage } from "./entities/agent-chat-message.entity";
import { AgentChatRecord } from "./entities/agent-chat-record.entity";
import { AgentService } from "./services/agent.service";
import { AgentAnnotationService } from "./services/agent-annotation.service";
import { AgentChatService } from "./services/agent-chat.service";
import { AgentChatMessageService } from "./services/agent-chat-message.service";
import { AgentChatRecordService } from "./services/agent-chat-record.service";
import { AgentTemplateService } from "./services/agent-template.service";
import { PublicAgentChatService } from "./services/v1-agent-chat.service";

/**
 * 智能体模块
 * 提供智能体管理和对话记录功能
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Agent, AgentAnnotation, AgentChatRecord, AgentChatMessage, User]),
        AiConsoleModule, // 导入AI控制台模块，用于模型服务
        AiDatasetsModule, // 导入知识库模块，用于检索服务
        AccountLogModule,
        KeyManagerModule,
    ],
    controllers: [
        AgentController,
        AgentAnnotationController,
        AgentChatRecordController,
        AgentChatMessageController,
        V1Controller,
    ],
    providers: [
        AgentService,
        AgentAnnotationService,
        AgentChatRecordService,
        AgentChatService,
        AgentChatMessageService,
        PublicAgentChatService,
        AgentTemplateService,
    ],
    exports: [
        AgentService,
        AgentAnnotationService,
        AgentChatRecordService,
        AgentChatService,
        AgentChatMessageService,
        AgentTemplateService,
    ],
})
export class AiAgentModule {}
