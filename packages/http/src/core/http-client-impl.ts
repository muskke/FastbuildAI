import { HttpClient, HttpClientOptions, HttpMethod, RequestOptions, ChatStreamConfig, UploadOptions, UploadController, ResponseSchema } from "../types";
import { InterceptorManager } from "./interceptor-manager";
import { RequestExecutor } from "./request-executor";
import { RequestCache } from "../utils/request-cache";
import { ParamsProcessor } from "../utils/params-processor";
import { ErrorHandler } from "../handlers/error-handler";
import { handleResponse } from "../handlers/response-handler";
import { ChatStream } from "../features/chat-stream";
import { FileUpload } from "../features/file-upload";

/**
 * HTTP 客户端实现类
 * 整合所有模块，提供完整的 HTTP 客户端功能
 */
export class HttpClientImpl implements HttpClient {
    private requestCache: RequestCache;
    private paramsProcessor: ParamsProcessor;
    private interceptorManager: InterceptorManager;
    private errorHandler: ErrorHandler;
    private requestExecutor: RequestExecutor;
    private chatStreamHandler: ChatStream;
    private fileUploadHandler: FileUpload;

    // 客户端配置
    private clientConfig: HttpClientOptions;

    constructor(config: HttpClientOptions = {}) {
        // 初始化配置
        this.clientConfig = {
            baseURL: "",
            timeout: 30000,
            dedupe: true,
            ignoreResponseError: false,
            ...config,
        };

        // 初始化各个模块
        this.requestCache = new RequestCache();
        this.paramsProcessor = new ParamsProcessor();
        this.interceptorManager = new InterceptorManager();
        this.errorHandler = new ErrorHandler();

        // 初始化请求执行器
        this.requestExecutor = new RequestExecutor(
            () => this.clientConfig.baseURL || "",
            () => this.clientConfig.timeout || 30000,
            this.requestCache,
            this.paramsProcessor,
            this.interceptorManager,
            this.errorHandler
        );

        // 初始化功能模块
        this.chatStreamHandler = new ChatStream(
            () => this.clientConfig.baseURL || "",
            this.interceptorManager
        );

        this.fileUploadHandler = new FileUpload(
            () => this.clientConfig.baseURL || "",
            this.interceptorManager,
            this.errorHandler
        );
    }

    /** ==================== HTTP 请求方法 ==================== */

    /**
     * 发送 GET 请求
     */
    get<T>(url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>("GET", url, options);
    }

    /**
     * 发送 POST 请求
     */
    post<T>(url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>("POST", url, options);
    }

    /**
     * 发送 PUT 请求
     */
    put<T>(url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>("PUT", url, options);
    }

    /**
     * 发送 DELETE 请求
     */
    delete<T>(url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>("DELETE", url, options);
    }

    /**
     * 发送 PATCH 请求
     */
    patch<T>(url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>("PATCH", url, options);
    }

    /**
     * 发送自定义请求
     */
    request<T>(method: HttpMethod, url: string, options?: RequestOptions): Promise<T> {
        return this.requestExecutor.execute<T>(method, url, options);
    }

    /** ==================== 特殊功能 ==================== */

    /**
     * 建立聊天流连接
     */
    chatStream(url: string, config: ChatStreamConfig): Promise<{ abort: () => void }> {
        return this.chatStreamHandler.create(url, config);
    }

    /**
     * 文件上传
     */
    upload<T = any>(url: string, options: UploadOptions): UploadController<T> {
        return this.fileUploadHandler.upload<T>(url, options);
    }

    /** ==================== 请求控制 ==================== */

    /**
     * 取消特定请求
     */
    cancel(url: string, method: HttpMethod = "GET"): void {
        this.requestCache.cancel(url, method);
    }

    /**
     * 取消所有请求
     */
    cancelAll(): void {
        this.requestCache.cancelAll();
    }

    /** ==================== 拦截器 ==================== */

    /**
     * 拦截器管理器
     */
    get interceptors() {
        return this.interceptorManager;
    }

    /** ==================== 配置方法 ==================== */

    /**
     * 设置全局请求头
     */
    setHeader(name: string, value: string): HttpClient {
        if (!this.clientConfig.fetchOptions) {
            this.clientConfig.fetchOptions = {};
        }

        if (!this.clientConfig.fetchOptions.headers) {
            this.clientConfig.fetchOptions.headers = {};
        }

        (this.clientConfig.fetchOptions.headers as Record<string, string>)[name] = value;

        return this;
    }

    /**
     * 设置认证令牌
     */
    setToken(token: string, type = 'Bearer'): HttpClient {
        return this.setHeader('Authorization', `${type} ${token}`);
    }

    /**
     * 设置基础URL
     */
    setBaseURL(baseURL: string): HttpClient {
        this.clientConfig.baseURL = baseURL;
        return this;
    }

    /**
     * 设置超时时间
     */
    setTimeout(timeout: number): HttpClient {
        this.clientConfig.timeout = timeout;
        return this;
    }

    /**
     * 设置全局自定义业务状态码处理器
     */
    setStatusHandler(handler: (status: number, response: ResponseSchema) => void): HttpClient {
        this.errorHandler.setCustomCodeHandler(handler);
        return this;
    }

    /**
     * 设置参数处理器
     */
    setParamsProcessor(processor: (params: Record<string, unknown>) => Record<string, unknown>): HttpClient {
        this.paramsProcessor.setProcessor(processor);
        return this;
    }
} 