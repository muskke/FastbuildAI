import { BaseService } from "@common/base/services/base.service";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import { Repository } from "typeorm";

import { AgentChatDto, PublicAgentChatDto } from "../dto/agent.dto";
import { Agent } from "../entities/agent.entity";
import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import { AgentService } from "./agent.service";
import { AgentChatService } from "./agent-chat.service";

/**
 * 公开访问智能体聊天服务
 * 处理无需认证的智能体对话功能
 */
@Injectable()
export class PublicAgentChatService {
    private readonly logger = new Logger(PublicAgentChatService.name);
    private readonly chatRecordService: BaseService<AgentChatRecord>;
    private readonly chatMessageService: BaseService<AgentChatMessage>;

    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        @InjectRepository(AgentChatRecord)
        private readonly chatRecordRepository: Repository<AgentChatRecord>,
        @InjectRepository(AgentChatMessage)
        private readonly chatMessageRepository: Repository<AgentChatMessage>,
        private readonly agentService: AgentService,
        private readonly agentChatService: AgentChatService,
    ) {
        this.chatRecordService = new BaseService<AgentChatRecord>(chatRecordRepository);
        this.chatMessageService = new BaseService<AgentChatMessage>(chatMessageRepository);
    }

    /**
     * 生成访问令牌
     */
    async generateAccessToken(publishToken: string) {
        const agent = await this.getAgentByPublishToken(publishToken);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require("crypto");
        const accessToken = crypto.randomBytes(32).toString("hex");

        this.logger.log(`[+] 生成访问令牌: ${agent.id} - ${accessToken.substring(0, 8)}...`);

        return {
            accessToken,
            agentId: agent.id,
            agentName: agent.name,
            description: "访问令牌永不过期，请妥善保管",
        };
    }

    /**
     * API认证方式对话
     */
    async chatWithApiKey(apiKey: string, dto: PublicAgentChatDto) {
        if (!apiKey) {
            throw HttpExceptionFactory.unauthorized("API密钥不能为空");
        }

        const agent = await this.agentService.getAgentByApiKey(apiKey);
        return this.performChat(agent, dto);
    }

    /**
     * API认证方式流式对话
     */
    async chatStreamWithApiKey(apiKey: string, dto: PublicAgentChatDto, res: Response) {
        if (!apiKey) {
            throw HttpExceptionFactory.unauthorized("API密钥不能为空");
        }

        const agent = await this.agentService.getAgentByApiKey(apiKey);
        return this.performChatStream(agent, dto, res);
    }

    /**
     * 获取公开智能体对话记录列表
     */
    async getConversationsByAccessToken(
        publishToken: string,
        accessToken: string,
        query: { page?: number; pageSize?: number },
    ) {
        const agent = await this.getAgentByPublishToken(publishToken);
        const anonymousIdentifier = this.generateUserIdFromAccessToken(accessToken);

        const paginationDto: PaginationDto = {
            page: query.page || 1,
            pageSize: query.pageSize || 10,
        };

        // 先尝试用anonymousIdentifier查询对话记录
        let options = {
            where: {
                agentId: agent.id,
                anonymousIdentifier: anonymousIdentifier,
                isDeleted: false,
            },
            order: {
                updatedAt: "DESC" as const,
                createdAt: "DESC" as const,
            },
        };

        let result = await this.chatRecordService.paginate(paginationDto, options);
        return result;
    }

    /**
     * 获取公开智能体对话消息
     */
    async getMessagesByAccessToken(
        publishToken: string,
        accessToken: string,
        conversationId: string,
        query: { page?: number; pageSize?: number },
    ) {
        const agent = await this.getAgentByPublishToken(publishToken);
        const anonymousIdentifier = this.generateUserIdFromAccessToken(accessToken);

        // 验证对话记录所有权
        let chatRecord = await this.chatRecordRepository.findOne({
            where: {
                id: conversationId,
                agentId: agent.id,
                anonymousIdentifier: anonymousIdentifier,
                isDeleted: false,
            },
        });

        if (!chatRecord) {
            chatRecord = await this.chatRecordRepository.findOne({
                where: {
                    id: conversationId,
                    agentId: agent.id,
                    userId: anonymousIdentifier,
                    isDeleted: false,
                },
            });
        }

        if (!chatRecord) {
            throw HttpExceptionFactory.notFound("对话记录不存在或无权访问");
        }

        const paginationDto: PaginationDto = {
            page: query.page || 1,
            pageSize: query.pageSize || 10,
        };

        // 先尝试用anonymousIdentifier查询消息
        let options = {
            where: {
                conversationId: conversationId,
                agentId: agent.id,
                anonymousIdentifier: anonymousIdentifier,
            },
            order: {
                createdAt: "ASC" as const,
            },
        };

        let result = await this.chatMessageService.paginate(paginationDto, options);

        return result;
    }

    /**
     * 删除公开智能体对话记录
     */
    async deleteConversationByAccessToken(
        publishToken: string,
        accessToken: string,
        conversationId: string,
    ) {
        const agent = await this.getAgentByPublishToken(publishToken);
        const anonymousIdentifier = this.generateUserIdFromAccessToken(accessToken);

        // 验证对话记录所有权
        let chatRecord = await this.chatRecordRepository.findOne({
            where: {
                id: conversationId,
                agentId: agent.id,
                anonymousIdentifier: anonymousIdentifier,
                isDeleted: false,
            },
        });

        if (!chatRecord) {
            chatRecord = await this.chatRecordRepository.findOne({
                where: {
                    id: conversationId,
                    agentId: agent.id,
                    userId: anonymousIdentifier,
                    isDeleted: false,
                },
            });
        }

        if (!chatRecord) {
            throw HttpExceptionFactory.notFound("对话记录不存在或无权访问");
        }

        // 软删除对话记录
        await this.chatRecordRepository.update(conversationId, { isDeleted: true });

        // 删除对话消息
        await this.chatMessageRepository.delete({ conversationId: conversationId });

        this.logger.log(
            `[+] 删除访问令牌对话记录: ${agent.id} - ${accessToken.substring(0, 8)}... - ${conversationId}`,
        );

        return { message: "对话记录删除成功" };
    }

    /**
     * 更新公开智能体对话记录
     */
    async updateConversationByAccessToken(
        publishToken: string,
        accessToken: string,
        conversationId: string,
        updateData: { title?: string },
    ) {
        const agent = await this.getAgentByPublishToken(publishToken);
        const anonymousIdentifier = this.generateUserIdFromAccessToken(accessToken);

        // 验证对话记录所有权
        let chatRecord = await this.chatRecordRepository.findOne({
            where: {
                id: conversationId,
                agentId: agent.id,
                anonymousIdentifier: anonymousIdentifier,
                isDeleted: false,
            },
        });

        if (!chatRecord) {
            chatRecord = await this.chatRecordRepository.findOne({
                where: {
                    id: conversationId,
                    agentId: agent.id,
                    userId: anonymousIdentifier,
                    isDeleted: false,
                },
            });
        }

        if (!chatRecord) {
            throw HttpExceptionFactory.notFound("对话记录不存在或无权访问");
        }

        // 更新对话记录
        const updateFields: any = {};
        if (updateData.title !== undefined) {
            updateFields.title = updateData.title;
        }

        await this.chatRecordRepository.update(conversationId, updateFields);

        this.logger.log(
            `[+] 更新访问令牌对话记录: ${agent.id} - ${accessToken.substring(0, 8)}... - ${conversationId} - 标题: ${updateData.title}`,
        );

        return { message: "对话记录更新成功" };
    }

    /**
     * 公开智能体流式对话
     */
    async chatStreamByAccessToken(
        publishToken: string,
        accessToken: string,
        dto: PublicAgentChatDto,
        res: Response,
    ) {
        const agent = await this.getAgentByPublishToken(publishToken);
        await this.checkRateLimit(agent);

        const agentChatDto = this.convertToAgentChatDto(dto, agent);
        const anonymousUser = this.createAnonymousUserWithAccessToken(accessToken);

        try {
            return await this.agentChatService.chatStream(
                agent.id,
                agentChatDto,
                anonymousUser,
                res,
            );
        } catch (error) {
            this.logger.error(`[!] 公开智能体流式对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.business("流式对话处理失败");
        }
    }

    /**
     * 从访问令牌生成用户ID
     */
    private generateUserIdFromAccessToken(accessToken: string): string {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256").update(accessToken).digest("hex");

        // 从哈希中提取UUID格式的字符串
        const uuid = [
            hash.substring(0, 8),
            hash.substring(8, 12),
            "4" + hash.substring(13, 16),
            "8" + hash.substring(17, 20),
            hash.substring(20, 32),
        ].join("-");

        return uuid;
    }

    /**
     * 创建基于访问令牌的匿名用户上下文
     */
    private createAnonymousUserWithAccessToken(accessToken: string): UserPlayground {
        const anonymousIdentifier = this.generateUserIdFromAccessToken(accessToken);

        return {
            id: anonymousIdentifier,
            username: `access_${accessToken.substring(0, 8)}`,
            isRoot: 0,
            role: {} as any,
            permissions: [],
        };
    }

    /**
     * 转换公开DTO为内部DTO
     */
    private convertToAgentChatDto(dto: PublicAgentChatDto, agent: Agent): AgentChatDto {
        return {
            messages: dto.messages,
            conversationId: dto.conversationId,
            title: dto.title,
            formVariables: dto.formVariables,
            formFieldsInputs: dto.formFieldsInputs,
            saveConversation: dto.saveConversation !== false,
            includeReferences: dto.includeReferences,
            modelConfig: agent.modelConfig,
            datasetIds: agent.datasetIds,
            rolePrompt: agent.rolePrompt,
            showContext: agent.showContext,
            showReference: agent.showReference,
            enableFeedback: agent.enableFeedback,
            enableWebSearch: agent.enableWebSearch,
            quickCommands: agent.quickCommands,
            autoQuestions: agent.autoQuestions,
        };
    }

    /**
     * 通过发布令牌获取完整智能体信息
     */
    private async getAgentByPublishToken(publishToken: string): Promise<Agent> {
        const agent = await this.agentRepository.findOne({
            where: { publishToken, isPublished: true },
        });

        if (!agent) {
            throw HttpExceptionFactory.notFound("智能体不存在或未发布");
        }

        return agent;
    }

    /**
     * 检查频率限制
     */
    private async checkRateLimit(agent: Agent): Promise<void> {
        const rateLimitPerMinute = agent.publishConfig?.rateLimitPerMinute;

        if (!rateLimitPerMinute || rateLimitPerMinute <= 0) {
            return; // 未设置限制
        }

        // TODO: 实现基于Redis的频率限制
        this.logger.debug(
            `[频率限制] 智能体 ${agent.id} 设置了 ${rateLimitPerMinute} 次/分钟的限制`,
        );
    }

    /**
     * 执行对话逻辑
     */
    private async performChat(agent: Agent, dto: PublicAgentChatDto) {
        await this.checkRateLimit(agent);
        const agentChatDto = this.convertToAgentChatDto(dto, agent);
        const anonymousUser = this.createAnonymousUser();

        try {
            const result = await this.agentChatService.chat(agent.id, agentChatDto, anonymousUser);
            this.logger.log(`[+] 公开智能体对话完成: ${agent.id} - ${agent.name}`);
            return result;
        } catch (error) {
            this.logger.error(`[!] 公开智能体对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.business("对话处理失败");
        }
    }

    /**
     * 执行流式对话逻辑
     */
    private async performChatStream(agent: Agent, dto: PublicAgentChatDto, res: Response) {
        await this.checkRateLimit(agent);
        const agentChatDto = this.convertToAgentChatDto(dto, agent);
        const anonymousUser = this.createAnonymousUser();

        try {
            return await this.agentChatService.chatStream(
                agent.id,
                agentChatDto,
                anonymousUser,
                res,
            );
        } catch (error) {
            this.logger.error(`[!] 公开智能体流式对话失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.business("流式对话处理失败");
        }
    }

    /**
     * 创建匿名用户上下文
     * 为直接访问的用户生成唯一标识符
     */
    private createAnonymousUser(): UserPlayground {
        // 生成基于时间戳和随机数的唯一标识符
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const uniqueId = `anonymous_${timestamp}_${randomStr}`;

        this.logger.debug(`[+] 创建匿名用户: ${uniqueId}`);

        return {
            id: uniqueId,
            username: `anonymous_${timestamp}`,
            isRoot: 0,
            role: {} as any,
            permissions: [],
        };
    }
}
