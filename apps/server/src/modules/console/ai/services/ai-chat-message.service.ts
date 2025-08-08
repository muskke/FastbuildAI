import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateMessageDto, UpdateMessageDto } from "../dto/ai-chat-record.dto";
import { AiChatMessage } from "../entities/ai-chat-message.entity";

/**
 * AI消息服务
 * 提供消息的完整CRUD操作，继承BaseService获得通用功能
 */
@Injectable()
export class AiChatMessageService extends BaseService<AiChatMessage> {
    constructor(
        @InjectRepository(AiChatMessage)
        private readonly messageRepository: Repository<AiChatMessage>,
    ) {
        super(messageRepository);
    }

    /**
     * 创建消息
     * @param dto 创建消息DTO
     */
    async createMessage(dto: CreateMessageDto): Promise<AiChatMessage> {
        try {
            // 获取下一个序号
            const lastMessage = await this.findOne({
                where: { conversationId: dto.conversationId },
                order: { sequence: "DESC" },
            });

            const sequence = (lastMessage?.sequence || 0) + 1;

            const messageData = {
                ...dto,
                sequence,
                status: "completed" as const,
            };

            // 使用 BaseService 的 create 方法
            const result = await this.create(messageData);
            return result as AiChatMessage;
        } catch (error) {
            this.logger.error(`创建消息失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to create message.");
        }
    }

    /**
     * 分页查询消息
     * @param paginationDto 分页参数
     * @param queryDto 查询条件
     */
    async findMessages(paginationDto: PaginationDto, queryDto?: { conversationId?: string }) {
        // 构建查询选项
        const options = {
            relations: ["conversation"],
            order: { sequence: "DESC" as const },
            ...(queryDto?.conversationId && {
                where: { conversationId: queryDto.conversationId },
            }),
        };

        // 使用 BaseService 的 paginate 方法
        return this.paginate(paginationDto, options);
    }

    /**
     * 获取对话的消息列表
     * @param conversationId 对话ID
     * @param paginationDto 分页参数
     */
    async getConversationMessages(conversationId: string, paginationDto: PaginationDto) {
        return await this.findMessages(paginationDto, { conversationId });
    }

    /**
     * 更新消息
     * @param messageId 消息ID
     * @param dto 更新数据
     */
    async updateMessage(messageId: string, dto: UpdateMessageDto): Promise<AiChatMessage> {
        try {
            const result = await this.updateById(messageId, dto);
            return result as AiChatMessage;
        } catch (error) {
            this.logger.error(`更新消息失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to update message.");
        }
    }

    /**
     * 删除消息
     * @param messageId 消息ID
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            await this.delete(messageId);
        } catch (error) {
            this.logger.error(`删除消息失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to delete message.");
        }
    }

    /**
     * 根据对话ID获取消息统计信息
     * @param conversationId 对话ID
     */
    async getMessageStats(conversationId: string): Promise<{
        messageCount: number;
        totalTokens: number;
    }> {
        // 使用BaseService的count方法获取消息数量
        const messageCount = await this.count({
            where: { conversationId },
        });

        // Token统计仍需要使用QueryBuilder，因为涉及JSON字段聚合
        const tokenStats = await this.repository
            .createQueryBuilder("message")
            .select("COALESCE(SUM((tokens->>'total')::int), 0)", "totalTokens")
            .where("message.conversationId = :conversationId", { conversationId })
            .getRawOne();

        return {
            messageCount,
            totalTokens: parseInt(tokenStats.totalTokens) || 0,
        };
    }
}
