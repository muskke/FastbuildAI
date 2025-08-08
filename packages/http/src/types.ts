/**
 * @fileoverview 定义 HTTP 客户端相关的类型和接口
 */

// 导入依赖
import { McpToolCall } from "@/models/mcp-server";
import { FetchOptions } from "ofetch";

/**
 * HTTP 请求方法类型
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * 响应数据结构
 */
export type ResponseSchema<T = unknown> = {
    code: number;
    data: T;
    message?: string;
    path?: string;
    timestamp: number;
};

/**
 * 全局客户端默认配置
 * 用于初始化 HTTP 客户端实例的全局配置项
 */
export interface HttpClientOptions {
    /** 基本请求配置（来自 ofetch） */
    fetchOptions?: Omit<FetchOptions, "signal">;

    /** 是否默认开启请求去重（默认为 true） */
    dedupe?: boolean;

    /** 是否忽略响应错误（默认为 false） */
    ignoreResponseError?: boolean;

    /** 全局请求超时时间（毫秒） */
    timeout?: number;

    /** 基础URL，所有请求的前缀 */
    baseURL?: string;
}

/**
 * 单次请求配置选项
 * 用于配置单个请求的特殊行为
 */
export interface RequestOptions {
    /** 请求级错误处理回调 */
    onError?: (error: unknown) => void | Promise<void>;

    /** 是否对当前请求进行去重（覆盖全局设置） */
    dedupe?: boolean;

    /** 当前请求的超时时间（毫秒） */
    timeout?: number;

    /** 请求参数 */
    params?: Record<string, unknown>;

    /** 请求体数据 */
    data?: Record<string, unknown>;

    /** 请求头 */
    headers?: Record<string, string>;

    /** 是否要求用户认证，如果为 true 且用户未登录则不发送请求 */
    requireAuth?: boolean;

    /** 是否返回完整响应（默认 false，仅返回 data 字段） */
    returnFullResponse?: boolean;

    /** 是否跳过业务状态码处理（默认 false） */
    skipBusinessCheck?: boolean;

    /** 是否跳过请求拦截器（默认 false） */
    skipRequestInterceptors?: boolean;

    /** 是否跳过响应拦截器（默认 false） */
    skipResponseInterceptors?: boolean;

    /** 是否跳过错误拦截器（默认 false） */
    skipErrorInterceptors?: boolean;
}

/**
 * 扩展的请求配置选项
 * 结合了 ofetch 的 FetchOptions 和我们自定义的 RequestOptions
 */
export type ExtendedFetchOptions = FetchOptions & Omit<RequestOptions, "params" | "data">;

/**
 * 拦截器配置
 * 用于请求/响应处理的拦截器接口
 */
export interface Interceptor {
    // 在发送请求前拦截并修改配置
    onRequest?: (
        config: ExtendedFetchOptions,
    ) => ExtendedFetchOptions | Promise<ExtendedFetchOptions>;
    // 在接收响应后处理数据
    onResponse?: <T>(response: T) => T | Promise<T>;
    // 在请求生命周期中处理错误
    onError?: (error: unknown) => void | Promise<void>;
}

/**
 * Server-Sent Events (SSE) 配置
 * 用于建立服务器发送事件连接的配置选项
 */
export interface SSEConfig {
    // 收到消息时的回调
    onMessage: (event: MessageEvent) => void;
    // 可选的错误处理回调
    onError?: (error: Event) => void;
    // 可选的连接打开时回调
    onOpen?: (event: Event) => void;
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
    /** 消息ID */
    id?: string;
    /** 消息角色 */
    role: "user" | "assistant" | "system" | "tool";
    /** 消息内容 */
    content: string;
    /** 时间戳 */
    timestamp?: string;
    /** 模型名称 */
    model?: string;
    /** 扩展数据 */
    [key: string]: any;
}

/**
 * 聊天流块接口
 */
export interface ChatStreamChunk {
    /** 块类型 */
    type: "content" | "error" | "done" | "metadata" | "conversation_id";
    /** 当前消息状态 */
    message: ChatMessage;
    /** 增量内容 */
    delta?: string;
    /** 对话内容 */
    data?: string;
    /** 错误信息 */
    error?: string;
    /** 元数据 */
    metadata?: {
        type: string;
        data: any;
    };
}

