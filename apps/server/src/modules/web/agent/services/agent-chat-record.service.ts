import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { BatchDeleteChatRecordDto, QueryAgentChatRecordDto } from "../dto/agent.dto";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import { AgentChatMessageService } from "./agent-chat-message.service";

/**
 * 智能体对话记录服务类
 * 负责对话记录的查询、删除等功能
 */
@Injectable()
export class AgentChatRecordService extends BaseService<AgentChatRecord> {
    protected readonly logger = new Logger(AgentChatRecordService.name);

    constructor(
        @InjectRepository(AgentChatRecord)
        private readonly chatRecordRepository: Repository<AgentChatRecord>,
        private readonly agentChatMessageService: AgentChatMessageService,
    ) {
        super(chatRecordRepository);
    }

    /**
     * 获取智能体对话记录列表
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 对话记录列表和分页信息
     */
    async getChatRecordList(dto: QueryAgentChatRecordDto, user: UserPlayground) {
        const queryBuilder = this.chatRecordRepository.createQueryBuilder("record");

        // 添加用户信息关联，只选择需要的字段
        queryBuilder.leftJoin("record.user", "user");
        queryBuilder.addSelect([
            "user.username",
            "user.nickname",
            "user.phone",
            "user.avatar",
            "user.email",
        ]);

        // 查询该智能体的所有对话记录：包括注册用户的记录和游客的记录
        queryBuilder.where("record.agentId = :agentId", { agentId: dto.agentId });
        queryBuilder.andWhere(
            "(record.userId = :userId OR (record.userId IS NULL AND record.anonymousIdentifier IS NOT NULL))",
            { userId: user.id },
        );
        queryBuilder.andWhere("record.isDeleted = :isDeleted", { isDeleted: false });

        if (dto.keyword) {
            queryBuilder.andWhere(
                "(record.title ILIKE :keyword OR record.summary ILIKE :keyword)",
                { keyword: `%${dto.keyword}%` },
            );
        }

        // 按更新时间降序排列
        queryBuilder.orderBy("record.updatedAt", "DESC");

        return this.paginateQueryBuilder(queryBuilder, dto);
    }

    /**
     * 获取对话记录详情
     * @param id 对话记录ID
     * @param user 当前用户信息
     * @returns 对话记录详情
     */
    async getChatRecordDetail(id: string, user: UserPlayground): Promise<AgentChatRecord> {
        // 检查是否是匿名用户（通过用户ID格式判断）
        const isAnonymousUser =
            user.id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/) !==
            null;

        const where = isAnonymousUser
            ? {
                  id,
                  anonymousIdentifier: user.id,
                  isDeleted: false,
              }
            : {
                  id,
                  userId: user.id,
                  isDeleted: false,
              };

        let record = await this.chatRecordRepository.findOne({
            where,
            relations: ["agent"],
        });

        // 如果没找到且是匿名用户，尝试用旧的userId字段查找
        if (!record && isAnonymousUser) {
            record = await this.chatRecordRepository.findOne({
                where: {
                    id,
                    userId: user.id,
                    isDeleted: false,
                },
                relations: ["agent"],
            });
        }

        if (!record) {
            throw HttpExceptionFactory.notFound("对话记录不存在");
        }

