import { AccountLogModule } from "@common/modules/account/account-log.module";
import { User } from "@common/modules/auth/entities/user.entity";
import { KeyManagerModule } from "@modules/console/key-manager/key-manager.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiConsoleModule } from "@/modules/console/ai/ai.module";

import { AiDatasetsModule } from "../../ai-datasets/datasets.module";
import { Agent } from "../entities/agent.entity";
import { AgentAnnotation } from "../entities/agent-annotation.entity";
import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
// 接口实现绑定
import {
    IAnnotationHandler,
    IBillingHandler,
    IChatContextBuilder,
    IKnowledgeRetrievalHandler,
    IMessageHandler,
    IQuickCommandHandler,
    IResponseHandler,
    IThirdPartyIntegrationHandler,
} from "../interfaces/chat-handlers.interface";
// 导入服务依赖
import { AgentService } from "../services/agent.service";
import { AgentAnnotationService } from "../services/agent-annotation.service";
import { AgentChatMessageService } from "../services/agent-chat-message.service";
import { AgentChatRecordService } from "../services/agent-chat-record.service";
import { AnnotationHandler } from "./annotation.handler";
import { BillingHandler } from "./billing.handler";
import { ChatContextBuilder } from "./chat-context.builder";
import { KnowledgeRetrievalHandler } from "./knowledge-retrieval.handler";
// 导入所有处理器
import { MessageHandler } from "./message.handler";
import { QuickCommandHandler } from "./quick-command.handler";
import { ResponseHandler } from "./response.handler";
import { ThirdPartyIntegrationHandler } from "./third-party-integration.handler";

/**
 * 智能体聊天处理器模块
 * 提供所有聊天相关的处理器服务
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Agent, AgentAnnotation, AgentChatMessage, AgentChatRecord, User]),
        AccountLogModule,
        KeyManagerModule,
        AiConsoleModule,
        AiDatasetsModule,
    ],
    providers: [
        // 核心处理器
        MessageHandler,
        QuickCommandHandler,
        AnnotationHandler,
        KnowledgeRetrievalHandler,
        ThirdPartyIntegrationHandler,
        ChatContextBuilder,
        BillingHandler,
        ResponseHandler,

        // 接口绑定
        {
            provide: "IMessageHandler",
            useExisting: MessageHandler,
        },
        {
            provide: "IQuickCommandHandler",
            useExisting: QuickCommandHandler,
        },
        {
            provide: "IAnnotationHandler",
            useExisting: AnnotationHandler,
        },
        {
            provide: "IKnowledgeRetrievalHandler",
            useExisting: KnowledgeRetrievalHandler,
        },
        {
            provide: "IThirdPartyIntegrationHandler",
            useExisting: ThirdPartyIntegrationHandler,
        },
        {
            provide: "IChatContextBuilder",
            useExisting: ChatContextBuilder,
        },
        {
            provide: "IBillingHandler",
            useExisting: BillingHandler,
        },
        {
            provide: "IResponseHandler",
            useExisting: ResponseHandler,
        },

        // 依赖服务
        AgentService,
        AgentAnnotationService,
        AgentChatMessageService,
        AgentChatRecordService,
    ],
    exports: [
        // 导出所有处理器
        MessageHandler,
        QuickCommandHandler,
        AnnotationHandler,
        KnowledgeRetrievalHandler,
        ThirdPartyIntegrationHandler,
        ChatContextBuilder,
        BillingHandler,
        ResponseHandler,

        // 导出接口绑定
        "IMessageHandler",
        "IQuickCommandHandler",
        "IAnnotationHandler",
        "IKnowledgeRetrievalHandler",
        "IThirdPartyIntegrationHandler",
        "IChatContextBuilder",
        "IBillingHandler",
        "IResponseHandler",
    ],
})
export class ChatHandlersModule {}
