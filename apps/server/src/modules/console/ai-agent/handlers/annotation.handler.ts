import { UserPlayground } from "@common/interfaces/context.interface";
import { StreamUtils } from "@common/utils/stream-utils.util";
import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";

import { AgentChatDto, AgentChatResponse } from "../dto/agent";
import { Agent } from "../entities/agent.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import {
    AnnotationMatchResult,
    IAnnotationHandler,
    ResponseHandlerOptions,
} from "../interfaces/chat-handlers.interface";
import { AgentAnnotationService } from "../services/agent-annotation.service";
import { AgentChatRecordService } from "../services/agent-chat-record.service";
import { MessageHandler } from "./message.handler";

/**
 * 注解处理器
 * 负责智能体注解的匹配和响应处理
 */
@Injectable()
export class AnnotationHandler implements IAnnotationHandler {
    private readonly logger = new Logger(AnnotationHandler.name);

    constructor(
        private readonly agentAnnotationService: AgentAnnotationService,
        private readonly messageHandler: MessageHandler,
        private readonly agentChatRecordService: AgentChatRecordService,
    ) {}

    /**
     * 匹配用户问题的注解
     */
    async matchUserQuestion(agentId: string, userQuestion: string): Promise<AnnotationMatchResult> {
        try {
            const result = await this.agentAnnotationService.matchUserQuestion(
                agentId,
                userQuestion,
            );
            return {
                matched: result.matched,
                annotation: result.annotation,
            };
        } catch (error) {
            this.logger.error(`匹配注解失败: ${error.message}`);
            return { matched: false };
        }
    }

    /**
     * 生成注解响应
     */
    async generateAnnotationResponse(
        annotation: any,
        conversationRecord: AgentChatRecord | null,
        agentId: string,
        user: UserPlayground,
        dto: AgentChatDto,
        finalConfig: Agent,
        startTime: number,
        options: ResponseHandlerOptions,
    ): Promise<AgentChatResponse | void> {
        const { responseMode, res } = options;
        const isAnonymous = this.isAnonymousUser(user);

        // 构建注解信息
        const annotations = {
            annotationId: annotation.id,
            question: annotation.question,
            similarity: annotation.similarity || 1.0,
            createdBy: annotation.user?.nickname || annotation.user?.username || "未知用户",
        };

        // 保存AI响应消息
        if (conversationRecord && dto.saveConversation !== false) {
            await this.messageHandler.saveAssistantMessage(
                conversationRecord.id,
                agentId,
                user.id,
                annotation.answer,
                undefined,
                undefined,
                { context: dto.messages, annotations },
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

            // 流式输出注解答案
            await StreamUtils.autoStream(annotation.answer, res, { speed: 100 });

            // 发送上下文信息
            res.write(
                `data: ${JSON.stringify({
                    type: "context",
                    data: [...dto.messages, { role: "assistant", content: annotation.answer }],
                })}\n\n`,
            );

            // 发送注解信息
            res.write(`data: ${JSON.stringify({ type: "annotations", data: annotations })}\n\n`);

            res.write("data: [DONE]\n\n");
            res.end();
        } else {
            // 阻塞模式返回结果
            return {
                conversationId: conversationRecord?.id || null,
                response: annotation.answer,
                responseTime: Date.now() - startTime,
                tokenUsage: undefined,
                suggestions: [],
                annotations,
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
