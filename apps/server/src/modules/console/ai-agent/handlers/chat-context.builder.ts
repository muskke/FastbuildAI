import { getProviderKeyConfig } from "@common/utils/helper.util";
import { KeyConfigService } from "@modules/console/key-manager/services/key-config.service";
import { Injectable, Logger } from "@nestjs/common";
import { ChatCompletionCreateParams } from "openai/resources/index";

import { AiModelService } from "@/modules/console/ai/services/ai-model.service";
import { TextGenerator } from "@/sdk/ai/core/generator/text";
import { getProvider } from "@/sdk/ai/utils/get-provider";

import { AgentChatDto } from "../dto/agent";
import { Agent } from "../entities/agent.entity";
import { ChatMessage, MessageMetadata } from "../interfaces/agent-config.interface";
import {
    ChatContextResult,
    DatasetRetrievalResult,
    IChatContextBuilder,
    ModelInfo,
} from "../interfaces/chat-handlers.interface";

/**
 * 聊天上下文构建器
 * 负责构建聊天上下文、系统提示词和消息处理
 */
@Injectable()
export class ChatContextBuilder implements IChatContextBuilder {
    private readonly logger = new Logger(ChatContextBuilder.name);

    constructor(
        private readonly aiModelService: AiModelService,
        private readonly keyConfigService: KeyConfigService,
    ) {}

    /**
     * 准备聊天上下文
     */
    async prepareChatContext(
        config: Agent,
        dto: AgentChatDto,
        lastUserMessage?: ChatMessage,
    ): Promise<ChatContextResult> {
        // 构建系统提示词
        const systemPrompt = this.buildSystemPrompt(
            config,
            dto.formVariables,
            dto.formFieldsInputs,
        );

        // 获取模型信息
        const model = await this.aiModelService.findOne({
            where: { id: config.modelConfig?.id, isActive: true },
            relations: ["provider"],
        });

        if (!model?.provider || !model.id) {
            throw new Error("模型不存在或未激活");
        }

        // 初始化检索结果
        const retrievalResults: DatasetRetrievalResult[] = [];

        // 构建聊天消息
        const messages = this.buildChatMessages(
            systemPrompt,
            this.limitMessagesByContext(dto.messages as ChatMessage[], model.maxContext),
            retrievalResults,
        );

        return {
            systemPrompt,
            retrievalResults,
            messages,
            model: model as ModelInfo,
        };
    }

    /**
     * 构建系统提示词
     */
    buildSystemPrompt(
        config: Agent,
        formVariables?: Record<string, string>,
        formFieldsInputs?: Record<string, unknown>,
    ): string {
        let prompt = config.rolePrompt || "你是一个有用的AI助手。";

        // 合并变量
        const variables = { ...formVariables, ...formFieldsInputs };

        // 替换变量占位符
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, "g"), value as string);
        }

        return prompt;
    }

    /**
     * 构建聊天消息
     */
    buildChatMessages(
        systemPrompt: string,
        messages: ChatMessage[],
        retrievalResults: DatasetRetrievalResult[],
    ): ChatMessage[] {
        let systemContent = systemPrompt;

        // 添加知识库检索内容
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

    /**
     * 获取AI客户端
     */
    async getAIClient(
        model: ModelInfo,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<{
        client: TextGenerator;
        requestOpts: Record<string, any>;
        modelName: string;
    }> {
        // 获取提供商密钥配置
        const providerKeyConfig = await this.keyConfigService.getConfigKeyValuePairs(
            model.provider.bindKeyConfigId,
        );

        // 创建提供商实例
        const provider = getProvider(model.provider.provider, {
            apiKey: getProviderKeyConfig("apiKey", providerKeyConfig),
            baseURL: getProviderKeyConfig("baseUrl", providerKeyConfig),
        });

        // 创建文本生成器客户端
        const client = new TextGenerator(provider);

        // 合并模型配置
        const modelConfig = {
            ...model.modelConfig,
            ...config.modelConfig?.options,
            ...dto.modelConfig?.options,
        };

        // 提取启用的配置选项
        const requestOpts = Object.entries(modelConfig)
            .filter(([_, value]) => value && typeof value === "object" && (value as any)?.enable)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: (value as any)?.value }), {});

        return {
            client,
            requestOpts,
            modelName: model.model,
        };
    }

    /**
     * 准备消息元数据
     */
    async prepareMessageMetadata(
        retrievalResults: DatasetRetrievalResult[],
        messages: ChatMessage[],
        response: string,
        model: ModelInfo,
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

    /**
     * 生成自动追问问题
     */
    async generateAutoQuestions(
        messages: ChatMessage[],
        response: string,
        model: ModelInfo,
        config: Agent,
        dto: AgentChatDto,
    ): Promise<string[]> {
        if (!dto.autoQuestions?.enabled) {
            return [];
        }

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
            if (!model) {
                return [];
            }

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

    /**
     * 限制消息数量以适应上下文长度
     */
    private limitMessagesByContext(messages: ChatMessage[], maxContext?: number): ChatMessage[] {
        if (!maxContext || messages.length <= maxContext) {
            return messages;
        }
        return messages.slice(-maxContext);
    }

    /**
     * 格式化引用源（临时实现，应该从知识库处理器获取）
     */
    private formatReferenceSources(
        retrievalResults: DatasetRetrievalResult[],
        content: string,
    ): Array<{
        datasetId: string;
        datasetName?: string;
        userContent: string;
        retrievalMode?: string;
        duration?: number;
        chunks: any[];
    }> {
        return retrievalResults.map((result) => ({
            datasetId: result.datasetId,
            datasetName: result.datasetName || "知识库",
            userContent: content,
            retrievalMode: result.retrievalConfig?.retrievalMode,
            duration: result.duration,
            chunks: result.chunks,
        }));
    }
}
