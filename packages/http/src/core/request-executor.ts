import { ofetch, FetchOptions } from "ofetch";
import { HttpMethod, RequestOptions, ExtendedFetchOptions, ResponseSchema } from "../types";
import { InterceptorManager } from "./interceptor-manager";
import { RequestCache } from "../utils/request-cache";
import { ParamsProcessor } from "../utils/params-processor";
import { ErrorHandler } from "../handlers/error-handler";
import { handleResponse } from "../handlers/response-handler";
import { useUserStore } from "@/common/stores/user";

/**
 * 请求执行器
 * 负责执行HTTP请求的核心逻辑
 */
export class RequestExecutor {
    constructor(
        private getBaseURL: () => string,
        private getTimeout: () => number,
        private requestCache: RequestCache,
        private paramsProcessor: ParamsProcessor,
        private interceptorManager: InterceptorManager,
        private errorHandler: ErrorHandler,
    ) {}

    /**
     * 执行请求
     * @param method HTTP 方法
     * @param url 请求 URL
     * @param options 请求选项
     * @returns 请求结果
     */
    async execute<T>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<T> {
        const {
            params,
            data,
            requireAuth = false,
            returnFullResponse = false,
            skipBusinessCheck = false,
            skipRequestInterceptors = false,
            skipResponseInterceptors = false,
            skipErrorInterceptors = false,
            dedupe = true,
            ...restOptions
        } = options;

        // 检查用户认证
        if (requireAuth && !useUserStore().token && !useUserStore().temporaryToken) {
            throw new Error("用户未登录，请先登录后再试");
        }

        // 合并配置
        let config: FetchOptions = {
            method,
            baseURL: this.getBaseURL(),
            timeout: this.getTimeout(),
            ignoreResponseError: true,
            ...restOptions,
        };

        // 处理请求参数
        if (params || method === "GET") {
            config.params = this.paramsProcessor.process(params as Record<string, unknown>);
        }

        // 添加请求体
        if (data) {
            config.body = this.paramsProcessor.process(data);
        }

        // 执行请求拦截器
        config = (await this.interceptorManager.runRequestInterceptors(
            config as ExtendedFetchOptions,
            skipRequestInterceptors,
        )) as FetchOptions;

        if (dedupe) {
            const cachedRequest = this.requestCache.get<T>(method, url, data);
            if (cachedRequest) {
                return cachedRequest;
            }
        }

        // 设置请求取消控制器
        const abortController = new AbortController();
        this.requestCache.setAbortController(method, url, data as Record<string, unknown>, abortController);

        // 用 Promise.race() 模拟超时中断（为了兼容旧版本浏览器使用AbortSignal.any() 和 AbortSignal.timeout()出现兼容问题的修复
        function withTimeout(signal: AbortSignal, timeout: number): AbortSignal {
            const controller = new AbortController();

            const timer = setTimeout(
                () => controller.abort(new DOMException("Timeout", "AbortError")),
                timeout,
            );

            // 如果原始 signal 被中断，也要中断这个 controller
            signal.addEventListener("abort", () => {
                clearTimeout(timer);
                controller.abort(signal.reason);
            });

            return controller.signal;
        }

        // 设置信号
        const signal = config.timeout
            ? withTimeout(abortController.signal, config.timeout as number)
            : abortController.signal;

        config.signal = signal;

        // 发起请求
        const requestPromise = ofetch
            .raw<T>(url, config as FetchOptions<"json">)
            .then(async (response) => {
                // 执行响应拦截器
                let processedResponse = await this.interceptorManager.runResponseInterceptors(
                    response._data as ResponseSchema,
                    skipResponseInterceptors,
                );

                // 处理错误状态码和业务错误码
                this.errorHandler.handle(response.status, processedResponse, skipBusinessCheck);

                // 根据配置返回完整响应或仅返回数据
                return handleResponse<T>(processedResponse, returnFullResponse) as T;
            })
            .catch(async (error) => {
                // 执行错误拦截器
                return this.interceptorManager.runErrorInterceptors(error, skipErrorInterceptors);
            })
            .finally(() => {
                this.requestCache.cleanup(method, url, data);
            });

        // 缓存请求
        if (dedupe) {
            this.requestCache.set(method, url, data as Record<string, unknown>, requestPromise);
        }

        return requestPromise;
    }
}
