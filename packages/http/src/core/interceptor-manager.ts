import { Interceptor, ExtendedFetchOptions, ResponseSchema, InterceptorManager as IInterceptorManager } from "../types";

/**
 * 拦截器管理器
 * 负责管理和执行各种拦截器
 */
export class InterceptorManager implements IInterceptorManager {
    /** 请求拦截器列表 */
    private requestHandlers: Interceptor["onRequest"][] = [];
    
    /** 响应拦截器列表 */
    private responseHandlers: Interceptor["onResponse"][] = [];
    
    /** 错误拦截器列表 */
    private errorHandlers: Interceptor["onError"][] = [];

    /**
     * 添加请求拦截器
     * @param handler 拦截器处理函数
     * @returns 移除拦截器的函数
     */
    request(handler: Interceptor["onRequest"]): () => void {
        this.requestHandlers.push(handler);
        return () => {
            const index = this.requestHandlers.indexOf(handler);
            if (index !== -1) {
                this.requestHandlers.splice(index, 1);
            }
        };
    }

    /**
     * 添加响应拦截器
     * @param handler 拦截器处理函数
     * @returns 移除拦截器的函数
     */
    response(handler: Interceptor["onResponse"]): () => void {
        this.responseHandlers.push(handler);
        return () => {
            const index = this.responseHandlers.indexOf(handler);
            if (index !== -1) {
                this.responseHandlers.splice(index, 1);
            }
        };
    }

    /**
     * 添加错误拦截器
     * @param handler 拦截器处理函数
     * @returns 移除拦截器的函数
     */
    error(handler: Interceptor["onError"]): () => void {
        this.errorHandlers.push(handler);
        return () => {
            const index = this.errorHandlers.indexOf(handler);
            if (index !== -1) {
                this.errorHandlers.splice(index, 1);
            }
        };
    }

    /**
     * 执行请求拦截器
     * @param config 请求配置
     * @param skipInterceptors 是否跳过拦截器
     * @returns 处理后的请求配置
     */
    async runRequestInterceptors(
        config: ExtendedFetchOptions,
        skipInterceptors = false
    ): Promise<ExtendedFetchOptions> {
        if (skipInterceptors) {
            return config;
        }

        let currentConfig = { ...config };

        for (const handler of this.requestHandlers) {
            if (handler) {
                const result = await handler(currentConfig);
                if (result) {
                    currentConfig = result;
                }
            }
        }

        return currentConfig;
    }

    /**
     * 执行响应拦截器
     * @param response 响应数据
     * @param skipInterceptors 是否跳过拦截器
     * @returns 处理后的响应数据
     */
    async runResponseInterceptors(
        response: any,
        skipInterceptors = false
    ): Promise<any> {
        if (skipInterceptors) {
            return response;
        }

        let currentResponse = response;

        for (const handler of this.responseHandlers) {
            if (handler) {
                const result = await handler(currentResponse);
                if (result) {
                    currentResponse = result;
                }
            }
        }

        return currentResponse;
    }

    /**
     * 执行错误拦截器
     * @param error 错误对象
     * @param skipInterceptors 是否跳过拦截器
     */
    async runErrorInterceptors(
        error: unknown,
        skipInterceptors = false
    ): Promise<never> {
        if (skipInterceptors) {
            throw error;
        }

        for (const handler of this.errorHandlers) {
            if (handler) {
                await handler(error);
            }
        }

        throw error; // 继续抛出错误
    }
} 