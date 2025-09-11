import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";
import { ChatCompletion, ChatCompletionCreateParams } from "openai/resources/index";

import { ChatCompletionStream } from "@/sdk/ai/core/generator/text";

import { AgentChatDto, AgentChatResponse } from "../dto/agent";
import { Agent } from "../entities/agent.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import { AIRawResponse, ChatMessage, TokenUsage } from "../interfaces/agent-config.interface";
import {
    DatasetRetrievalResult,
    IChatContextBuilder,
    IKnowledgeRetrievalHandler,
    IMessageHandler,
    IResponseHandler,
    ModelInfo,
} from "../interfaces/chat-handlers.interface";
import { AgentChatRecordService } from "../services/agent-chat-record.service";
import { ChatContextBuilder } from "./chat-context.builder";
import { KnowledgeRetrievalHandler } from "./knowledge-retrieval.handler";
import { MessageHandler } from "./message.handler";

/**
 * 响应处理器
 * 负责处理流式和阻塞模式的AI响应
 */
@Injectable()
export class ResponseHandler implements IResponseHandler {
    private readonly logger = new Logger(ResponseHandler.name);

    constructor(
        private readonly messageHandler: MessageHandler,
        private readonly chatContextBuilder: ChatContextBuilder,
        private readonly knowledgeRetrievalHandler: KnowledgeRetrievalHandler,
        private readonly agentChatRecordService: AgentChatRecordService,
    ) {}

