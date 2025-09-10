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
import { getProviderKeyConfig } from "@common/utils/helper.util";
import { StreamUtils } from "@common/utils/stream-utils.util";
import { KeyConfigService } from "@modules/console/key-manager/services/key-config.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import { Repository } from "typeorm";

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
import { BillingStrategy } from "../interfaces/billing-strategy.interface";
import { AgentService } from "./agent.service";
import { AgentAnnotationService } from "./agent-annotation.service";
import { AgentChatRecordService } from "./agent-chat-record.service";

interface DatasetRetrievalResult {
    datasetId: string;
    datasetName: string;
    retrievalConfig: RetrievalConfig;
    chunks: (RetrievalChunk & { datasetId: string; datasetName: string })[];
    duration?: number;
}

interface QuickCommandResult {
    matched: boolean;
    response?: string;
    content?: string;
}

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
        protected readonly keyConfigService: KeyConfigService,
    ) {
        super(chatRecordRepository);
    }

    protected async generateAutoQuestions(
        messages: ChatMessage[],
        response: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<string[]> {
        if (!dto.autoQuestions?.enabled) return [];

        const lastUserMessage =
            messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
        const basePrompt = `你是一个AI助手，根据用户问题和AI回复，生成3个不超过20字的后续问题。要求：与用户问题语义相关，语气一致，引导深入探讨。
用户问题：${lastUserMessage}
AI回复：${response}`;
        const prompt =
            dto.autoQuestions.customRuleEnabled && dto.autoQuestions.customRule
                ? `${basePrompt}\n\n自定义规则：${dto.autoQuestions.customRule}`
                : basePrompt;

        try {
            const { client, requestOpts, modelName } = await this.getAIClient(model, config, dto);
            const response = await client.chat.create({
                model: modelName,
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: "生成3条问题建议" },
                ],
                max_tokens: 100,
                ...requestOpts,
            });

            return response.choices[0].message.content
                .split("\n")
                .filter((q) => q.trim())
                .slice(0, 3)
                .map((q) => q.replace(/^\d+\.\s*/, "").trim());
        } catch (err) {
            this.logger.error(`生成自动追问问题失败: ${err.message}`);
            return [];
        }
    }

    protected handleQuickCommand(
        dto: AgentChatDto,
        lastUserMessage?: ChatMessage,
    ): QuickCommandResult {
        if (!dto.quickCommands?.length || !lastUserMessage) return { matched: false };

        const matchedCommand = dto.quickCommands.find(
            (cmd) => cmd.name.trim() === lastUserMessage.content.trim(),
        );
        if (!matchedCommand) return { matched: false };

        return {
            matched: true,
            response:
                matchedCommand.replyType === "custom" ? matchedCommand.replyContent : undefined,
            content: matchedCommand.replyType === "model" ? matchedCommand.content : undefined,
        };
    }

    protected async prepareMessageMetadata(
        retrievalResults: DatasetRetrievalResult[],
        messages: ChatMessage[],
        response: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
        lastUserMessage?: ChatMessage,
    ): Promise<MessageMetadata> {
        return {
            references:
                retrievalResults.length > 0
                    ? this.formatReferenceSources(retrievalResults, lastUserMessage?.content || "")
                    : undefined,
            context: messages,
            suggestions: await this.generateAutoQuestions(messages, response, model, config, dto),
        };
    }

    protected isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }

    protected async initializeChat(
        agentId: string,
        dto: AgentChatDto,
        user: UserPlayground,
    ): Promise<{ agent: Agent; finalConfig: Agent; conversationRecord: AgentChatRecord | null }> {
        const agent = await this.agentService.getAgentDetail(agentId);
        if (!agent) throw HttpExceptionFactory.notFound("智能体不存在");

        const finalConfig = this.mergeConfigurations(agent, dto);
        let conversationRecord: AgentChatRecord | null = null;

        if (dto.conversationId) {
            conversationRecord = await this.agentChatRecordService.getChatRecordDetail(
                dto.conversationId,
                user,
            );
        } else if (dto.saveConversation !== false) {
            const title = this.generateConversationTitle(dto.messages[0]?.content || "新对话");
            conversationRecord = await this.agentChatRecordService.createChatRecord(
                agentId,
                this.isAnonymousUser(user) ? undefined : user.id,
                title,
                this.isAnonymousUser(user) ? user.id : undefined,
            );
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
        }
    }

    protected async prepareChatContext(
        config: Agent,
        dto: AgentChatDto,
        lastUserMessage?: ChatMessage,
    ): Promise<{
        systemPrompt: string;
        retrievalResults: DatasetRetrievalResult[];
        messages: ChatMessage[];
        model: any;
    }> {
        const systemPrompt = this.buildSystemPrompt(
            config,
            dto.formVariables,
            dto.formFieldsInputs,
        );
        const model = await this.aiModelService.findOne({
            where: { id: config.modelConfig?.id, isActive: true },
            relations: ["provider"],
        });
        if (!model?.provider) throw new Error("模型不存在或未激活");

        let retrievalResults: DatasetRetrievalResult[] = [];
        if (
            config.datasetIds?.length &&
            lastUserMessage &&
            (await this.shouldPerformRetrieval(lastUserMessage.content, model, config, dto))
        ) {
            retrievalResults = await this.performKnowledgeRetrieval(
                config.datasetIds,
                lastUserMessage.content,
            );
        }

        const messages = this.buildChatMessages(
            systemPrompt,
            this.limitMessagesByContext(dto.messages as ChatMessage[], model.maxContext),
            retrievalResults,
        );
        return { systemPrompt, retrievalResults, messages, model };
    }

    protected async getAIClient(model: any, config: Agent, dto: AgentChatDto) {
        const providerKeyConfig = await this.keyConfigService.getConfigKeyValuePairs(
            model.provider.bindKeyConfigId,
        );
        const provider = getProvider(model.provider.provider, {
            apiKey: getProviderKeyConfig("apiKey", providerKeyConfig),
            baseURL: getProviderKeyConfig("baseUrl", providerKeyConfig),
        });
        const client = new TextGenerator(provider);

        const modelConfig = {
            ...model.modelConfig,
            ...config.modelConfig?.options,
            ...dto.modelConfig?.options,
        };
        const requestOpts = Object.entries(modelConfig)
            .filter(([_, value]) => value && typeof value === "object" && (value as any)?.enable)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: (value as any)?.value }), {});

        return { client, requestOpts, modelName: model.model };
    }

    protected buildChatMessages(
        systemPrompt: string,
        messages: ChatMessage[],
        retrievalResults: DatasetRetrievalResult[],
    ): ChatMessage[] {
        let systemContent = systemPrompt;
        if (retrievalResults.length) {
            systemContent +=
                "\n\n参考知识库内容：\n" +
                retrievalResults
                    .flatMap((result, i) =>
                        result.chunks.map((chunk, j) => `[参考${i + 1}.${j + 1}] ${chunk.content}`),
                    )
                    .join("\n");
        }
        return [{ role: "system", content: systemContent }, ...messages];
    }

    protected async performKnowledgeRetrieval(
        datasetIds: string[],
        query: string,
    ): Promise<DatasetRetrievalResult[]> {
        const results = await Promise.all(
            datasetIds.map(async (datasetId) => {
                const startTime = Date.now();
                const dataset = await this.getDatasetConfig(datasetId);
                if (!dataset) return null;
                const result = await this.datasetsRetrievalService.queryDatasetWithConfig(
                    datasetId,
                    query,
                    dataset.retrievalConfig,
                );
                if (!result.chunks?.length) return null;
                return {
                    datasetId,
                    datasetName: dataset.name,
                    retrievalConfig: dataset.retrievalConfig,
                    chunks: result.chunks,
                    duration: Date.now() - startTime,
                };
            }),
        );
        return results.filter(Boolean) as DatasetRetrievalResult[];
    }

    protected buildSystemPrompt(
        config: Agent,
        formVariables?: Record<string, string>,
        formFieldsInputs?: Record<string, unknown>,
    ): string {
        let prompt = config.rolePrompt || "你是一个有用的AI助手。";
        const variables = { ...formVariables, ...formFieldsInputs };
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, "g"), value as string);
        }
        return prompt;
    }

    protected formatReferenceSources(
        retrievalResults: DatasetRetrievalResult[],
        content: string,
    ): AgentReferenceSources[] {
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
        if (!maxContext || messages.length <= maxContext) return messages;
        return messages.slice(-maxContext);
    }

    protected mergeConfigurations(agent: Agent, dto: AgentChatDto): Agent {
        // 直接修改原对象，保持实体方法完整性
        agent.modelConfig = dto.modelConfig ?? agent.modelConfig;
        agent.datasetIds = dto.datasetIds ?? agent.datasetIds;
        agent.rolePrompt = dto.rolePrompt ?? agent.rolePrompt;
        agent.showContext = dto.showContext ?? agent.showContext;
        agent.showReference = dto.showReference ?? agent.showReference;
        agent.enableFeedback = dto.enableFeedback ?? agent.enableFeedback;
        agent.enableWebSearch = dto.enableWebSearch ?? agent.enableWebSearch;
        agent.autoQuestions = dto.autoQuestions ?? agent.autoQuestions;

        return agent;
    }

    protected async shouldPerformRetrieval(
        userQuery: string,
        model: any,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<boolean> {
        if (
            !config.datasetIds?.length ||
            /^(你好|hello|hi|哈喽|嗨|谢谢|thank you|thanks|再见|goodbye|bye|没事|没关系|不用了|ok|好的|嗯|哦)$/i.test(
                userQuery.trim(),
            )
        ) {
            return false;
        }

        const preSearchResults = await this.performPreSearch(config.datasetIds, userQuery);
        if (!preSearchResults.length) return true;

        const { client, requestOpts, modelName } = await this.getAIClient(model, config, dto);
        const chunksContent = preSearchResults
            .slice(0, 3)
            .map((chunk, i) => `[片段${i + 1}] ${chunk.content.substring(0, 200)}...`)
            .join("\n\n");
        const judgmentPrompt = `你是一个智能检索助手。你的唯一任务是：根据用户问题和预检索结果，判断是否需要进一步的「完整知识库检索」。
【输入】
用户问题：${userQuery}
预检索结果：${chunksContent}  

【决策规则（进取模式）】
- 若预检索结果与问题“高度相关” → {"need_retrieval": true, "reason": "预检索结果高度相关，执行完整检索以补充证据/覆盖面"}
- 若预检索结果“相关但可能不够全面或不够精确” → {"need_retrieval": true, "reason": "相关但可能不完整，需更精确检索"}
- 若预检索结果“不相关 / 仅为闲聊问候” → {"need_retrieval": false, "reason": "与知识库无关或无有效线索"}

【强约束】
- 严格只输出一个 JSON 对象，不得包含任何额外文本。
- 不得把“只需返回 JSON”“格式要求”“用户仅要求返回 JSON”等当作理由。
- 不引用本提示本身或输出格式作为理由。
- 若无法确定，默认 {"need_retrieval": true, "reason": "默认进取策略：不确定时执行完整检索"}。

【输出格式】
{"need_retrieval": true/false, "reason": "原因说明（不超过 10 字）"}`;

        try {
            const response = await client.chat.create({
                model: modelName,
                messages: [
                    { role: "system", content: judgmentPrompt },
                    { role: "user", content: "返回JSON格式结果" },
                ],
                max_tokens: 150,
                temperature: 0.1,
                ...requestOpts,
            });

            console.log("judgmentPrompt", judgmentPrompt);
            console.log("知识库向量检索判断", JSON.stringify(response));

            const content = response.choices[0].message.content?.trim() || "";
            const result = JSON.parse(content.match(/\{[^}]+\}/)?.[0] || "{}");
            return result.need_retrieval ?? true;
        } catch {
            return true;
        }
    }

    private async performPreSearch(datasetIds: string[], query: string): Promise<RetrievalChunk[]> {
        const results = await Promise.all(
            datasetIds.map(async (datasetId) => {
                const dataset = await this.getDatasetConfig(datasetId);
                if (!dataset) return [];
                const result = await this.datasetsRetrievalService.queryDatasetWithConfig(
                    datasetId,
                    query,
                    {
                        retrievalMode: "vector",
                        topK: 3,
                        scoreThreshold: 0.3,
                        scoreThresholdEnabled: false,
                    },
                );
                return result.chunks || [];
            }),
        );
        return results
            .flat()
            .filter((chunk, i, arr) => arr.findIndex((c) => c.id === chunk.id) === i)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    protected async getDatasetConfig(
        datasetId: string,
    ): Promise<{ id: string; name: string; retrievalConfig: RetrievalConfig } | null> {
        try {
            const dataset = await this.datasetsService.findOneById(datasetId);
            return dataset
                ? { id: dataset.id, name: dataset.name, retrievalConfig: dataset.retrievalConfig }
                : null;
        } catch (err) {
            this.logger.error(`获取知识库配置失败: ${err.message}`);
            return null;
        }
    }
}

