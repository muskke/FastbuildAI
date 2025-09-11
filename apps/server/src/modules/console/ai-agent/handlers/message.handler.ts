import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AIRawResponse, MessageMetadata, TokenUsage } from "../interfaces/agent-config.interface";
import { IMessageHandler } from "../interfaces/chat-handlers.interface";

/**
 * 消息处理器
 * 负责保存用户消息和AI助手消息
 */
@Injectable()
export class MessageHandler implements IMessageHandler {
    private readonly logger = new Logger(MessageHandler.name);

    constructor(
        @InjectRepository(AgentChatMessage)
        private readonly chatMessageRepository: Repository<AgentChatMessage>,
    ) {}

    /**
     * 保存用户消息
     */
    async saveUserMessage(
        conversationId: string,
        agentId: string,
        userId: string,
        content: string,
        formVariables?: Record<string, string>,
        formFieldsInputs?: Record<string, any>,
        anonymousIdentifier?: string,
    ): Promise<void> {
        try {
            await this.chatMessageRepository.save({
                conversationId,
                agentId,
                userId: anonymousIdentifier ? null : userId,
                anonymousIdentifier: anonymousIdentifier || null,
                role: "user",
                content,
                messageType: "text",
                formVariables,
                formFieldsInputs,
            });
        } catch (err) {
            this.logger.error(`保存用户消息失败: ${err.message}`);
            throw err;
        }
    }

    /**
     * 保存AI助手消息
     */
    async saveAssistantMessage(
        conversationId: string,
        agentId: string,
        userId: string,
        content: string,
        tokenUsage?: TokenUsage,
        rawResponse?: AIRawResponse,
        metadata?: MessageMetadata,
        anonymousIdentifier?: string,
    ): Promise<void> {
        try {
            await this.chatMessageRepository.save({
                conversationId,
                agentId,
                userId: anonymousIdentifier ? null : userId,
                anonymousIdentifier: anonymousIdentifier || null,
                role: "assistant",
                content,
                messageType: "text",
                tokens: tokenUsage,
                rawResponse,
                metadata,
            });
        } catch (err) {
            this.logger.error(`保存AI响应消息失败: ${err.message}`);
            throw err;
        }
    }
}
