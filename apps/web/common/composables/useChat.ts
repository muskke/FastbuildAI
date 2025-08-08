import type { ChatStreamChunk, ChatStreamConfig, McpCallChunk } from "@fastbuildai/http";

import type { AiMessage } from "@/models/ai-conversation";
import type { McpToolCall } from "@/models/mcp-server";
import { apiChatStream } from "@/services/web/ai-conversation";

import { uuid } from "../utils/helper";

/**
 * 聊天配置接口
 */
export interface ChatConfig {
    /** AI助手头像 */
    avatar?: string;
    /** 其他可扩展的配置项 */
    [key: string]: any;
}

/**
 * useChat 配置选项
 */
export interface UseChatOptions {
    /** 聊天ID */
    id?: string;
    /** API函数 - 用于发送聊天请求的函数 */
    api?: (
        messages: AiMessage[],
        config?: Partial<ChatStreamConfig>,
    ) => Promise<{ abort: () => void }>;
    /** 初始消息列表 */
    initialMessages?: AiMessage[];
    /** 请求体额外数据 */
    body?: Record<string, any>;
    /** mcp调用 */
    onToolCall?: (message: McpToolCall) => void;
    /** 响应回调 */
    onResponse?: (response: any) => void | Promise<void>;
    /** 更新回调 */
    onUpdate?: (chunk: ChatStreamChunk) => void;
    /** 错误回调 */
    onError?: (error: Error) => void;
    /** 完成回调 */
    onFinish?: (message: AiMessage) => void;
    /** 聊天配置 */
    chatConfig?: ChatConfig;
}

/**
 * 聊天状态类型
 */
export type ChatStatus = "idle" | "loading" | "error" | "completed";

/**
 * useChat 返回值
 */
export interface UseChatReturn {
    /** 消息列表 */
    messages: Ref<AiMessage[]>;
    /** 输入框值 */
    input: Ref<string>;
    /** 当前状态 */
    status: Ref<ChatStatus>;
    /** 错误信息 */
    error: Ref<Error | null>;
    /** 提交消息 */
    handleSubmit: (event?: Event | string) => Promise<void>;
    /** 重新加载最后一条消息 */
    reload: () => Promise<void>;
    /** 停止生成 */
    stop: () => void;
    /** 设置消息 */
    setMessages: (messages: AiMessage[]) => void;
    /** 追加消息 */
    append: (message: AiMessage) => Promise<void>;
}

