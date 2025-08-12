import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { PaginationDto } from "@common/dto/pagination.dto";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Get, Param, Query } from "@nestjs/common";

import { AgentChatMessageService } from "../services/agent-chat-message.service";

/**
 * 智能体对话消息控制器
 * 提供对话消息的查询功能
 */
@ConsoleController("ai-agent-chat-message", "智能体对话消息")
export class AgentChatMessageController {
    constructor(private readonly agentChatMessageService: AgentChatMessageService) {}

    /**
     * 获取对话记录的消息列表
     *
     * @param conversationId 对话记录ID
     * @param paginationDto 分页参数
     * @param user 当前用户信息
     * @returns 消息列表和分页信息
     */
    @Get("conversation/:conversationId")
    @Permissions({
        code: "get-messages",
        name: "查看对话消息",
    })
    async getConversationMessages(
        @Param("conversationId") conversationId: string,
        @Query() paginationDto: PaginationDto,
        @Playground() user: UserPlayground,
    ) {
        return this.agentChatMessageService.getConversationMessages(
            conversationId,
            paginationDto,
            user,
        );
    }
}