    /**
     * 处理流式响应
     */
    async handleStreamingResponse(
        client: {
            chat: { stream: (params: ChatCompletionCreateParams) => Promise<ChatCompletionStream> };
        },
        modelName: string,
        messages: ChatMessage[],
        requestOpts: Record<string, any>,
        res: Response,
        context: {
            conversationId?: string;
            agentId: string;
            user: UserPlayground;
            agent: Agent;
            dto: AgentChatDto;
            finalConfig: Agent;
            retrievalResults: DatasetRetrievalResult[];
            model: ModelInfo;
            conversationRecord?: AgentChatRecord | null;
            startTime: number;
            shouldIncludeReferences: boolean;
            lastUserMessage?: ChatMessage;
            billingResult?: { billToUser: any; billingContext: string };
        },
    ): Promise<void> {
        const {
            conversationId,
            agentId,
            user,
            dto,
            finalConfig,
            retrievalResults,
            model,
            conversationRecord,
            shouldIncludeReferences,
            lastUserMessage,
            billingResult,
        } = context;

        // 发送引用信息（如果需要）
        if (shouldIncludeReferences && retrievalResults.length) {
            const referenceSources = this.knowledgeRetrievalHandler.formatReferenceSources(
                retrievalResults,
                typeof lastUserMessage === "string"
                    ? lastUserMessage
                    : lastUserMessage?.content || "",
            );
            res.write(
                `data: ${JSON.stringify({ type: "references", data: referenceSources })}\n\n`,
            );
        }

        // 发送对话ID（如果是新创建的）
        if (conversationId && !dto.conversationId) {
            res.write(
                `data: ${JSON.stringify({ type: "conversation_id", data: conversationId })}\n\n`,
            );
        }

        // 在发送对话ID后进行算力检查
        if (
            billingResult?.billToUser &&
            finalConfig.billingConfig?.price > billingResult.billToUser.power
        ) {
            res.write(
                `data: ${JSON.stringify({
                    type: "error",
                    data: {
                        message: `${billingResult.billingContext}不足，请充值`,
                        code: 40602,
                    },
                })}\n\n`,
            );
            res.write("data: [DONE]\n\n");
            res.end();
            return;
        }

        let fullResponse = "";
        let tokenUsage: TokenUsage | undefined;
        let reasoningContent = "";
        let reasoningStartTime: number | null = null;

        try {
            // 创建流式请求
            const stream = await client.chat.stream({
                model: modelName,
                messages: messages as ChatMessage[],
                ...requestOpts,
            });

            // 处理流式数据
            for await (const chunk of stream) {
                if (chunk.choices[0].delta.content) {
                    fullResponse += chunk.choices[0].delta.content;
                    res.write(
                        `data: ${JSON.stringify({ type: "chunk", data: chunk.choices[0].delta.content })}\n\n`,
                    );
                }

                if ((chunk.choices[0].delta as any).reasoning_content) {
                    reasoningContent += (chunk.choices[0].delta as any).reasoning_content;
                    if (!reasoningStartTime) reasoningStartTime = Date.now();
                    res.write(
                        `data: ${JSON.stringify({ type: "reasoning", data: (chunk.choices[0].delta as any).reasoning_content })}\n\n`,
                    );
                }
            }

            // 获取最终结果
            const finalChatCompletion = await stream.finalChatCompletion();
            tokenUsage = finalChatCompletion.usage as TokenUsage;

            // 准备元数据
            const metadata = await this.chatContextBuilder.prepareMessageMetadata(
                retrievalResults,
                messages,
                fullResponse,
                model,
                finalConfig,
                dto,
                lastUserMessage,
            );

            // 添加推理内容到元数据
            if (reasoningContent && reasoningStartTime) {
                metadata.reasoning = {
                    content: reasoningContent,
                    startTime: reasoningStartTime,
                    endTime: Date.now(),
                    duration: Date.now() - reasoningStartTime,
                };
            }

            // 保存AI响应消息
            if (dto.saveConversation !== false && conversationId) {
                const isAnonymous = this.isAnonymousUser(user);
                await this.messageHandler.saveAssistantMessage(
                    conversationId,
                    agentId,
                    user.id,
                    fullResponse,
                    tokenUsage,
                    finalChatCompletion as unknown as AIRawResponse,
                    metadata,
                    isAnonymous ? user.id : undefined,
                );

                // 更新对话记录统计
                if (conversationRecord) {
                    await this.agentChatRecordService.updateChatRecordStats(
                        conversationRecord.id,
                        conversationRecord.messageCount + 2,
                        conversationRecord.totalTokens + (tokenUsage?.total_tokens || 0),
                    );
                }
            }

            // 发送上下文信息
            if (finalConfig.showContext) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "context",
                        data: [...messages, { role: "assistant", content: fullResponse }],
                    })}\n\n`,
                );
            }

            // 发送建议问题
            if (metadata.suggestions?.length) {
                res.write(
                    `data: ${JSON.stringify({ type: "suggestions", data: metadata.suggestions })}\n\n`,
                );
            }
        } catch (error) {
            this.logger.error(`流式响应处理失败: ${error.message}`);

            // 保存错误消息
            if (conversationRecord && dto.saveConversation !== false) {
                const isAnonymous = this.isAnonymousUser(user);
                await this.messageHandler.saveAssistantMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    error.message,
                    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                    error,
                    null,
                    isAnonymous ? user.id : undefined,
                );
            }

            // 发送错误信息
            res.write(
                `data: ${JSON.stringify({
                    type: "error",
                    data: { message: error.message, code: error.code || "INTERNAL_ERROR" },
                })}\n\n`,
            );
        } finally {
            res.write("data: [DONE]\n\n");
            res.end();
        }
    }

    /**
     * 处理阻塞响应
     */
    async handleBlockingResponse(
        client: {
            chat: { create: (params: ChatCompletionCreateParams) => Promise<ChatCompletion> };
        },
        modelName: string,
        messages: ChatMessage[],
        requestOpts: Record<string, any>,
        context: {
            conversationId?: string;
            agentId: string;
            user: UserPlayground;
            agent: Agent;
            dto: AgentChatDto;
            finalConfig: Agent;
            retrievalResults: DatasetRetrievalResult[];
            model: ModelInfo;
            conversationRecord?: AgentChatRecord | null;
            startTime: number;
            shouldIncludeReferences: boolean;
            lastUserMessage?: ChatMessage;
        },
    ): Promise<AgentChatResponse> {
        const {
            agentId,
            user,
            dto,
            finalConfig,
            retrievalResults,
            model,
            conversationRecord,
            startTime,
            shouldIncludeReferences,
            lastUserMessage,
        } = context;

        try {
            // 发起AI请求
            const response = await client.chat.create({
                model: modelName,
                messages: messages as ChatMessage[],
                ...requestOpts,
            });

            const fullResponse = response.choices[0].message.content || "";
            const tokenUsage = response.usage as TokenUsage;

            // 准备元数据
            const metadata = await this.chatContextBuilder.prepareMessageMetadata(
                retrievalResults,
                messages,
                fullResponse,
                model,
                finalConfig,
                dto,
                lastUserMessage,
            );

            // 保存AI响应消息
            if (dto.saveConversation !== false && conversationRecord) {
                const isAnonymous = this.isAnonymousUser(user);
                await this.messageHandler.saveAssistantMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    fullResponse,
                    tokenUsage,
                    response as unknown as AIRawResponse,
                    metadata,
                    isAnonymous ? user.id : undefined,
                );

                // 更新对话记录统计
                await this.agentChatRecordService.updateChatRecordStats(
                    conversationRecord.id,
                    conversationRecord.messageCount + 2,
                    conversationRecord.totalTokens + (tokenUsage?.total_tokens || 0),
                );
            }

            // 构建响应结果
            const result: AgentChatResponse = {
                conversationId: conversationRecord?.id || null,
                response: fullResponse,
                responseTime: Date.now() - startTime,
                tokenUsage: this.convertTokenUsage(tokenUsage),
                suggestions: metadata.suggestions || [],
            };

            // 添加引用源（如果需要）
            if (shouldIncludeReferences && retrievalResults.length) {
                result.referenceSources = this.convertReferenceSources(metadata.references);
            }

            return result;
        } catch (error) {
            this.logger.error(`阻塞响应处理失败: ${error.message}`);

            // 保存错误消息
            if (conversationRecord && dto.saveConversation !== false) {
                const isAnonymous = this.isAnonymousUser(user);
                await this.messageHandler.saveAssistantMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    error.message,
                    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                    error,
                    null,
                    isAnonymous ? user.id : undefined,
                );
            }

            throw error;
        }
    }

    /**
     * 转换Token使用量格式
     */
    private convertTokenUsage(
        usage?: TokenUsage,
    ): { totalTokens: number; promptTokens: number; completionTokens: number } | undefined {
        if (!usage) return undefined;
        return {
            totalTokens: usage.total_tokens || usage.totalTokens || 0,
            promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
            completionTokens: usage.completion_tokens || usage.completionTokens || 0,
        };
    }

    /**
     * 转换引用源格式
     */
    private convertReferenceSources(
        references?: Array<{ datasetId: string; datasetName?: string; chunks: any[] }>,
    ): AgentChatResponse["referenceSources"] {
        if (!references) return undefined;
        return references.map((ref) => ({
            datasetId: ref.datasetId,
            datasetName: ref.datasetName || "知识库",
            chunks: ref.chunks,
        }));
    }

    /**
     * 检查是否为匿名用户
     */
    private isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }
}