export type McpCallType =
    /** 发现mcp */
    | "detected"
    /** 开始调用 */
    | "start"
    /** 调用结果 */
    | "result"
    /** 错误 */
    | "error";

/**
 * Mcp调用块接口
 */
export interface McpCallChunk<T> {
    /** 块类型 */
    type: McpCallType;
    /** 当前消息状态 */
    data: T;
}

/**
 * 聊天流配置接口
 */
export interface ChatStreamConfig {
    /** 消息列表 */
    messages: ChatMessage[];
    /** 请求体额外数据 */
    body?: Record<string, any>;
    /** 流协议类型 */
    streamProtocol?: "data" | "text";
    /** 响应回调 */
    onResponse?: (response: Response) => void | Promise<void>;
    /** 流更新回调 */
    onUpdate?: (chunk: ChatStreamChunk) => void;
    /** mcp调用回调 */
    onToolCall?: (chunk: McpCallChunk<McpToolCall>) => void;
    /** 完成回调 */
    onFinish?: (message: ChatMessage) => void;
    /** 错误回调 */
    onError?: (error: Error) => void;
    /** ID生成器 */
    generateId?: () => string;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 其他fetch选项 */
    [key: string]: any;
}

/**
 * HTTP 拦截器管理器
 */
export interface InterceptorManager {
    /** 添加请求拦截器 */
    request: (handler: Interceptor["onRequest"]) => () => void;
    /** 添加响应拦截器 */
    response: (handler: Interceptor["onResponse"]) => () => void;
    /** 添加错误拦截器 */
    error: (handler: Interceptor["onError"]) => () => void;
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
    /** 上传的文件对象或 FormData 对象 */
    file: File | FormData;
    /** 文件字段名（当 file 为 File 类型时使用），默认为 'file' */
    fieldName?: string;
    /** 附加表单数据（当 file 为 File 类型时使用） */
    formData?: Record<string, string>;
    /** 上传进度回调 */
    onProgress?: (percent: number) => void;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 是否跳过业务状态码检查 */
    skipBusinessCheck?: boolean;
    /** 是否返回完整响应 */
    returnFullResponse?: boolean;
}

/**
 * 上传控制器
 */
export interface UploadController<T = any> {
    /** 取消上传 */
    abort: () => void;
    /** 上传进度 */
    progress: number;
    /** 上传结果 Promise */
    promise: Promise<T>;
}

/**
 * HTTP 客户端实例
 */
export interface HttpClient {
    /** 发送 GET 请求 */
    get: <T>(url: string, options?: RequestOptions) => Promise<T>;
    /** 发送 POST 请求 */
    post: <T>(url: string, options?: RequestOptions) => Promise<T>;
    /** 发送 PUT 请求 */
    put: <T>(url: string, options?: RequestOptions) => Promise<T>;
    /** 发送 DELETE 请求 */
    delete: <T>(url: string, options?: RequestOptions) => Promise<T>;
    /** 发送 PATCH 请求 */
    patch: <T>(url: string, options?: RequestOptions) => Promise<T>;
    /** 发送自定义请求 */
    request: <T>(method: HttpMethod, url: string, options?: RequestOptions) => Promise<T>;
    /** 建立聊天流连接 */
    chatStream: (url: string, config: ChatStreamConfig) => Promise<{ abort: () => void }>;
    /** 文件上传 */
    upload: <T = any>(url: string, options: UploadOptions) => UploadController<T>;
    /** 取消特定请求 */
    cancel: (url: string, method?: HttpMethod) => void;
    /** 取消所有请求 */
    cancelAll: () => void;
    /** 拦截器管理 */
    interceptors: InterceptorManager;
    /** 设置全局请求头 */
    setHeader: (name: string, value: string) => HttpClient;
    /** 设置认证令牌 */
    setToken: (token: string, type?: string) => HttpClient;
    /** 设置基础URL */
    setBaseURL: (baseURL: string) => HttpClient;
    /** 设置超时时间 */
    setTimeout: (timeout: number) => HttpClient;
    /** 设置全局自定义业务状态码处理器 */
    setStatusHandler: (handler: (status: number, response: ResponseSchema) => void) => HttpClient;
    /** 设置参数处理器 */
    setParamsProcessor: (
        processor: (params: Record<string, unknown>) => Record<string, unknown>,
    ) => HttpClient;
}
