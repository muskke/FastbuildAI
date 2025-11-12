import { SecretService } from "@buildingai/core/modules/secret/services/secret.service";
import { SecretTemplateService } from "@buildingai/core/modules/secret/services/secret-template.service";
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { AiChatMessage } from "@buildingai/db/entities/ai-chat-message.entity";
import { AiChatRecord } from "@buildingai/db/entities/ai-chat-record.entity";
import { AiMcpServer } from "@buildingai/db/entities/ai-mcp-server.entity";
import { AiMcpTool } from "@buildingai/db/entities/ai-mcp-tool.entity";
import { AiModel } from "@buildingai/db/entities/ai-model.entity";
import { AiProvider } from "@buildingai/db/entities/ai-provider.entity";
import { AiUserMcpServer } from "@buildingai/db/entities/ai-user-mcp-server.entity";
import { Dict } from "@buildingai/db/entities/dict.entity";
import { Secret } from "@buildingai/db/entities/secret.entity";
import { SecretTemplate } from "@buildingai/db/entities/secret-template.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { Module } from "@nestjs/common";

import { AiMcpServerService } from "../mcp/services/ai-mcp-server.service";
import { AiMcpToolService } from "../mcp/services/ai-mcp-tool.service";
import { AiModelService } from "../model/services/ai-model.service";
import { AiProviderService } from "../provider/services/ai-provider.service";
import { AiChatRecordConsoleController } from "./controllers/console/ai-chat-record.controller";
import { AiChatMessageWebController } from "./controllers/web/ai-chat-message.controller";
import { AiChatRecordWebController } from "./controllers/web/ai-chat-record.controller";
import {
    ChatCompletionCommandHandler,
    ConversationCommandHandler,
    McpServerCommandHandler,
    MessageContextCommandHandler,
    ModelValidationCommandHandler,
    PowerDeductionCommandHandler,
    TitleGenerationCommandHandler,
    ToolCallCommandHandler,
    UserPowerValidationCommandHandler,
} from "./handlers";
import { AiChatsMessageService } from "./services/ai-chat-message.service";
import { AiChatRecordService } from "./services/ai-chat-record.service";
import { ChatConfigService } from "./services/chat-config.service";

/**
 * AI对话记录后台管理模块
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            AiModel,
            AiProvider,
            AiUserMcpServer,
            AiMcpServer,
            AiMcpTool,
            AiChatRecord,
            AiChatMessage,
            Dict,
            AccountLog,
            Secret,
            SecretTemplate,
            User,
        ]),
    ],
    controllers: [
        AiChatRecordConsoleController,
        AiChatRecordWebController,
        AiChatMessageWebController,
    ],
    providers: [
        ChatConfigService,
        AiModelService,
        AiProviderService,
        SecretService,
        SecretTemplateService,
        AiMcpServerService,
        AiMcpToolService,
        AiUserMcpServer,
        AiChatRecordService,
        AiChatsMessageService,
        // Command Handlers
        ConversationCommandHandler,
        ModelValidationCommandHandler,
        UserPowerValidationCommandHandler,
        McpServerCommandHandler,
        MessageContextCommandHandler,
        ToolCallCommandHandler,
        PowerDeductionCommandHandler,
        TitleGenerationCommandHandler,
        ChatCompletionCommandHandler,
    ],
    exports: [ChatConfigService, AiChatRecordService, AiChatsMessageService],
})
export class AiChatModule {}