@Injectable()
export class AgentChatService extends BaseAgentChatService {
    constructor(
        @InjectRepository(AgentChatRecord) chatRecordRepository: Repository<AgentChatRecord>,
        @InjectRepository(AgentChatMessage) chatMessageRepository: Repository<AgentChatMessage>,
        @InjectRepository(Agent) agentRepository: Repository<Agent>,
        @InjectRepository(User) userRepository: Repository<User>,
        agentService: AgentService,
        agentChatRecordService: AgentChatRecordService,
        datasetsRetrievalService: DatasetsRetrievalService,
        datasetsService: DatasetsService,
        aiModelService: AiModelService,
        agentAnnotationService: AgentAnnotationService,
        accountLogService: AccountLogService,
        keyConfigService: KeyConfigService,
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
            keyConfigService,
        );
    }

    async handleChat(
        agentId: string,
        dto: AgentChatDto,
        user: UserPlayground,
        responseMode: "blocking" | "streaming",
        billingStrategy: BillingStrategy,
        res?: Response,
    ): Promise<AgentChatResponse | void> {
        if (responseMode === "streaming" && !res)
            throw new Error("Streaming mode requires response object");
        if (responseMode === "streaming") {
            res!.setHeader("Content-Type", "text/event-stream");
            res!.setHeader("Cache-Control", "no-cache");
            res!.setHeader("Connection", "keep-alive");
            res!.setHeader("Access-Control-Allow-Origin", "*");
            res!.setHeader("Access-Control-Allow-Headers", "Cache-Control");
        }

        const agentInfo = await this.agentService.findOneById(agentId);
        if (!agentInfo) throw HttpExceptionFactory.notFound("智能体不存在");

        const startTime = Date.now();
        const { finalConfig, conversationRecord } = await this.initializeChat(agentId, dto, user);
        let conversationId = conversationRecord?.id || dto.conversationId;
        const lastUserMessage = dto.messages.filter((m) => m.role === "user").slice(-1)[0] as
            | ChatMessage
            | undefined;
        const isAnonymous = this.isAnonymousUser(user);

        if (lastUserMessage && conversationRecord && dto.saveConversation !== false) {
            await this.saveUserMessage(
                conversationId!,
                agentId,
                user.id,
                lastUserMessage.content,
                dto.formVariables,
                dto.formFieldsInputs,
                isAnonymous ? user.id : undefined,
            );
        }

        const quickCommandResult = this.handleQuickCommand(dto, lastUserMessage);
        if (quickCommandResult.matched && quickCommandResult.response) {
            return await this.handleQuickCommandResponse(
                quickCommandResult.response,
                conversationRecord,
                agentId,
                user,
                dto,
                finalConfig,
                startTime,
                responseMode,
                res,
            );
        }

        const modifiedDto =
            quickCommandResult.matched && quickCommandResult.content
                ? {
                      ...dto,
                      messages: [
                          ...dto.messages.slice(0, -1),
                          { role: "user" as const, content: quickCommandResult.content },
                      ],
                  }
                : dto;
        const updatedLastUserMessage = quickCommandResult.content || lastUserMessage;

        const annotationMatch = updatedLastUserMessage
            ? await this.agentAnnotationService.matchUserQuestion(
                  agentId,
                  typeof updatedLastUserMessage === "string"
                      ? updatedLastUserMessage
                      : updatedLastUserMessage.content,
              )
            : { matched: false };
        if (annotationMatch.matched && annotationMatch.annotation) {
            return await this.handleAnnotationResponse(
                annotationMatch.annotation,
                conversationRecord,
                agentId,
                user,
                modifiedDto,
                finalConfig,
                startTime,
                responseMode,
                res,
            );
        }

        const { messages, retrievalResults, model } = await this.prepareChatContext(
            finalConfig,
            modifiedDto,
            typeof updatedLastUserMessage === "string"
                ? { role: "user" as const, content: updatedLastUserMessage }
                : updatedLastUserMessage,
        );
        const shouldIncludeReferences = modifiedDto.includeReferences ?? finalConfig.showReference;
        const { client, requestOpts, modelName } = await this.getAIClient(
            model,
            finalConfig,
            modifiedDto,
        );

        try {
            if (responseMode === "streaming") {
                if (shouldIncludeReferences && retrievalResults.length) {
                    res!.write(
                        `data: ${JSON.stringify({ type: "references", data: this.formatReferenceSources(retrievalResults, typeof updatedLastUserMessage === "string" ? updatedLastUserMessage : updatedLastUserMessage?.content || "") })}\n\n`,
                    );
                }
                if (conversationId && !dto.conversationId) {
                    res!.write(
                        `data: ${JSON.stringify({ type: "conversation_id", data: conversationId })}\n\n`,
                    );
                }
            }

            // 在发起AI对话之前检查算力
            const billingResult = await billingStrategy.determineBillTo(
                agentInfo as Agent,
                user,
                this.userRepository,
            );

            if (
                billingResult.billToUser &&
                agentInfo.billingConfig?.price > billingResult.billToUser.power
            ) {
                throw HttpExceptionFactory.forbidden(`${billingResult.billingContext}不足，请充值`);
            }

            if (responseMode === "streaming") {
                let fullResponse = "";
                let tokenUsage: TokenUsage | undefined;
                let reasoningContent = "";
                let reasoningStartTime: number | null = null;

                const stream = await client.chat.stream({
                    model: modelName,
                    messages: messages as ChatMessage[],
                    ...requestOpts,
                });
                for await (const chunk of stream) {
                    if (chunk.choices[0].delta.content) {
                        fullResponse += chunk.choices[0].delta.content;
                        res!.write(
                            `data: ${JSON.stringify({ type: "chunk", data: chunk.choices[0].delta.content })}\n\n`,
                        );
                    }
                    if (chunk.choices[0].delta.reasoning_content) {
                        reasoningContent += chunk.choices[0].delta.reasoning_content;
                        if (!reasoningStartTime) reasoningStartTime = Date.now();
                        res!.write(
                            `data: ${JSON.stringify({ type: "reasoning", data: chunk.choices[0].delta.reasoning_content })}\n\n`,
                        );
                    }
                }

                const finalChatCompletion = await stream.finalChatCompletion();
                tokenUsage = finalChatCompletion.usage as TokenUsage;
                const metadata = await this.prepareMessageMetadata(
                    retrievalResults,
                    messages,
                    fullResponse,
                    model,
                    finalConfig,
                    modifiedDto,
                    typeof updatedLastUserMessage === "string"
                        ? { role: "user" as const, content: updatedLastUserMessage }
                        : updatedLastUserMessage,
                );
                if (reasoningContent && reasoningStartTime) {
                    metadata.reasoning = {
                        content: reasoningContent,
                        startTime: reasoningStartTime,
                        endTime: Date.now(),
                        duration: Date.now() - reasoningStartTime,
                    };
                }

                if (dto.saveConversation !== false && conversationId) {
                    await this.saveAssistantMessage(
                        conversationId,
                        agentId,
                        user.id,
                        fullResponse,
                        tokenUsage,
                        finalChatCompletion as unknown as AIRawResponse,
                        metadata,
                        isAnonymous ? user.id : undefined,
                    );
                    await this.agentChatRecordService.updateChatRecordStats(
                        conversationId,
                        conversationRecord!.messageCount + 2,
                        conversationRecord!.totalTokens + (tokenUsage?.total_tokens || 0),
                    );
                }

                await this.deductAgentChatPower(
                    agentInfo,
                    billingResult.billToUser,
                    user,
                    model,
                    conversationRecord,
                );
                if (finalConfig.showContext) {
                    res!.write(
                        `data: ${JSON.stringify({ type: "context", data: [...messages, { role: "assistant", content: fullResponse }] })}\n\n`,
                    );
                }
                if (metadata.suggestions?.length) {
                    res!.write(
                        `data: ${JSON.stringify({ type: "suggestions", data: metadata.suggestions })}\n\n`,
                    );
                }
                res!.write("data: [DONE]\n\n");
                res!.end();
            } else {
                const response = await client.chat.create({
                    model: modelName,
                    messages: messages as ChatMessage[],
                    ...requestOpts,
                });
                const fullResponse = response.choices[0].message.content || "";
                const tokenUsage = response.usage as TokenUsage;
                const metadata = await this.prepareMessageMetadata(
                    retrievalResults,
                    messages,
                    fullResponse,
                    model,
                    finalConfig,
                    modifiedDto,
                    typeof updatedLastUserMessage === "string"
                        ? { role: "user" as const, content: updatedLastUserMessage }
                        : updatedLastUserMessage,
                );

                if (dto.saveConversation !== false && conversationRecord) {
                    await this.saveAssistantMessage(
                        conversationRecord.id,
                        agentId,
                        user.id,
                        fullResponse,
                        tokenUsage,
                        response as unknown as AIRawResponse,
                        metadata,
                        isAnonymous ? user.id : undefined,
                    );
                    await this.agentChatRecordService.updateChatRecordStats(
                        conversationRecord.id,
                        conversationRecord.messageCount + 2,
                        conversationRecord.totalTokens + (tokenUsage?.total_tokens || 0),
                    );
                }

                await this.deductAgentChatPower(
                    agentInfo,
                    billingResult.billToUser,
                    user,
                    model,
                    conversationRecord,
                );
                const result: AgentChatResponse = {
                    conversationId: conversationRecord?.id || null,
                    response: fullResponse,
                    responseTime: Date.now() - startTime,
                    tokenUsage: this.convertTokenUsage(tokenUsage),
                    suggestions: metadata.suggestions || [],
                };
                if (shouldIncludeReferences && retrievalResults.length) {
                    result.referenceSources = this.convertReferenceSources(metadata.references);
                }
                return result;
            }
        } catch (err) {
            this.logger.error(`智能体对话失败: ${err.message}`);
            if (conversationRecord && dto.saveConversation !== false) {
                await this.saveAssistantMessage(
                    conversationRecord.id,
                    agentId,
                    user.id,
                    err.message,
                    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                    err,
                    null,
                    isAnonymous ? user.id : undefined,
                );
            }
            if (responseMode === "streaming") {
                res!.write(
                    `data: ${JSON.stringify({ type: "error", data: { message: err.message, code: err.code || "INTERNAL_ERROR" } })}\n\n`,
                );
                res!.write("data: [DONE]\n\n");
                res!.end();
            } else {
                throw HttpExceptionFactory.business("对话处理失败");
            }
        }
    }

    private async handleQuickCommandResponse(
        response: string,
        conversationRecord: AgentChatRecord | null,
        agentId: string,
        user: UserPlayground,
        dto: AgentChatDto,
        finalConfig: Agent,
        startTime: number,
        responseMode: "blocking" | "streaming",
        res?: Response,
    ): Promise<AgentChatResponse | void> {
        const suggestions = await this.generateAutoQuestions(
            [...dto.messages],
            response,
            null,
            finalConfig,
            dto,
        );
        const isAnonymous = this.isAnonymousUser(user);

        if (conversationRecord && dto.saveConversation !== false) {
            await this.saveAssistantMessage(
                conversationRecord.id,
                agentId,
                user.id,
                response,
                undefined,
                undefined,
                { suggestions },
                isAnonymous ? user.id : undefined,
            );
            await this.agentChatRecordService.updateChatRecordStats(
                conversationRecord.id,
                conversationRecord.messageCount + 2,
                conversationRecord.totalTokens,
            );
        }

        if (responseMode === "streaming") {
            if (conversationRecord && !dto.conversationId) {
                res!.write(
                    `data: ${JSON.stringify({ type: "conversation_id", data: conversationRecord.id })}\n\n`,
                );
            }
            await StreamUtils.autoStream(response, res!, { speed: 100 });
            res!.write(
                `data: ${JSON.stringify({ type: "context", data: [...dto.messages, { role: "assistant", content: response }] })}\n\n`,
            );
            if (suggestions.length) {
                res!.write(
                    `data: ${JSON.stringify({ type: "suggestions", data: suggestions })}\n\n`,
                );
            }
            res!.write("data: [DONE]\n\n");
            res!.end();
        } else {
            return {
                conversationId: conversationRecord?.id || null,
                response,
                responseTime: Date.now() - startTime,
                tokenUsage: undefined,
                suggestions,
            };
        }
    }

    private async handleAnnotationResponse(
        annotation: any,
        conversationRecord: AgentChatRecord | null,
        agentId: string,
        user: UserPlayground,
        dto: AgentChatDto,
        finalConfig: Agent,
        startTime: number,
        responseMode: "blocking" | "streaming",
        res?: Response,
    ): Promise<AgentChatResponse | void> {
        const isAnonymous = this.isAnonymousUser(user);
        const annotations = {
            annotationId: annotation.id,
            question: annotation.question,
            similarity: annotation.similarity || 1.0,
            createdBy: annotation.user?.nickname || annotation.user?.username || "未知用户",
        };

        if (conversationRecord && dto.saveConversation !== false) {
            await this.saveAssistantMessage(
                conversationRecord.id,
                agentId,
                user.id,
                annotation.answer,
                undefined,
                undefined,
                { context: dto.messages, annotations },
                isAnonymous ? user.id : undefined,
            );
            await this.agentChatRecordService.updateChatRecordStats(
                conversationRecord.id,
                conversationRecord.messageCount + 2,
                conversationRecord.totalTokens,
            );
        }

        if (responseMode === "streaming") {
            if (conversationRecord && !dto.conversationId) {
                res!.write(
                    `data: ${JSON.stringify({ type: "conversation_id", data: conversationRecord.id })}\n\n`,
                );
            }
            await StreamUtils.autoStream(annotation.answer, res!, { speed: 100 });
            res!.write(
                `data: ${JSON.stringify({ type: "context", data: [...dto.messages, { role: "assistant", content: annotation.answer }] })}\n\n`,
            );
            res!.write(`data: ${JSON.stringify({ type: "annotations", data: annotations })}\n\n`);
            res!.write("data: [DONE]\n\n");
            res!.end();
        } else {
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

    private async deductAgentChatPower(
        agentInfo: Partial<Agent>,
        billToUser: User | null,
        user: UserPlayground,
        model: any,
        conversationRecord?: AgentChatRecord | null,
    ): Promise<void> {
        if (!billToUser || !agentInfo.billingConfig?.price) return;

        try {
            await this.userRepository.manager.transaction(async (entityManager) => {
                const newPower = Math.max(0, billToUser.power - agentInfo.billingConfig.price);
                const actualDeducted = billToUser.power - newPower;

                await entityManager.update(User, billToUser.id, { power: newPower });
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    billToUser.id,
                    this.isAnonymousUser(user)
                        ? ACCOUNT_LOG_TYPE.AGENT_GUEST_CHAT_DEC
                        : ACCOUNT_LOG_TYPE.AGENT_CHAT_DEC,
                    ACTION.DEC,
                    actualDeducted,
                    "",
                    null,
                    `${this.isAnonymousUser(user) ? "匿名用户" : "用户"}：${user.username} 调用${agentInfo.name}智能体对话`,
                    { type: ACCOUNT_LOG_SOURCE.AGENT_CHAT, source: agentInfo.id },
                );

                if (conversationRecord && actualDeducted > 0) {
                    await this.agentChatRecordService.incrementConsumedPower(
                        conversationRecord.id,
                        actualDeducted,
                    );
                }
            });
        } catch (error) {
            this.logger.error(`扣除用户算力失败: ${error.message}`);
        }
    }
}
