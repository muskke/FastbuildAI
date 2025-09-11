import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { BatchDeleteChatRecordDto, QueryAgentChatRecordDto } from "../dto/agent";
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
        const whereConditions = this.buildUserWhereConditions(user, { id, isDeleted: false });
        const record = await this.chatRecordRepository.findOne({
            where: whereConditions,
            relations: ["agent"],
        });

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

        if (!recordIds?.length) {
            throw HttpExceptionFactory.badRequest("请选择要删除的对话记录");
        }

        const records = await this.findUserRecords(user, { id: In(recordIds), isDeleted: false });

        if (!records.length) {
            throw HttpExceptionFactory.badRequest("没有找到可删除的对话记录");
        }

        const result = await this.softDeleteRecords(
            records.map((r) => r.id),
            user,
        );
        this.logger.log(`[+] 批量删除对话记录成功: ${records.length} 条记录`);

        return { deletedCount: result.affected || 0 };
    }

    /**
     * 删除单个对话记录（软删除）
     * @param id 对话记录ID
     * @param user 当前用户信息
     * @returns 删除结果
     */
    async deleteChatRecord(id: string, user: UserPlayground): Promise<void> {
        const records = await this.findUserRecords(user, { id, isDeleted: false });

        if (!records.length) {
            throw HttpExceptionFactory.notFound("对话记录不存在或已被删除");
        }

        await this.softDeleteRecords([id], user);
        this.logger.log(`[+] 删除对话记录成功: ${id}`);
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
        const recordData = {
            agentId,
            userId: userId || null,
            anonymousIdentifier: anonymousIdentifier || null,
            title: title || "新对话",
            messageCount: 0,
            totalTokens: 0,
            isDeleted: false,
        };

        const result = await this.create(recordData);
        const userInfo = userId ? `用户:${userId}` : `匿名:${anonymousIdentifier}`;
        this.logger.log(`[+] 对话记录创建成功: ${result.id} - ${userInfo}`);

        return result as AgentChatRecord;
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
        await this.chatRecordRepository.update(id, {
            messageCount,
            totalTokens,
            updatedAt: new Date(),
        });
        this.logger.log(`[+] 对话记录统计更新成功: ${id}`);
    }

    /**
     * 更新对话记录的 metadata
     * @param id 对话记录ID
     * @param metadata 新的 metadata 对象
     */
    async updateMetadata(id: string, metadata: Record<string, any>): Promise<void> {
        await this.chatRecordRepository.update(id, {
            metadata,
            updatedAt: new Date(),
        });
        this.logger.log(`[+] 对话记录 metadata 更新成功: ${id}`);
    }

    /**
     * 增加本次会话的算力消耗
     * @param id 对话记录ID
     * @param amount 本次增加的算力（>=0）
     */
    async incrementConsumedPower(id: string, amount: number): Promise<void> {
        if (!amount || amount <= 0) return;
        await this.chatRecordRepository.increment({ id }, "consumedPower", amount);
        await this.chatRecordRepository.update(id, { updatedAt: new Date() });
        this.logger.log(`[+] 对话记录消耗算力增加: ${id} +${amount}`);
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

    // ==================== 辅助方法 ====================

    /**
     * 检查是否是匿名用户
     */
    private isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }

    /**
     * 构建用户相关的查询条件
     */
    private buildUserWhereConditions(user: UserPlayground, baseCondition: any = {}) {
        const whereConditions = [];
        const isAnonymous = this.isAnonymousUser(user);

        if (isAnonymous) {
            whereConditions.push({
                ...baseCondition,
                anonymousIdentifier: user.id,
            });
        } else {
            whereConditions.push({
                ...baseCondition,
                userId: user.id,
            });

            // 支持跨状态访问（登录用户访问之前的匿名记录）
            if ((user as any).anonymousIdentifier) {
                whereConditions.push({
                    ...baseCondition,
                    anonymousIdentifier: (user as any).anonymousIdentifier,
                });
            }
        }

        return whereConditions;
    }

    /**
     * 查找用户的对话记录
     */
    private async findUserRecords(user: UserPlayground, additionalConditions: any = {}) {
        const whereConditions = this.buildUserWhereConditions(user, additionalConditions);
        return await this.chatRecordRepository.find({ where: whereConditions });
    }

    /**
     * 软删除对话记录
     */
    private async softDeleteRecords(recordIds: string[], user: UserPlayground) {
        const isAnonymous = this.isAnonymousUser(user);
        const whereCondition = isAnonymous
            ? { id: In(recordIds), anonymousIdentifier: user.id }
            : { id: In(recordIds), userId: user.id };

        return await this.chatRecordRepository.update(whereCondition, { isDeleted: true });
    }
}
