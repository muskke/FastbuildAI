import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";

/**
 * 智能体聊天消息服务
 * 提供消息的完整CRUD操作，继承BaseService获得通用功能
 */
@Injectable()
export class AgentChatMessageService extends BaseService<AgentChatMessage> {
    constructor(
        @InjectRepository(AgentChatMessage)
        private readonly messageRepository: Repository<AgentChatMessage>,
        @InjectRepository(AgentChatRecord)
        private readonly chatRecordRepository: Repository<AgentChatRecord>,
    ) {
        super(messageRepository);
    }

    /**
     * 分页查询消息
     * @param paginationDto 分页参数
     * @param queryDto 查询条件
     */
    async findMessages(paginationDto: PaginationDto, queryDto?: { conversationId?: string }) {
        const options = {
            relations: ["conversation", "user", "agent"],
            order: { createdAt: "DESC" as const },
            ...(queryDto?.conversationId && { where: { conversationId: queryDto.conversationId } }),
        };

        return this.paginate(paginationDto, options);
    }

    /**
     * 获取对话的消息列表
     * @param conversationId 对话记录ID
     * @param paginationDto 分页参数
     * @param user 当前用户信息
     */
    async getConversationMessages(
        conversationId: string,
        paginationDto: PaginationDto,
        user: UserPlayground,
    ) {
        await this.validateConversationExists(conversationId);
        return await this.findMessages(paginationDto, { conversationId });
    }

    // ==================== 辅助方法 ====================

    /**
     * 验证对话记录是否存在
     * @param conversationId 对话记录ID
     */
    private async validateConversationExists(conversationId: string): Promise<void> {
        const record = await this.chatRecordRepository.findOne({
            where: { id: conversationId, isDeleted: false },
        });

        if (!record) {
            throw HttpExceptionFactory.notFound("对话记录不存在");
        }
    }
}
