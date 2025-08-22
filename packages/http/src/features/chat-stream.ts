import {
    ChatStreamConfig,
    ChatStreamChunk,
    ChatMessage,
    ExtendedFetchOptions,
    McpCallChunk,
    McpCallType,
} from "../types";
import { InterceptorManager } from "../core/interceptor-manager";
import { McpToolCall } from "@/models/mcp-server";

/**
 * 聊天流处理器
 * 负责处理流式聊天请求
 */
export class ChatStream {
    constructor(
        private getBaseURL: () => string,
        private interceptorManager: InterceptorManager,
    ) {}

    /**
     * 创建聊天流连接
     * @param url 聊天API端点 URL
     * @param config 聊天配置选项
     * @returns 包含控制方法的聊天控制器
     */
    async create(url: string, config: ChatStreamConfig): Promise<{ abort: () => void }> {
        const {
            messages,
            body = {},
            onResponse,
            onToolCall,
            onUpdate,
            onFinish,
            onError,
            generateId = () => uuid(),
            headers = {},
            ...restOptions
        } = config;

        // 创建取消控制器
        const abortController = new AbortController();
        let isAborted = false;

        // 构建请求体
        const requestBody = {
            messages,
            ...body,
        };

        // 创建控制器对象（立即返回）
        const controller = {
            abort: () => {
                isAborted = true;
                abortController.abort();
            },
        };

        // 异步处理流，不阻塞控制器返回
        (async () => {
            try {
                // 执行请求拦截器
                const processedConfig = await this.interceptorManager.runRequestInterceptors(
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...headers,
                        },
                        body: requestBody,
                    } as ExtendedFetchOptions,
                    false,
                );

                // 发起请求
                const baseURL = this.getBaseURL();
                const fullUrl = baseURL ? `${baseURL}${url}` : url;
                const response = await fetch(fullUrl, {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: {
                        "Content-Type": "application/json",
                        ...processedConfig.headers,
                    },
                    signal: abortController.signal,
                    ...restOptions,
                });

                // 调用响应回调
                if (onResponse) {
                    try {
                        await onResponse(response);
                    } catch (err) {
                        throw err;
                    }
                }

                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    const error = new Error(errorText || "Failed to fetch the chat response.");
                    onError?.(error);
                    throw error;
                }

                if (!response.body) {
                    const error = new Error("The response body is empty.");
                    onError?.(error);
                    throw error;
                }

                // 处理流式响应
                await this.processStream({
                    stream: response.body,
                    onUpdate,
                    onFinish,
                    onError,
                    onToolCall,
                    generateId,
                    abortController,
                });
            } catch (error) {
                if (!isAborted) {
                    onError?.(error as Error);
                }
            }
        })();

        // 立即返回控制器
        return controller;
    }

    /**
     * 处理聊天流响应
     */
    private async processStream({
        stream,
        onUpdate,
        onToolCall,
        onFinish,
        onError,
        generateId,
        abortController,
    }: {
        stream: ReadableStream;
        onUpdate?: (chunk: ChatStreamChunk) => void;
        onToolCall?: (chunk: McpCallChunk<McpToolCall>) => void;
        onFinish?: (message: ChatMessage) => void;
        onError?: (error: Error) => void;
        generateId: () => string;
        abortController: AbortController;
    }): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: "",
        };

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;
                if (abortController.signal.aborted) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed === "data: [DONE]" || trimmed === "[DONE]") {
                        onFinish?.(currentMessage);
                        return;
                    }

                    if (trimmed.startsWith("data:")) {
                        const jsonStr = trimmed.slice(5).trim();
                        if (!jsonStr) continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === "error") {
                                throw new Error(parsed.data.message);
                            } else if (parsed.type.startsWith("mcp_tool_")) {
                                const type: McpCallType = parsed.type.replace(/^mcp_tool_/, "");
                                if (type === "error") {
                                    throw new Error(parsed.data.message);
                                } else {
                                    onToolCall?.({
                                        type,
                                        data: parsed.data,
                                    });
                                }
                            } else if (parsed.type === "chunk" && parsed.data) {
                                currentMessage.content += parsed.data;
                                onUpdate?.({
                                    type: "content",
                                    message: { ...currentMessage },
                                    delta: parsed.data,
                                });
                            } else if (parsed.type === "reasoning" && parsed.data) {
                                // 处理深度思考数据
                                onUpdate?.({
                                    type: "metadata",
                                    message: { ...currentMessage },
                                    metadata: {
                                        type: "reasoning",
                                        data: parsed.data,
                                    },
                                });
                            } else if (
                                parsed.type === "context" ||
                                parsed.type === "references" ||
                                parsed.type === "suggestions" ||
                                parsed.type === "conversation_id" ||
                                parsed.type === "annotations"
                            ) {
                                // 处理其他类型的消息（上下文、引用来源、建议,标注等）
                                onUpdate?.({
                                    type: "metadata",
                                    message: { ...currentMessage },
                                    metadata: {
                                        type: parsed.type,
                                        data: parsed.data,
                                    },
                                });
                            }
                        } catch (e) {
                            // 解析失败可忽略或警告
                            // console.warn("解析流数据失败:", line, e);
                            throw e;
                        }
                    }
                }
            }

            // 如果到这里还没有调用onFinish，说明流正常结束
            if (!abortController.signal.aborted) {
                onFinish?.(currentMessage);
            }
        } catch (error) {
            onError?.(error as Error);
            throw error;
        } finally {
            reader.releaseLock();
        }
    }
}
