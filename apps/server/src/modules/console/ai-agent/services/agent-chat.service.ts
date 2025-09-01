import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import {
    ACCOUNT_LOG_SOURCE,
    ACCOUNT_LOG_TYPE,
    ACTION,
} from "@common/modules/account/constants/account-log.constants";
import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { StreamUtils } from "@common/utils/stream-utils.util";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import { PropertyType, Repository } from "typeorm";

import { AiModelService } from "@/modules/console/ai/services/ai-model.service";
import { TextGenerator } from "@/sdk/ai/core/generator/text";
import { getProvider } from "@/sdk/ai/utils/get-provider";

import {
    RetrievalChunk,
    RetrievalConfig,
} from "../../ai-datasets/interfaces/retrieval-config.interface";
import { DatasetsService } from "../../ai-datasets/services/datasets.service";
import { DatasetsRetrievalService } from "../../ai-datasets/services/datasets-retrieval.service";
import { AgentChatDto, AgentChatResponse } from "../dto/agent.dto";
import { Agent } from "../entities/agent.entity";
import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import {
    AgentReferenceSources,
    AIRawResponse,
    ChatMessage,
    MessageMetadata,
    TokenUsage,
} from "../interfaces/agent-config.interface";
import { AgentService } from "./agent.service";
import { AgentAnnotationService } from "./agent-annotation.service";
import { AgentChatRecordService } from "./agent-chat-record.service";

interface DatasetRetrievalResult {
    datasetId: string;
    datasetName: string;
    retrievalConfig: RetrievalConfig;
    chunks: (RetrievalChunk & { datasetId: string; datasetName: string })[];
    reranked?: boolean;
    duration?: number;
}

interface AIResponse {
    response: string;
    tokenUsage?: TokenUsage;
    rawResponse?: AIRawResponse;
}

interface QuickCommandResult {
    matched: boolean;
    response?: string;
    content?: string;
}

/**
 * Base class for agent chat functionality
 */
abstract class BaseAgentChatService extends BaseService<AgentChatRecord> {
    protected readonly logger = new Logger(BaseAgentChatService.name);

    constructor(
        protected readonly chatRecordRepository: Repository<AgentChatRecord>,
        protected readonly chatMessageRepository: Repository<AgentChatMessage>,
        protected readonly agentRepository: Repository<Agent>,
        protected readonly userRepository: Repository<User>,
        protected readonly agentService: AgentService,
        protected readonly agentChatRecordService: AgentChatRecordService,
        protected readonly datasetsRetrievalService: DatasetsRetrievalService,
        protected readonly datasetsService: DatasetsService,
        protected readonly aiModelService: AiModelService,
        protected readonly agentAnnotationService: AgentAnnotationService,
        protected readonly accountLogService: AccountLogService,
    ) {
        super(chatRecordRepository);
    }

