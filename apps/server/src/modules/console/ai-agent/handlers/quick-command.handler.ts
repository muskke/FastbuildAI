import { UserPlayground } from "@common/interfaces/context.interface";
import { StreamUtils } from "@common/utils/stream-utils.util";
import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";

import { AgentChatDto, AgentChatResponse } from "../dto/agent";
import { Agent } from "../entities/agent.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import { ChatMessage } from "../interfaces/agent-config.interface";
import {
    IQuickCommandHandler,
    QuickCommandResult,
    ResponseHandlerOptions,
} from "../interfaces/chat-handlers.interface";
import { AgentChatRecordService } from "../services/agent-chat-record.service";
import { ChatContextBuilder } from "./chat-context.builder";
import { MessageHandler } from "./message.handler";

/**
 * 快捷命令处理器
 * 负责处理快捷命令的匹配和响应
 */
@Injectable()
export class QuickCommandHandler implements IQuickCommandHandler {
    private readonly logger = new Logger(QuickCommandHandler.name);

    constructor(
        private readonly messageHandler: MessageHandler,
        private readonly chatContextBuilder: ChatContextBuilder,
        private readonly agentChatRecordService: AgentChatRecordService,
    ) {}

    /**
     * 处理快捷命令
     */
    handleQuickCommand(dto: AgentChatDto, lastUserMessage?: ChatMessage): QuickCommandResult {
        if (!dto.quickCommands?.length || !lastUserMessage) {
            return { matched: false };
        }

        const matchedCommand = dto.quickCommands.find(
            (cmd) => cmd.name.trim() === lastUserMessage.content.trim(),
        );

        if (!matchedCommand) {
            return { matched: false };
        }

        return {
            matched: true,
            response:
                matchedCommand.replyType === "custom" ? matchedCommand.replyContent : undefined,
            content: matchedCommand.replyType === "model" ? matchedCommand.content : undefined,
        };
    }

    /**
     * 生成快捷命令响应
     */
    async generateQuickCommandResponse(
        response: string,
        conversationRecord: AgentChatRecord | null,
        agentId: string,
        user: UserPlayground,
        dto: AgentChatDto,
        finalConfig: Agent,
        startTime: number,
        options: ResponseHandlerOptions,
    ): Promise<AgentChatResponse | void> {
        const { responseMode, res } = options;

        // 生成自动追问问题
        const suggestions = await this.chatContextBuilder.generateAutoQuestions(
            [...dto.messages],
            response,
            null,
            finalConfig,
            dto,
        );

        const isAnonymous = this.isAnonymousUser(user);

        // 保存AI响应消息
        if (conversationRecord && dto.saveConversation !== false) {
            await this.messageHandler.saveAssistantMessage(
                conversationRecord.id,
                agentId,
                user.id,
                response,
                undefined,
                undefined,
                { suggestions },
                isAnonymous ? user.id : undefined,
            );

            // 更新对话记录统计
            await this.agentChatRecordService.updateChatRecordStats(
                conversationRecord.id,
                conversationRecord.messageCount + 2,
                conversationRecord.totalTokens,
            );
        }

        if (responseMode === "streaming") {
            if (!res) {
                throw new Error("流式模式需要响应对象");
            }

            // 发送对话ID（如果是新创建的）
            if (conversationRecord && !dto.conversationId) {
                res.write(
                    `data: ${JSON.stringify({ type: "conversation_id", data: conversationRecord.id })}\n\n`,
                );
            }

            // 流式输出响应内容
            await StreamUtils.autoStream(response, res, { speed: 100 });

            // 发送上下文信息
            res.write(
                `data: ${JSON.stringify({ type: "context", data: [...dto.messages, { role: "assistant", content: response }] })}\n\n`,
            );

            // 发送建议问题
            if (suggestions.length) {
                res.write(
                    `data: ${JSON.stringify({ type: "suggestions", data: suggestions })}\n\n`,
                );
            }

            res.write("data: [DONE]\n\n");
            res.end();
        } else {
            // 阻塞模式返回结果
            return {
                conversationId: conversationRecord?.id || null,
                response,
                responseTime: Date.now() - startTime,
                tokenUsage: undefined,
                suggestions,
            };
        }
    }

    /**
     * 检查是否为匿名用户
     */
    private isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }
}
