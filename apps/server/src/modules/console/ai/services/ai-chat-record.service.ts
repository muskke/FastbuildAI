import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { buildWhere } from "@common/utils/helper.util";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
    ConversationStatus,
    CreateAIChatRecordDto,
    CreateMessageDto,
    QueryAIChatRecordDto,
    UpdateAIChatRecordDto,
    UpdateMessageDto,
} from "../dto/ai-chat-record.dto";
import { AiChatMessage } from "../entities/ai-chat-message.entity";
import { AiChatRecord } from "../entities/ai-chat-record.entity";
import { AiChatMessageService } from "./ai-chat-message.service";

/**
 * AI对话记录服务
 * 提供对话和消息的完整CRUD操作，继承BaseService获得通用CRUD功能
 */
@Injectable()
export class AiChatRecordService extends BaseService<AiChatRecord> {
    constructor(
        @InjectRepository(AiChatRecord)
        conversationRepository: Repository<AiChatRecord>,
        private readonly aiChatMessageService: AiChatMessageService,
    ) {
        super(conversationRepository);
    }

    /**
     * 创建新对话
     * @param userId 用户ID
     * @param dto 创建对话DTO
     */
    async createConversation(userId: string, dto: CreateAIChatRecordDto): Promise<AiChatRecord> {
        const conversationData = {
            ...dto,
            userId,
            messageCount: 0,
            totalTokens: 0,
            status: ConversationStatus.ACTIVE,
        };

        try {
            const result = await this.create(conversationData);
            return result as AiChatRecord;
        } catch (error) {
            this.logger.error(`创建对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to create conversation.");
        }
    }

    /**
     * 分页查询用户对话
     * @param userId 用户ID，空字符串表示查询所有用户
     * @param queryDto 查询条件
     * @param includeUserInfo 是否包含用户信息
     */
    async findUserConversations(
        userId: string,
        queryDto?: QueryAIChatRecordDto,
        includeUserInfo: boolean = false,
    ) {
        try {
            // 构建基础查询条件
            const where = buildWhere<AiChatRecord>({
                isDeleted: false,
                userId: userId && userId.trim() !== "" ? userId : undefined,
                status: queryDto?.status,
                isPinned: queryDto?.isPinned,
            });

            // 处理关键词搜索（需要使用数组形式实现OR查询）
            let whereConditions: any = where;
            if (queryDto?.keyword) {
                whereConditions = [
                    { ...where, title: this.ilike("title", queryDto.keyword) },
                    { ...where, summary: this.ilike("summary", queryDto.keyword) },
                ];
            }

            // 设置关联和排除字段
            const relations = includeUserInfo ? ["user"] : [];
            const excludeFields = includeUserInfo ? ["user.password", "user.openid"] : [];

            // 构建查询选项
            const queryOptions = {
                where: whereConditions,
                relations,
                order: {
                    isPinned: "DESC" as const,
                    updatedAt: "DESC" as const,
                },
                excludeFields,
            };

            return await this.paginate(queryDto, queryOptions);
        } catch (error) {
            this.logger.error(`查询用户对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to query user conversations.");
        }
    }

    /**
     * 根据ID获取对话详情
     * @param conversationId 对话ID
     * @param userId 用户ID
     * @param includeUserInfo 是否包含用户信息
     */
    async getConversationWithMessages(
        conversationId: string,
        userId?: string,
    ): Promise<Partial<AiChatRecord> | null> {
        try {
            const where = buildWhere<AiChatRecord>({
                isDeleted: false,
                userId,
            });
            const result = await this.findOneById(conversationId, {
                where,
                relations: ["user"],
                excludeFields: ["user.password", "user.openid"],
            });
            return result;
        } catch (error) {
            this.logger.error(`获取对话详情失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to get conversation detail.");
        }
    }

    /**
     * 更新对话信息
     * @param conversationId 对话ID
     * @param userId 用户ID，空字符串表示管理员操作
     * @param dto 更新数据
     */
    async updateConversation(
        conversationId: string,
        userId: string,
        dto: UpdateAIChatRecordDto,
    ): Promise<AiChatRecord> {
        try {
            // 构建 where 条件
            const whereCondition: any = { id: conversationId, isDeleted: false };

            // 如果不是管理员操作，需要验证用户权限
            if (userId && userId.trim() !== "") {
                whereCondition.userId = userId;
            }

            const result = await this.updateById(conversationId, dto, {
                where: whereCondition,
            });
            return result as AiChatRecord;
        } catch (error) {
            this.logger.error(`更新对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to update conversation.");
        }
    }

    /**
     * 软删除对话
     * @param conversationId 对话ID
     * @param userId 用户ID
     */
    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        try {
            const queryBuilder = this.repository
                .createQueryBuilder()
                .update(AiChatRecord)
                .set({ isDeleted: true })
                .where("id = :conversationId", { conversationId })
                .andWhere("isDeleted = :isDeleted", { isDeleted: false });

            // 如果不是管理员操作，需要验证用户权限
            if (userId && userId.trim() !== "") {
                queryBuilder.andWhere("userId = :userId", { userId });
            }

            await queryBuilder.execute();
        } catch (error) {
            this.logger.error(`删除对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to delete conversation.");
        }
    }

    /**
     * 批量删除对话
     * @param ids 对话ID数组
     * @param userId 用户ID
     */
    async batchDeleteConversations(ids: string[], userId: string = ""): Promise<void> {
        try {
            const queryBuilder = this.repository
                .createQueryBuilder()
                .update(AiChatRecord)
                .set({ isDeleted: true })
                .where("id IN (:...ids)", { ids })
                .andWhere("isDeleted = :isDeleted", { isDeleted: false });

            // 如果不是管理员操作，需要验证用户权限
            if (userId && userId.trim() !== "") {
                queryBuilder.andWhere("userId = :userId", { userId });
            }

            await queryBuilder.execute();
        } catch (error) {
            this.logger.error(`批量删除对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to batch delete conversations.");
        }
    }

    /**
     * 置顶/取消置顶对话
     * @param conversationId 对话ID
     * @param userId 用户ID，空字符串表示管理员操作
     * @param isPinned 是否置顶
     */
    async pinConversation(
        conversationId: string,
        userId: string,
        isPinned: boolean,
    ): Promise<void> {
        try {
            // 构建 where 条件
            const whereCondition: any = { id: conversationId, isDeleted: false };

            // 如果不是管理员操作，需要验证用户权限
            if (userId && userId.trim() !== "") {
                whereCondition.userId = userId;
            }

            await this.updateById(
                conversationId,
                { isPinned },
                {
                    where: whereCondition,
                },
            );
        } catch (error) {
            this.logger.error(`置顶对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to pin conversation.");
        }
    }

    // =================== 消息相关方法 ===================

    /**
     * 创建消息
     * @param dto 创建消息DTO
     */
    async createMessage(dto: CreateMessageDto): Promise<AiChatMessage> {
        try {
            const savedMessage = await this.aiChatMessageService.createMessage(dto);

            // 更新对话统计信息
            await this.updateConversationStats(dto.conversationId);

            return savedMessage;
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
        return await this.aiChatMessageService.findMessages(paginationDto, queryDto);
    }

    /**
     * 获取对话的消息列表
     * @param conversationId 对话ID
     * @param paginationDto 分页参数
     */
    async getConversationMessages(conversationId: string, paginationDto: PaginationDto) {
        return await this.aiChatMessageService.getConversationMessages(
            conversationId,
            paginationDto,
        );
    }

    /**
     * 更新消息
     * @param messageId 消息ID
     * @param dto 更新数据
     */
    async updateMessage(messageId: string, dto: UpdateMessageDto): Promise<AiChatMessage> {
        try {
            const updatedMessage = await this.aiChatMessageService.updateMessage(messageId, dto);

            await this.updateConversationStats(updatedMessage.conversationId);

            return updatedMessage;
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
            // 先获取消息信息
            const message = await this.aiChatMessageService.findOneById(messageId);
            if (!message) {
                throw HttpExceptionFactory.notFound("Message not found.");
            }

            await this.aiChatMessageService.deleteMessage(messageId);

            // 更新对话统计信息
            await this.updateConversationStats(message.conversationId);
        } catch (error) {
            this.logger.error(`删除消息失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to delete message.");
        }
    }

    // =================== 私有辅助方法 ===================

    /**
     * 更新对话统计信息
     */
    private async updateConversationStats(conversationId: string): Promise<void> {
        try {
            const stats = await this.aiChatMessageService.getMessageStats(conversationId);

            await this.updateById(conversationId, {
                messageCount: stats.messageCount,
                totalTokens: stats.totalTokens,
            });
        } catch (error) {
            this.logger.error(`更新对话统计信息失败: ${error.message}`, error.stack);
            // 统计信息更新失败不应该影响主流程，仅记录日志
        }
    }
}
