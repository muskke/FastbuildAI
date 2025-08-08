import { Playground } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { PaginationDto } from "@common/dto/pagination.dto";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Get, Param, Query } from "@nestjs/common";

import { AgentChatMessageService } from "../services/agent-chat-message.service";

/**
 * 智能体对话消息控制器
 * 提供对话消息的查询功能
 */
@WebController("agent-chat-message")
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