        return record;
    }

    /**
     * 批量删除对话记录（软删除）
     * @param dto 批量删除DTO
     * @param user 当前用户信息
     * @returns 删除的记录数量
     */
    async batchDeleteChatRecords(
        dto: BatchDeleteChatRecordDto,
        user: UserPlayground,
    ): Promise<{ deletedCount: number }> {
        const { recordIds } = dto;

        if (!recordIds || recordIds.length === 0) {
            throw HttpExceptionFactory.badRequest("请选择要删除的对话记录");
        }

        try {
            // 查询用户的对话记录
            const records = await this.chatRecordRepository.find({
                where: {
                    id: In(recordIds),
                    userId: user.id,
                    isDeleted: false,
                },
            });

            if (records.length === 0) {
                throw HttpExceptionFactory.badRequest("没有找到可删除的对话记录");
            }

            // 软删除：更新 isDeleted 字段
            const result = await this.chatRecordRepository.update(
                {
                    id: In(records.map((r) => r.id)),
                    userId: user.id,
                },
                {
                    isDeleted: true,
                },
            );

            this.logger.log(`[+] 批量删除对话记录成功: ${records.length} 条记录`);

            return {
                deletedCount: result.affected || 0,
            };
        } catch (err) {
            this.logger.error(`[!] 批量删除对话记录失败: ${err.message}`, err.stack);
            throw HttpExceptionFactory.business("批量删除对话记录失败");
        }
    }

    /**
     * 删除单个对话记录（软删除）
     * @param id 对话记录ID
     * @param user 当前用户信息
     * @returns 删除结果
     */
    async deleteChatRecord(id: string, user: UserPlayground): Promise<void> {
        try {
            // 查询用户的对话记录
            const record = await this.chatRecordRepository.findOne({
                where: {
                    id,
                    userId: user.id,
                    isDeleted: false,
                },
            });

            if (!record) {
                throw HttpExceptionFactory.notFound("对话记录不存在或已被删除");
            }

            // 软删除：更新 isDeleted 字段
            await this.chatRecordRepository.update(
                {
                    id,
                    userId: user.id,
                },
                {
                    isDeleted: true,
                },
            );

            this.logger.log(`[+] 删除对话记录成功: ${id}`);
        } catch (err) {
            this.logger.error(`[!] 删除对话记录失败: ${err.message}`, err.stack);
            if (err instanceof Error && err.message.includes("不存在")) {
                throw err;
            }
            throw HttpExceptionFactory.business("删除对话记录失败");
        }
    }

    /**
     * 创建对话记录
     * @param agentId 智能体ID
     * @param userId 用户ID (注册用户时使用)
     * @param title 对话标题
     * @param anonymousIdentifier 匿名用户标识 (匿名用户时使用)
     * @returns 创建的对话记录
     */
    async createChatRecord(
        agentId: string,
        userId?: string,
        title?: string,
        anonymousIdentifier?: string,
    ): Promise<AgentChatRecord> {
        try {
            const result = await this.create({
                agentId,
                userId: userId || null,
                anonymousIdentifier: anonymousIdentifier || null,
                title: title || "新对话",
                messageCount: 0,
                totalTokens: 0,
                isDeleted: false,
            });

            this.logger.log(
                `[+] 对话记录创建成功: ${result.id} - ${userId ? `用户:${userId}` : `匿名:${anonymousIdentifier}`}`,
            );
            return result as AgentChatRecord;
        } catch (err) {
            this.logger.error(`[!] 对话记录创建失败: ${err.message}`, err.stack);
            throw HttpExceptionFactory.business("对话记录创建失败");
        }
    }

    /**
     * 更新对话记录统计信息
     * @param id 对话记录ID
     * @param messageCount 消息数量
     * @param totalTokens 总Token数
     */
    async updateChatRecordStats(
        id: string,
        messageCount: number,
        totalTokens: number,
    ): Promise<void> {
        try {
            await this.chatRecordRepository.update(id, {
                messageCount,
                totalTokens,
                updatedAt: new Date(),
            });

            this.logger.log(`[+] 对话记录统计更新成功: ${id}`);
        } catch (err) {
            this.logger.error(`[!] 对话记录统计更新失败: ${err.message}`, err.stack);
        }
    }

    /**
     * 获取对话记录的消息列表
     * @param conversationId 对话记录ID
     * @param paginationDto 分页参数
     * @param user 当前用户信息
     * @returns 消息列表和分页信息
     */
    async getChatMessages(
        conversationId: string,
        paginationDto: PaginationDto,
        user: UserPlayground,
    ) {
        return await this.agentChatMessageService.getConversationMessages(
            conversationId,
            paginationDto,
            user,
        );
    }
}