    /**
     * 生成自动追问问题
     */
    protected async generateAutoQuestions(
        messages: ChatMessage[],
        finalResponse: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<string[]> {
        if (!dto.autoQuestions?.enabled) {
            return [];
        }

        try {
            const { client, requestOpts, modelName } = await this.getAIClient(model, config, dto);

            const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

            const basePrompt = `你是一个AI助手，任务是预测用户可能提出的下一个问题。根据用户的问题和AI的回复，生成3个引导对话继续的潜在问题。要求：
使用用户最后一条问题的语言风格
每个问题不超过20个字
分析用户意图，生成相关且吸引人的后续问题。问题应该是当前话题的自然延伸或相关领域。
保持语气和风格一致，提供多样化选择，帮助用户深入探讨主题或探索相关内容。
用户的问题是：${lastUserMessage}`;

            const prompt =
                dto.autoQuestions.customRuleEnabled && dto.autoQuestions.customRule
                    ? `1.用户的问题是：${lastUserMessage} \n\n2.最多只能生成3条建议，无论后面说了几条，都是只有3条并且不能超过 20 个字。\n\n3.${dto.autoQuestions.customRule}`
                    : basePrompt;

            // console.log(prompt);

            const response = await client.chat.create({
                model: modelName,
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: "生成 3 条问题建议" },
                ],
                max_tokens: 100,
                ...requestOpts,
            });

            const questions = response.choices[0].message.content
                .split("\n")
                .filter((q) => q.trim())
                .slice(0, 3)
                .map((q) => q.replace(/^\d+\.\s*/, "").trim());

            this.logger.debug(`[+] 生成自动追问问题: ${questions.join(", ")}`);
            return questions;
        } catch (err) {
            this.logger.error(`[!] 生成自动追问问题失败: ${err.message}`, err.stack);
            return [];
        }
    }

    /**
     * 处理快捷指令
     */
    protected handleQuickCommand(
        dto: AgentChatDto,
        lastUserMessage: ChatMessage | undefined,
    ): QuickCommandResult {
        if (!dto.quickCommands?.length || !lastUserMessage) {
            return { matched: false };
        }

        const userMessage = lastUserMessage.content.trim();
        const matchedCommand = dto.quickCommands.find((cmd) => cmd.name.trim() === userMessage);

        if (!matchedCommand) {
            return { matched: false };
        }

        this.logger.log(
            `[QuickCommand] 匹配到快捷指令: ${matchedCommand.name}, 类型: ${matchedCommand.replyType}`,
        );
        if (matchedCommand.replyType === "custom") {
            return { matched: true, response: matchedCommand.replyContent };
        } else if (matchedCommand.replyType === "model") {
            return { matched: true, content: matchedCommand.content };
        }

        return { matched: false };
    }

    /**
     * 准备消息元数据
     */
    protected async prepareMessageMetadata(
        retrievalResults: DatasetRetrievalResult[],
        messages: ChatMessage[],
        fullResponse: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
        lastUserMessage?: ChatMessage,
    ): Promise<MessageMetadata> {
        const suggestions = await this.generateAutoQuestions(
            messages,
            fullResponse,
            model,
            config,
            dto,
        );

        return {
            references:
                retrievalResults.length > 0
                    ? this.formatReferenceSources(retrievalResults, lastUserMessage?.content || "")
                    : undefined,
            context: messages,
            suggestions,
        };
    }

    /**
     * 检查是否是匿名用户
     */
    protected isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }

    protected async initializeChat(
        agentId: string,
        dto: AgentChatDto,
        user: UserPlayground,
    ): Promise<{ agent: Agent; finalConfig: Agent; conversationRecord: AgentChatRecord | null }> {
        const startTime = Date.now();
        const agent = await this.agentService.getAgentDetail(agentId);
        if (!agent) {
            throw HttpExceptionFactory.notFound("智能体不存在");
        }

        const finalConfig = this.mergeConfigurations(agent, dto);

        let conversationRecord: AgentChatRecord | null = null;
        if (dto.conversationId) {
            conversationRecord = await this.agentChatRecordService.getChatRecordDetail(
                dto.conversationId,
                user,
            );
        } else if (dto.saveConversation !== false) {
            if (this.isAnonymousUser(user)) {
                conversationRecord = await this.agentChatRecordService.createChatRecord(
                    agentId,
                    undefined,
                    dto.title ||
                        this.generateConversationTitle(dto.messages[0]?.content || "新对话"),
                    user.id,
                );
            } else {
                conversationRecord = await this.agentChatRecordService.createChatRecord(
                    agentId,
                    user.id,
                    dto.title ||
                        this.generateConversationTitle(dto.messages[0]?.content || "新对话"),
                );
            }
        }

        return { agent, finalConfig, conversationRecord };
    }

    protected async saveUserMessage(
        conversationId: string,
        agentId: string,
        userId: string,
        content: string,
        formVariables?: Record<string, string>,
        formFieldsInputs?: Record<string, any>,
        anonymousIdentifier?: string,
    ): Promise<void> {
        try {
            const messageData = {
                conversationId,
                agentId,
                userId: anonymousIdentifier ? null : userId,
                anonymousIdentifier: anonymousIdentifier || null,
                role: "user" as const,
                content,
                messageType: "text",
                formVariables,
                formFieldsInputs,
            };

            await this.chatMessageRepository.save(messageData);
        } catch (err) {
            this.logger.error(`[!] 保存用户消息失败: ${err.message}`, err.stack);
        }
    }

    protected async saveAssistantMessage(
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
            const messageData: Partial<AgentChatMessage> = {
                conversationId,
                agentId,
                userId: anonymousIdentifier ? null : userId,
                anonymousIdentifier: anonymousIdentifier || null,
                role: "assistant" as const,
                content,
                messageType: "text",
                tokens: tokenUsage,
                rawResponse,
                metadata,
            };

            await this.chatMessageRepository.save(messageData);
        } catch (err) {
            this.logger.error(`[!] 保存AI响应消息失败: ${err.message}`, err.stack);
        }
    }

    protected async prepareChatContext(
        finalConfig: Agent,
        dto: AgentChatDto,
        lastUserMessage: ChatMessage | undefined,
    ): Promise<{
        systemPrompt: string;
        retrievalResults: DatasetRetrievalResult[];
        messages: ChatMessage[];
        model: any;
    }> {
        const systemPrompt = this.buildSystemPrompt(
            finalConfig,
            dto.formVariables,
            dto.formFieldsInputs,
        );

        if (!finalConfig.modelConfig?.id) {
            this.logger.error(`[!] 无效的模型配置ID: ${finalConfig.modelConfig?.id}`);
            throw new Error("智能体未配置有效的AI模型");
        }

        const model = await this.aiModelService.findOne({
            where: { id: finalConfig.modelConfig.id, isActive: true },
            relations: ["provider"],
        });

        if (!model || !model.provider) {
            this.logger.error(
                `[!] 模型不存在或未激活，或缺少provider配置: modelId=${finalConfig.modelConfig.id}`,
            );
            throw new Error("模型不存在、未激活或缺少provider配置");
        }

        let retrievalResults: DatasetRetrievalResult[] = [];
        if (finalConfig.datasetIds?.length && lastUserMessage) {
            const shouldRetrieve = await this.shouldPerformRetrieval(
                lastUserMessage.content,
                model,
                finalConfig,
                dto,
            );

            if (shouldRetrieve) {
                this.logger.log(`[智能检索] 执行知识库检索: ${lastUserMessage.content}`);
                retrievalResults = await this.performKnowledgeRetrieval(
                    finalConfig.datasetIds,
                    lastUserMessage.content,
                );
            } else {
                this.logger.log(`[智能检索] 跳过知识库检索: ${lastUserMessage.content}`);
            }
        }

        const limitedMessages = this.limitMessagesByContext(
            dto.messages as ChatMessage[],
            model.maxContext,
        );
        this.logger.debug(
            `🔄 上下文限制: 原始消息数 ${dto.messages.length}, 限制后消息数 ${limitedMessages.length}, 最大上下文 ${model.maxContext}`,
        );

        const messages = this.buildChatMessages(systemPrompt, limitedMessages, retrievalResults);
        return { systemPrompt, retrievalResults, messages, model };
    }

    protected async getAIClient(model: any, config: Agent, dto: AgentChatDto) {
        if (!model || !model.provider) {
            this.logger.error(`[!] 无效的模型或provider: model=${JSON.stringify(model)}`);
            throw new Error("无法创建AI客户端：模型或provider配置无效");
        }

        const provider = getProvider(model.provider.provider, {
            apiKey: model.provider.apiKey,
            baseURL: model.provider.baseUrl,
        });

        const client = new TextGenerator(provider);

        const fields = Object.keys(model.modelConfig || {}).filter(
            (item) => model.modelConfig[item]?.enable,
        );

        const globalOpts = fields.reduce(
            (acc, item) => ({
                ...acc,
                [item]: model.modelConfig[item].value,
            }),
            {},
        );

        const requestOpts = {
            ...globalOpts,
            ...config.modelConfig?.options,
            ...dto.modelConfig?.options,
        };

        return { client, requestOpts, modelName: model.model };
    }

    protected buildChatMessages(
        systemPrompt: string,
        inputMessages: ChatMessage[],
        retrievalResults: DatasetRetrievalResult[],
    ): ChatMessage[] {
        const messages: ChatMessage[] = [];
        let systemContent = systemPrompt;

        if (retrievalResults.length > 0) {
            systemContent += "\n\n参考以下知识库内容来回答问题：\n";
            retrievalResults.forEach((result, index) => {
                result.chunks.forEach((chunk: any, chunkIndex: number) => {
                    systemContent += `[参考${index + 1}.${chunkIndex + 1}] ${chunk.content}\n`;
                });
            });
        }

        messages.push({ role: "system", content: systemContent });
        inputMessages.forEach((msg) => messages.push({ role: msg.role, content: msg.content }));
        return messages;
    }

    protected async performKnowledgeRetrieval(
        datasetIds: string[],
        query: string,
    ): Promise<DatasetRetrievalResult[]> {
        try {
            if (!datasetIds?.length) return [];

            const promises = datasetIds.map(async (datasetId) => {
                const startTime = Date.now();
                try {
                    const dataset = await this.getDatasetConfig(datasetId);
                    if (!dataset) return null;

                    const result = await this.datasetsRetrievalService.queryDatasetWithConfig(
                        datasetId,
                        query,
                        dataset.retrievalConfig,
                    );

                    if (!result.chunks?.length) return null;

                    const duration = Date.now() - startTime;
                    return {
                        datasetId,
                        datasetName: dataset.name,
                        retrievalConfig: dataset.retrievalConfig,
                        duration,
                        chunks: result.chunks,
                    };
                } catch (err) {
                    this.logger.error(`知识库 ${datasetId} 检索失败: ${err.message}`);
                    return null;
                }
            });

            const results = (await Promise.all(promises)).filter(
                Boolean,
            ) as DatasetRetrievalResult[];
            if (results.length === 0) return [];

            return results;
        } catch (err) {
            this.logger.error(`知识库检索失败: ${err.message}`);
            return [];
        }
    }

    protected buildSystemPrompt(
        config: Agent,
        formVariables?: Record<string, string>,
        formFieldsInputs?: Record<string, any>,
    ): string {
        let prompt = config.rolePrompt || "你是一个有用的AI助手。";
        const variables = { ...formVariables, ...formFieldsInputs };

        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                prompt = prompt.replace(new RegExp(placeholder, "g"), value);
            });
        }

        return prompt;
    }

    protected formatReferenceSources(retrievalResults: DatasetRetrievalResult[], content: string) {
        return retrievalResults.map((result) => ({
            datasetId: result.datasetId,
            datasetName: result.datasetName || "知识库",
            userContent: content,
            retrievalMode: result.retrievalConfig?.retrievalMode,
            duration: result.duration,
            chunks: result.chunks,
        }));
    }

    protected generateConversationTitle(message: string): string {
        return message.length > 20 ? message.substring(0, 20) + "..." : message;
    }

    protected limitMessagesByContext(messages: ChatMessage[], maxContext?: number): ChatMessage[] {
        if (!maxContext || maxContext <= 0 || messages.length <= maxContext) {
            return messages;
        }

        const systemMessageIndex = messages.findIndex((msg) => msg.role === "system");
        if (systemMessageIndex !== -1) {
            const systemMessage = messages[systemMessageIndex];
            const otherMessages = messages.filter((_, index) => index !== systemMessageIndex);
            const remainingCount = maxContext - 1;
            const limitedOtherMessages =
                otherMessages.length > remainingCount
                    ? otherMessages.slice(-remainingCount)
                    : otherMessages;
            return [systemMessage, ...limitedOtherMessages];
        }

        return messages.slice(-maxContext);
    }

    protected mergeConfigurations(agent: Agent, dto: AgentChatDto): Agent {
        return {
            ...agent,
            modelConfig: dto.modelConfig ?? agent.modelConfig,
            datasetIds: dto.datasetIds ?? agent.datasetIds,
            rolePrompt: dto.rolePrompt ?? agent.rolePrompt,
            showContext: dto.showContext ?? agent.showContext,
            showReference: dto.showReference ?? agent.showReference,
            enableFeedback: dto.enableFeedback ?? agent.enableFeedback,
            enableWebSearch: dto.enableWebSearch ?? agent.enableWebSearch,
            autoQuestions: dto.autoQuestions ?? agent.autoQuestions,
        };
    }

    protected findBestDataset(
        allResults: DatasetRetrievalResult[],
        query: string,
    ): DatasetRetrievalResult {
        if (allResults.length === 1) return allResults[0];

        const best = allResults
            .map((result) => {
                const chunks = result.chunks;
                if (!chunks?.length) return { result, score: 0 };

                const scores = chunks.map((chunk) => chunk.score);
                const maxScore = Math.max(...scores);
                const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                const score = maxScore * 0.7 + avgScore * 0.3;

                return { result, score };
            })
            .sort((a, b) => b.score - a.score)[0];

        return best.result;
    }

    protected async getDatasetConfig(datasetId: string): Promise<{
        id: string;
        name: string;
        retrievalConfig: RetrievalConfig;
    } | null> {
        try {
            const dataset = await this.datasetsService.findOneById(datasetId);
            if (!dataset) {
                this.logger.warn(`[!] 知识库不存在: ${datasetId}`);
                return null;
            }
            return {
                id: dataset.id,
                name: dataset.name,
                retrievalConfig: dataset.retrievalConfig,
            };
        } catch (err) {
            this.logger.error(`[!] 获取知识库配置失败: ${err.message}`, err.stack);
            return null;
        }
    }

    protected async shouldPerformRetrieval(
        userQuery: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<boolean> {
        try {
            if (!config.datasetIds?.length) {
                return false;
            }

            const simpleQueries = [
                /^(你好|hello|hi|哈喽|嗨)$/i,
                /^(谢谢|thank you|thanks)$/i,
                /^(再见|goodbye|bye)$/i,
                /^(没事|没关系|不用了)$/i,
                /^(ok|好的|嗯|哦)$/i,
            ];

            if (simpleQueries.some((pattern) => pattern.test(userQuery.trim()))) {
                this.logger.debug(`[智能检索] 简单问候语，跳过检索: ${userQuery}`);
                return false;
            }

            const preSearchResults = await this.performPreSearch(config.datasetIds, userQuery);

            const { client, requestOpts, modelName } = await this.getAIClient(model, config, dto);

            const topChunks = preSearchResults.slice(0, 3);
            const chunksContent = topChunks
                .map((chunk, index) => `[片段${index + 1}] ${chunk.content.substring(0, 200)}...`)
                .join("\n\n");

            const judgmentPrompt = `你是一个智能检索助手，需要根据用户问题和知识库向量预检索结果，判断是否需要进行完整的知识库检索。

用户问题：${userQuery}

知识库向量预检索结果：
${chunksContent}

**判断规则：**
1. 如果向量预检索结果与用户问题语义高度相关，包含用户想要的信息 → 返回 true
2. 如果向量预检索结果与用户问题语义相关，但需要更精确的检索来获取完整答案 → 返回 true  
3. 如果向量预检索结果与用户问题语义完全不相关，或者用户问题是简单问候/闲聊 → 返回 false

**判断原则：基于向量相似度和语义相关性进行判断，倾向于提供准确的知识库信息**

请严格按照以下JSON格式回答：
{"need_retrieval": true/false, "reason": "基于向量预检索结果的判断理由"}`;
            const response = await client.chat.create({
                model: modelName,
                messages: [
                    { role: "system", content: judgmentPrompt },
                    { role: "user", content: "请基于向量预检索结果判断并返回JSON格式结果" },
                ],
                max_tokens: 150,
                temperature: 0.1,
                ...requestOpts,
            });

            const content = response.choices[0].message.content?.trim() || "";
            const jsonMatch = content.match(/\{[^}]+\}/);

            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);

                this.logger.log(
                    `[智能检索] 问题: "${userQuery}" | 向量预检索片段数: ${preSearchResults.length} | AI判断: ${result.need_retrieval} | 理由: ${result.reason}`,
                );

                return result.need_retrieval;
            }

            this.logger.warn(
                `[智能检索] JSON解析失败，但有向量预检索结果，执行检索。LLM回复: ${content}`,
            );
            return true;
        } catch (err) {
            this.logger.error(`[智能检索] 判断失败，默认执行检索: ${err.message}`);
            return true;
        }
    }

    private async performPreSearch(datasetIds: string[], query: string): Promise<any[]> {
        try {
            const allResults: any[] = [];

            const promises = datasetIds.map(async (datasetId) => {
                try {
                    const dataset = await this.getDatasetConfig(datasetId);
                    if (!dataset) return [];

                    const quickConfig = {
                        retrievalMode: "vector" as const,
                        topK: 3,
                        scoreThreshold: 0.3,
                        scoreThresholdEnabled: false,
                    };

                    const result = await this.datasetsRetrievalService.queryDatasetWithConfig(
                        datasetId,
                        query,
                        quickConfig,
                    );

                    return result.chunks || [];
                } catch (err) {
                    this.logger.debug(`[向量预检索] 知识库 ${datasetId} 检索失败: ${err.message}`);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            results.forEach((chunks) => allResults.push(...chunks));

            const uniqueResults = allResults
                .filter((chunk, index, arr) => arr.findIndex((c) => c.id === chunk.id) === index)
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            this.logger.debug(
                `[向量预检索] 查询: "${query}" | 找到语义相关片段: ${uniqueResults.length}个`,
            );

            return uniqueResults;
        } catch (err) {
            this.logger.error(`[向量预检索] 执行失败: ${err.message}`);
            return [];
        }
    }
}

/**
 * Agent chat service implementation
 */
@Injectable()
export class AgentChatService extends BaseAgentChatService {
    constructor(
        @InjectRepository(AgentChatRecord)
        chatRecordRepository: Repository<AgentChatRecord>,
        @InjectRepository(AgentChatMessage)
        chatMessageRepository: Repository<AgentChatMessage>,
        @InjectRepository(Agent)
        agentRepository: Repository<Agent>,
        @InjectRepository(User)
        userRepository: Repository<User>,
        agentService: AgentService,
        agentChatRecordService: AgentChatRecordService,
        datasetsRetrievalService: DatasetsRetrievalService,
        datasetsService: DatasetsService,
        aiModelService: AiModelService,
        agentAnnotationService: AgentAnnotationService,
        accountLogService: AccountLogService,
    ) {
        super(
            chatRecordRepository,
            chatMessageRepository,
            agentRepository,
            userRepository,
            agentService,
            agentChatRecordService,
            datasetsRetrievalService,
            datasetsService,
            aiModelService,
            agentAnnotationService,
            accountLogService,
        );
    }

    /**
     * Unified chat handler for both synchronous and streaming responses
     */
    async handleChat(
        agentId: string,
        dto: AgentChatDto,
        user: UserPlayground,
        responseMode: "sync" | "stream",
        isPublic: boolean,
        res?: Response,
    ): Promise<AgentChatResponse | void> {
        if (responseMode === "stream" && !res) {
            throw new Error("Response object is required for streaming mode");
        }

        if (responseMode === "stream") {
            res!.setHeader("Content-Type", "text/event-stream");
            res!.setHeader("Cache-Control", "no-cache");
            res!.setHeader("Connection", "keep-alive");
            res!.setHeader("Access-Control-Allow-Origin", "*");
            res!.setHeader("Access-Control-Allow-Headers", "Cache-Control");
        }

        const agentInfo = await this.agentService.findOneById(agentId);

        if (!agentInfo) {
            throw HttpExceptionFactory.notFound("智能体不存在");
        }

        let owner: User;

        if (!isPublic) {
            owner = await this.userRepository.findOne({
                where: { id: user.id },
            });

            if (!owner) {
                throw HttpExceptionFactory.notFound("用户不存在");
            }
        } else {
            owner = await this.userRepository.findOne({
                where: { id: agentInfo.createBy },
            });

            if (!owner) {
                throw HttpExceptionFactory.notFound("用户不存在");
            }
        }

        const startTime = Date.now();
        const { finalConfig, conversationRecord } = await this.initializeChat(agentId, dto, user);
        let conversationId = dto.conversationId;
        let fullResponse = "";
        let result: AgentChatResponse = {
            conversationId: conversationRecord?.id || null,
            response: "",
            responseTime: 0,
            tokenUsage: undefined,
            suggestions: [],
        };

        try {
            const lastUserMessage = dto.messages.filter((m) => m.role === "user").pop() as
                | ChatMessage
                | undefined;

            if (lastUserMessage && conversationRecord && dto.saveConversation !== false) {
                await this.saveUserMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    lastUserMessage.content,
                    dto.formVariables,
                    dto.formFieldsInputs,
                    this.isAnonymousUser(user) ? user.id : undefined,
                );
            }

            if (agentInfo.billingConfig.price > owner.power) {
                throw HttpExceptionFactory.forbidden(
                    `${isPublic ? "分享者" : ""}算力不足，请充值后重试`,
                );
            }

            const quickCommandResult = this.handleQuickCommand(dto, lastUserMessage);
            if (quickCommandResult.matched && quickCommandResult.response) {
                if (responseMode === "stream") {
                    await this.handleStreamQuickCommand(
                        dto,
                        conversationId || conversationRecord?.id || "",
                        conversationRecord,
                        agentId,
                        user,
                        finalConfig,
                        quickCommandResult,
                        lastUserMessage,
                        res!,
                    );
                    return;
                } else {
                    return await this.handleCustomQuickCommand(
                        quickCommandResult.response,
                        conversationRecord,
                        agentId,
                        user,
                        dto,
                        finalConfig,
                        startTime,
                    );
                }
            }

            const updatedLastUserMessage =
                quickCommandResult.matched && quickCommandResult.content
                    ? { role: "user" as const, content: quickCommandResult.content }
                    : lastUserMessage;

            const modifiedDto =
                quickCommandResult.matched && quickCommandResult.content
                    ? {
                          ...dto,
                          messages: [...dto.messages.slice(0, -1), updatedLastUserMessage],
                      }
                    : dto;

            if (updatedLastUserMessage) {
                const annotationMatch = await this.agentAnnotationService.matchUserQuestion(
                    agentId,
                    updatedLastUserMessage.content,
                );

                if (annotationMatch.matched && annotationMatch.annotation) {
                    this.logger.log(
                        `[标注命中${responseMode === "stream" ? "-流式" : ""}] 问题: "${updatedLastUserMessage.content}" -> 答案: "${annotationMatch.annotation.answer}"`,
                    );

                    const annotations = {
                        annotationId: annotationMatch.annotation.id,
                        question: annotationMatch.annotation.question,
                        similarity: annotationMatch.similarity || 1.0,
                        createdBy:
                            annotationMatch.annotation.user?.nickname ||
                            annotationMatch.annotation.user?.username ||
                            "未知用户",
                    };

                    if (dto.saveConversation !== false && conversationRecord) {
                        await this.saveAssistantMessage(
                            conversationRecord.id,
                            agentId,
                            user.id,
                            annotationMatch.annotation.answer,
                            undefined,
                            undefined,
                            {
                                context: modifiedDto.messages,
                                annotations,
                            },
                            this.isAnonymousUser(user) ? user.id : undefined,
                        );

                        await this.agentChatRecordService.updateChatRecordStats(
                            conversationRecord.id,
                            conversationRecord.messageCount + 2,
                            conversationRecord.totalTokens,
                        );
                    }

                    if (responseMode === "stream") {
                        if (!conversationId && conversationRecord) {
                            conversationId = conversationRecord.id;
                            res!.write(
                                `data: ${JSON.stringify({ type: "conversation_id", data: conversationId })}\n\n`,
                            );
                        }

                        await StreamUtils.wordStream(annotationMatch.annotation.answer, res!, 20);

                        const completeContext = [
                            ...modifiedDto.messages,
                            { role: "assistant", content: annotationMatch.annotation.answer },
                        ];
                        res!.write(
                            `data: ${JSON.stringify({ type: "context", data: completeContext })}\n\n`,
                        );

                        res!.write(
                            `data: ${JSON.stringify({
                                type: "annotations",
                                data: annotations,
                            })}\n\n`,
                        );

                        res!.write("data: [DONE]\n\n");
                        res!.end();
                        return;
                    } else {
                        return {
                            conversationId: conversationRecord?.id || null,
                            response: annotationMatch.annotation.answer,
                            responseTime: Date.now() - startTime,
                            tokenUsage: undefined,
                            suggestions: [],
                            annotations,
                        };
                    }
                }
            }

            const { messages, retrievalResults, model } = await this.prepareChatContext(
                finalConfig,
                modifiedDto,
                updatedLastUserMessage,
            );

            const shouldIncludeReferences =
                modifiedDto.includeReferences ?? finalConfig.showReference;
            if (
                shouldIncludeReferences &&
                retrievalResults.length > 0 &&
                responseMode === "stream"
            ) {
                const referenceSources = this.formatReferenceSources(
                    retrievalResults,
                    updatedLastUserMessage?.content || "",
                );
                res!.write(
                    `data: ${JSON.stringify({ type: "references", data: referenceSources })}\n\n`,
                );
            }

            if (!conversationId && conversationRecord && responseMode === "stream") {
                conversationId = conversationRecord.id;
                res!.write(
                    `data: ${JSON.stringify({ type: "conversation_id", data: conversationId })}\n\n`,
                );
            }

            const { client, requestOpts, modelName } = await this.getAIClient(
                model,
                finalConfig,
                modifiedDto,
            );

            let metadata: MessageMetadata | undefined;
            let tokenUsage: TokenUsage | undefined;
            let rawResponse: AIRawResponse | undefined;

            if (responseMode === "stream") {
                const stream = await client.chat.stream({
                    model: modelName,
                    messages: messages as any,
                    ...requestOpts,
                });

                let reasoningContent = "";
                let reasoningStartTime: number | null = null;

                for await (const chunk of stream) {
                    if (chunk.choices[0].delta.content) {
                        res!.write(
                            `data: ${JSON.stringify({ type: "chunk", data: chunk.choices[0].delta.content })}\n\n`,
                        );
                        fullResponse += chunk.choices[0].delta.content;
                    }

                    if (chunk.choices[0].delta.reasoning_content) {
                        if (!reasoningStartTime) {
                            reasoningStartTime = Date.now();
                        }
                        reasoningContent += chunk.choices[0].delta.reasoning_content;
                        res!.write(
                            `data: ${JSON.stringify({
                                type: "reasoning",
                                data: chunk.choices[0].delta.reasoning_content,
                            })}\n\n`,
                        );
                    }
                }

                const finalChatCompletion = await stream.finalChatCompletion();
                tokenUsage = finalChatCompletion.usage as TokenUsage;
                rawResponse = finalChatCompletion as unknown as AIRawResponse;

                metadata = await this.prepareMessageMetadata(
                    retrievalResults,
                    messages,
                    fullResponse,
                    model,
                    finalConfig,
                    modifiedDto,
                    updatedLastUserMessage,
                );

                if (reasoningContent && reasoningStartTime) {
                    const endTime = Date.now();
                    metadata.reasoning = {
                        content: reasoningContent,
                        startTime: reasoningStartTime,
                        endTime: endTime,
                        duration: endTime - reasoningStartTime,
                    };
                }

                if (dto.saveConversation !== false && conversationId && fullResponse) {
                    await this.saveAssistantMessage(
                        conversationId,
                        agentId,
                        user.id,
                        fullResponse,
                        tokenUsage,
                        rawResponse,
                        metadata,
                        this.isAnonymousUser(user) ? user.id : undefined,
                    );

                    await this.agentChatRecordService.updateChatRecordStats(
                        conversationRecord!.id,
                        conversationRecord!.messageCount + 2,
                        conversationRecord!.totalTokens + (tokenUsage?.total_tokens || 0),
                    );
                }

                await this.deductAgentChatPower(agentInfo, owner, user, model, isPublic);

                if (finalConfig.showContext) {
                    const completeContext = [
                        ...messages,
                        { role: "assistant", content: fullResponse },
                    ];
                    res!.write(
                        `data: ${JSON.stringify({ type: "context", data: completeContext })}\n\n`,
                    );
                }

                if (metadata.suggestions?.length) {
                    res!.write(
                        `data: ${JSON.stringify({ type: "suggestions", data: metadata.suggestions })}\n\n`,
                    );
                }

                res!.write("data: [DONE]\n\n");
                res!.end();
                return;
            } else {
                const response = await client.chat.create({
                    model: modelName,
                    messages: messages as any,
                    ...requestOpts,
                });

                fullResponse = response.choices[0].message.content || "";
                tokenUsage = response.usage as TokenUsage;
                rawResponse = response as unknown as AIRawResponse;

                metadata = await this.prepareMessageMetadata(
                    retrievalResults,
                    messages,
                    fullResponse,
                    model,
                    finalConfig,
                    modifiedDto,
                    updatedLastUserMessage,
                );

                if (dto.saveConversation !== false && conversationRecord) {
                    await this.saveAssistantMessage(
                        conversationRecord.id,
                        agentId,
                        user.id,
                        fullResponse,
                        tokenUsage,
                        rawResponse,
                        metadata,
                        this.isAnonymousUser(user) ? user.id : undefined,
                    );

                    await this.agentChatRecordService.updateChatRecordStats(
                        conversationRecord.id,
                        conversationRecord.messageCount + 2,
                        conversationRecord.totalTokens + (tokenUsage?.total_tokens || 0),
                    );
                }

                // 执行扣费逻辑
                await this.deductAgentChatPower(agentInfo, owner, user, model, isPublic);

                result = {
                    conversationId: conversationRecord?.id || null,
                    response: fullResponse,
                    responseTime: Date.now() - startTime,
                    tokenUsage: this.convertTokenUsage(tokenUsage),
                    suggestions: metadata.suggestions || [],
                };

                if (shouldIncludeReferences && retrievalResults.length > 0) {
                    result.referenceSources = this.convertReferenceSources(metadata.references);
                }

                this.logger.log(`[+] 智能体对话完成: ${agentId}, 耗时: ${result.responseTime}ms`);
                return result;
            }
        } catch (err) {
            this.logger.error(`[!] 智能体对话失败: ${err.message}`, err.stack);

            if (conversationRecord && dto.saveConversation !== false) {
                await this.saveAssistantMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    err.message,
                    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                    err,
                    null,
                    this.isAnonymousUser(user) ? user.id : undefined,
                );
            }

            if (responseMode === "stream") {
                try {
                    res!.write(
                        `data: ${JSON.stringify({
                            type: "error",
                            data: { message: err.message, code: err.code || "INTERNAL_ERROR" },
                        })}\n\n`,
                    );
                    res!.write("data: [DONE]\n\n");
                    res!.end();
                } catch (writeError) {
                    this.logger.error("发送错误信息失败:", writeError);
                    throw HttpExceptionFactory.badRequest(err.message);
                }
                return;
            } else {
                throw HttpExceptionFactory.business("对话处理失败");
            }
        }
    }

    /**
     * 处理自定义回复的快捷指令
     */
    private async handleCustomQuickCommand(
        response: string,
        conversationRecord: AgentChatRecord,
        agentId: string,
        user: UserPlayground,
        dto: AgentChatDto,
        finalConfig: Agent,
        startTime: number,
    ): Promise<AgentChatResponse> {
        const suggestions = await this.generateAutoQuestions(
            [...dto.messages],
            response,
            null,
            finalConfig,
            dto,
        );

        if (conversationRecord && dto.saveConversation !== false) {
            await this.saveAssistantMessage(
                conversationRecord.id,
                agentId,
                user.id,
                response,
                undefined,
                undefined,
                { suggestions },
                this.isAnonymousUser(user) ? user.id : undefined,
            );

            await this.agentChatRecordService.updateChatRecordStats(
                conversationRecord.id,
                conversationRecord.messageCount + 2,
                conversationRecord.totalTokens,
            );
        }

        return {
            conversationId: conversationRecord?.id || null,
            response,
            responseTime: Date.now() - startTime,
            tokenUsage: undefined,
            suggestions,
        };
    }

    /**
     * 处理流式快捷指令响应
     */
    private async handleStreamQuickCommand(
        dto: AgentChatDto,
        conversationId: string,
        conversationRecord: AgentChatRecord,
        agentId: string,
        user: UserPlayground,
        finalConfig: Agent,
        quickCommandResult: QuickCommandResult,
        lastUserMessage: ChatMessage | undefined,
        res: Response,
    ): Promise<void> {
        let suggestions: AgentChatResponse["suggestions"] = [];
        if (dto.saveConversation !== false && conversationRecord) {
            if (!conversationId && conversationRecord) {
                conversationId = conversationRecord.id;
                res.write(
                    `data: ${JSON.stringify({ type: "conversation_id", data: conversationId })}\n\n`,
                );
            }

            if (lastUserMessage) {
                await this.saveUserMessage(
                    conversationId,
                    agentId,
                    user.id,
                    lastUserMessage.content,
                    dto.formVariables,
                    dto.formFieldsInputs,
                    this.isAnonymousUser(user) ? user.id : undefined,
                );
            }

            suggestions = await this.generateAutoQuestions(
                [...dto.messages],
                quickCommandResult.response!,
                null,
                finalConfig,
                dto,
            );

            await this.saveAssistantMessage(
                conversationId,
                agentId,
                user.id,
                quickCommandResult.response!,
                undefined,
                undefined,
                { suggestions },
                this.isAnonymousUser(user) ? user.id : undefined,
            );

            await this.agentChatRecordService.updateChatRecordStats(
                conversationRecord.id,
                conversationRecord.messageCount + 2,
                conversationRecord.totalTokens,
            );
        }

        await StreamUtils.wordStream(quickCommandResult.response!, res, 20);

        const completeContext = [
            ...dto.messages,
            { role: "assistant", content: quickCommandResult.response },
        ];
        res.write(`data: ${JSON.stringify({ type: "context", data: completeContext })}\n\n`);

        if (suggestions.length > 0) {
            res.write(`data: ${JSON.stringify({ type: "suggestions", data: suggestions })}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
    }

    /**
     * 转换Token使用统计格式
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
     * 转换引用来源格式
     */
    private convertReferenceSources(
        references?: AgentReferenceSources[],
    ): AgentChatResponse["referenceSources"] {
        if (!references) return undefined;

        return references.map((ref) => ({
            datasetId: ref.datasetId,
            datasetName: ref.datasetName || "知识库",
            chunks: ref.chunks,
        }));
    }

    /**
     * 扣除智能体对话算力
     * @param agentInfo 智能体信息
     * @param owner 算力扣除的用户
     * @param user 当前操作用户
     * @param model 使用的模型
     * @param isPublic 是否是公开链接访问
     */
    private async deductAgentChatPower(
        agentInfo: Partial<Agent>,
        owner: User,
        user: UserPlayground,
        model: any,
        isPublic: boolean,
    ): Promise<void> {
        if (agentInfo.billingConfig.price && agentInfo.billingConfig.price > 0) {
            try {
                // 计算需要扣除的算力
                const { price } = agentInfo.billingConfig;
                await this.userRepository.manager.transaction(async (entityManager) => {
                    // 计算扣除后的算力，确保不会为负数
                    const newPower = Math.max(0, owner.power - price);
                    // 实际扣除的算力（可能小于powerToDeduct，如果用户算力不足）
                    const actualDeducted = owner.power - newPower;

                    await entityManager.update(User, owner.id, {
                        power: newPower,
                    });

                    // 记录算力变动日志
                    await this.accountLogService.recordWithTransaction(
                        entityManager,
                        owner.id,
                        isPublic
                            ? ACCOUNT_LOG_TYPE.AGENT_GUEST_CHAT_DEC
                            : ACCOUNT_LOG_TYPE.AGENT_CHAT_DEC,
                        ACTION.DEC,
                        actualDeducted,
                        "", // 关联单号
                        null,
                        isPublic
                            ? `游客：${user.username}调用（${model.name}）`
                            : `用户：${user.username}调用（${model.name}）`,
                        {
                            type: ACCOUNT_LOG_SOURCE.AGENT_CHAT,
                            source: agentInfo.id,
                        },
                    );

                    this.logger.debug(
                        `${isPublic ? "游客" : "用户"} ${owner.id} 对话扣除算力 ${actualDeducted} 成功`,
                    );
                });
            } catch (error) {
                this.logger.error(`扣除用户算力失败: ${error.message}`, error.stack);
            }
        }
    }
}
