import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiChatRecordController } from "./controllers/ai-chat-record.controller";
import { AiMcpServerController } from "./controllers/ai-mcp-server.controller";
import { AiModelController } from "./controllers/ai-model.controller";
import { AiProviderController } from "./controllers/ai-provider.controller";
import { AiChatMessage } from "./entities/ai-chat-message.entity";
import { AiChatRecord } from "./entities/ai-chat-record.entity";
import { AiMcpServer } from "./entities/ai-mcp-server.entity";
import { AiMcpTool } from "./entities/ai-mcp-tool.entity";
import { AiModel } from "./entities/ai-model.entity";
import { AiProvider } from "./entities/ai-provider.entity";
import { AiUserMcpServer } from "./entities/ai-user-mcp-server.entity";
import { AiChatMessageService } from "./services/ai-chat-message.service";
import { AiChatRecordService } from "./services/ai-chat-record.service";
import { AiMcpServerService } from "./services/ai-mcp-server.service";
import { AiMcpToolService } from "./services/ai-mcp-tool.service";
import { AiModelService } from "./services/ai-model.service";
import { AiProviderService } from "./services/ai-provider.service";
import { ChatConfigService } from "./services/chat-config.service";

/**
 * AI对话记录后台管理模块
 */
@Module({
    imports: [
        DictModule,
        TypeOrmModule.forFeature([
            Dict,
            AiProvider,
            AiModel,
            AiChatRecord,
            AiChatMessage,
            AiMcpServer,
            AiMcpTool,
            AiUserMcpServer,
        ]),
    ],
    controllers: [
        AiChatRecordController,
        AiModelController,
        AiProviderController,
        AiMcpServerController,
    ],
    providers: [
        ChatConfigService,
        AiProviderService,
        AiModelService,
        AiChatRecordService,
        AiChatMessageService,
        AiMcpServerService,
        AiMcpToolService,
        AiProviderService,
    ],
    exports: [
        ChatConfigService,
        AiProviderService,
        AiModelService,
        AiChatRecordService,
        AiChatMessageService,
        AiMcpServerService,
        AiMcpToolService,
        AiProviderService,
    ],
})
export class AiConsoleModule {}
