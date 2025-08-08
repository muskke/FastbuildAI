import { HttpClientOptions, ResponseSchema } from "../types";
import { HttpClientImpl } from "../core/http-client-impl";

/**
 * HTTP 客户端建造者
 * 使用建造者模式来构建 HTTP 客户端
 */
export class HttpClientBuilder {
    private config: HttpClientOptions = {
        baseURL: "",
        timeout: 30000,
        dedupe: true,
        ignoreResponseError: false,
    };

    /**
     * 设置基础URL
     * @param baseURL 基础URL
     * @returns 建造者实例
     */
    setBaseURL(baseURL: string): this {
        this.config.baseURL = baseURL;
        return this;
    }

    /**
     * 设置超时时间
     * @param timeout 超时时间（毫秒）
     * @returns 建造者实例
     */
    setTimeout(timeout: number): this {
        this.config.timeout = timeout;
        return this;
    }

    /**
     * 设置请求去重
     * @param dedupe 是否启用请求去重
     * @returns 建造者实例
     */
    setDedupe(dedupe: boolean): this {
        this.config.dedupe = dedupe;
        return this;
    }

    /**
     * 设置是否忽略响应错误
     * @param ignore 是否忽略响应错误
     * @returns 建造者实例
     */
    setIgnoreResponseError(ignore: boolean): this {
        this.config.ignoreResponseError = ignore;
        return this;
    }

    /**
     * 设置 Fetch 选项
     * @param options Fetch 选项
     * @returns 建造者实例
     */
    setFetchOptions(options: HttpClientOptions['fetchOptions']): this {
        this.config.fetchOptions = options;
        return this;
    }

    /**
     * 构建 HTTP 客户端
     * @returns HTTP 客户端实例
     */
    build(): HttpClientImpl {
        return new HttpClientImpl(this.config);
    }
} 