/**
 * 聊天 Composable
 *
 * 类似 @ai-sdk/vue 的 useChat，但使用自定义的 apiChatStream
 *
 * @param options 配置选项
 * @returns 聊天状态和方法
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const {
        id,
        api,
        initialMessages = [],
        body = {},
        onResponse,
        onUpdate,
        onError,
        onFinish,
        onToolCall,
        chatConfig,
    } = options;
    // 响应式状态
    const messages = ref<AiMessage[]>([...initialMessages]);
    const input = ref<string>("");
    const status = ref<ChatStatus>("idle");
    const error = ref<Error | null>(null);
    const streamController = ref<{ abort: () => void } | null>(null);

    // 将 chatConfig 转换为响应式，确保 chatConfig 配置能够动态更新
    const reactiveChatConfig = computed(() => chatConfig || {});

    /**
     * 生成唯一ID
     */
    function generateId(): string {
        return uuid();
    }

    /**
     * 设置消息列表
     */
    function setMessages(newMessages: AiMessage[]): void {
        messages.value = [...newMessages];
    }

    /**
     * 追加消息
     */
    async function append(message: AiMessage): Promise<void> {
        const messageWithId = {
            id: generateId(),
            ...message,
        };

        messages.value.push(messageWithId);

        // 如果是用户消息，触发AI响应
        if (message.role === "user") {
            await generateAIResponse();
        }
    }

    /**
     * 生成AI响应
     */
    async function generateAIResponse(): Promise<void> {
        if (status.value === "loading") return;

        status.value = "loading";
        error.value = null;
        // 创建AI消息占位符，使用响应式的 avatar
        const aiMessage: AiMessage = {
            id: generateId(),
            role: "assistant",
            content: "",
            status: "loading",
            mcpToolCalls: [],
            avatar: reactiveChatConfig.value.avatar,
        };

        messages.value.push(aiMessage);

        try {
            // 转换消息格式为 ChatMessage
            const chatMessages: AiMessage[] = messages.value
                .slice(0, -1) // 排除刚添加的AI消息占位符
                .map((msg) => ({
                    role: msg.role as "user" | "assistant" | "system",
                    content: msg.content,
                }));

            // 使用自定义API函数或默认的 apiChatStream
            const chatApi = api || apiChatStream;

            // 解包所有响应式对象，避免循环引用
            const resolvedBody = JSON.parse(
                JSON.stringify({
                    ...body,
                    // 确保getter属性被正确求值
                    modelId: body.modelId,
                    conversationId: body.conversationId,
                }),
            );

            streamController.value = await chatApi(chatMessages, {
                body: resolvedBody,
                onResponse,
                onUpdate(chunk) {
                    // 更新AI消息内容
                    if (chunk.delta) {
                        aiMessage.content += chunk.delta;
                        aiMessage.status = "active";
                        // 触发响应式更新
                        messages.value = [...messages.value];
                    }

                    // 处理元数据（上下文、引用来源、建议等）
                    if (chunk.type === "metadata" && chunk.metadata) {
                        // 初始化 metadata 对象
                        if (!aiMessage.metadata) {
                            aiMessage.metadata = {};
                        }

                        // 根据元数据类型处理
                        switch (chunk.metadata.type) {
                            case "context":
                                // 保存对话上下文
                                aiMessage.metadata.context = chunk.metadata.data;
                                break;
                            case "references":
                                // 保存引用来源
                                aiMessage.metadata.references = chunk.metadata.data;
                                break;
                            case "suggestions":
                                // 保存建议
                                aiMessage.metadata.suggestions = chunk.metadata.data;
                                break;
                            case "tokenUsage":
                                // 保存Token使用情况
                                aiMessage.metadata.tokenUsage = chunk.metadata.data;
                                break;
                            case "conversation_id":
                                // 保存对话ID
                                onUpdate?.({
                                    type: "conversation_id",
                                    data: chunk.metadata.data,
                                } as ChatStreamChunk);
                                break;
                            case "annotations":
                                // 保存标注
                                aiMessage.metadata.annotations = chunk.metadata.data;
                                break;
                            default:
                                // 保存其他类型的元数据
                                aiMessage.metadata[chunk.metadata.type] = chunk.metadata.data;
                        }
                        // 触发响应式更新
                        messages.value = [...messages.value];
                    }
                },
                onToolCall(chunk: McpCallChunk<McpToolCall>) {
                    const newCall = chunk.data;
                    aiMessage.status = "active";

                    if (!aiMessage.mcpToolCalls) {
                        aiMessage.mcpToolCalls = [];
                    }

                    const index = aiMessage.mcpToolCalls.findIndex(
                        (item) => item.id === newCall.id,
                    );

                    if (index !== -1) {
                        // 如果存在，覆盖原来的
                        aiMessage.mcpToolCalls[index] = newCall;
                    } else {
                        // 不存在则添加
                        aiMessage.mcpToolCalls.push(newCall);
                    }

                    // 回调
                    onToolCall?.(newCall);

                    // 触发更新
                    messages.value = [...messages.value];
                },
                onFinish(message) {
                    aiMessage.status = "completed";
                    aiMessage.content = message.content || aiMessage.content;
                    messages.value = [...messages.value];
                    streamController.value = null;
                    status.value = "idle";
                    onFinish?.(aiMessage);
                },
                onError(err) {
                    if (err.message === "BodyStreamBuffer was aborted") {
                        aiMessage.status = "completed";
                        status.value = "idle";
                        return;
                    }
                    aiMessage.status = "failed";
                    aiMessage.content = err.message || aiMessage.content;
                    messages.value = [...messages.value];
                    streamController.value = null;
                    status.value = "error";
                    error.value = err;
                    onError?.(err);
                },
            });
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            aiMessage.status = "failed";
            messages.value = [...messages.value];
            streamController.value = null;
            status.value = "error";
            error.value = errorObj;
            onError?.(errorObj);
        }
    }

    /**
     * 提交消息
     */
    async function handleSubmit(event?: Event | string): Promise<void> {
        // 如果传入的是事件，阻止默认行为
        if (event && typeof event === "object" && "preventDefault" in event) {
            event.preventDefault();
        }

        const content = typeof event === "string" ? event : input.value.trim();

        if (!content || status.value === "loading") return;

        // 清空输入框
        input.value = "";

        // 添加用户消息
        await append({
            id: generateId(),
            role: "user",
            content,
            status: "completed",
            mcpToolCalls: [],
        });
    }

    /**
     * 重新加载最后一条消息
     */
    async function reload(): Promise<void> {
        if (messages.value.length === 0) return;

        // 重置状态，确保重试时能正常执行
        status.value = "idle";
        error.value = null;

        // 找到最后一条用户消息
        const lastUserMessageIndex = messages.value
            .map((msg, index) => ({ msg, index }))
            .reverse()
            .find(({ msg }) => msg.role === "user")?.index;

        if (lastUserMessageIndex === undefined) return;

        // 移除最后一条用户消息之后的所有消息
        messages.value = messages.value.slice(0, lastUserMessageIndex + 1);

        // 重新生成AI响应
        await generateAIResponse();
    }

    /**
     * 停止生成
     */
    function stop(): void {
        if (streamController.value) {
            streamController.value.abort();
            streamController.value = null;
            status.value = "completed";

            // 更新最后一条消息状态为完成
            const lastMessage = messages.value[messages.value.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.status = "completed";
                messages.value = [...messages.value];
            }
        }
    }

    // 组件卸载时清理
    onUnmounted(() => {
        stop();
    });

    return {
        messages,
        input,
        status,
        error,
        handleSubmit,
        reload,
        stop,
        setMessages,
        append,
    };
}
