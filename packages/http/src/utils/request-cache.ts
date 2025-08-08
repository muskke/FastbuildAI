/**
 * 请求缓存管理器
 * 负责请求去重和取消控制
 */
export class RequestCache {
    /** 请求缓存映射 */
    private cache = new Map<string, Promise<unknown>>();

    /** 取消控制器映射 */
    private abortControllers = new Map<string, AbortController>();

    /**
     * 生成请求缓存键
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     * @returns 缓存键
     */
    private generateCacheKey(method: string, url: string, data?: unknown): string {
        return `${method}:${url}:${JSON.stringify(data || {})}`;
    }

    /**
     * 获取缓存的请求
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     * @returns 缓存的请求Promise
     */
    get<T>(method: string, url: string, params?: unknown): Promise<T> | undefined {
        const key = this.generateCacheKey(method, url, params);
        return this.cache.get(key) as Promise<T> | undefined;
    }

    /**
     * 设置请求缓存
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     * @param promise 请求Promise
     */
    set<T>(method: string, url: string, data: unknown, promise: Promise<T>): void {
        const key = this.generateCacheKey(method, url, data);
        this.cache.set(key, promise);
    }

    /**
     * 删除请求缓存
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     */
    delete(method: string, url: string, data?: unknown): void {
        const key = this.generateCacheKey(method, url, data);
        this.cache.delete(key);
    }

    /**
     * 设置取消控制器
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     * @param controller 取消控制器
     */
    setAbortController(
        method: string,
        url: string,
        data: unknown,
        controller: AbortController,
    ): void {
        const key = this.generateCacheKey(method, url, data);
        this.abortControllers.set(key, controller);
    }

    /**
     * 获取取消控制器
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     * @returns 取消控制器
     */
    getAbortController(method: string, url: string, data?: unknown): AbortController | undefined {
        const key = this.generateCacheKey(method, url, data);
        return this.abortControllers.get(key);
    }

    /**
     * 删除取消控制器
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     */
    deleteAbortController(method: string, url: string, data?: unknown): void {
        const key = this.generateCacheKey(method, url, data);
        this.abortControllers.delete(key);
    }

    /**
     * 取消特定请求
     * @param url 请求URL
     * @param method HTTP方法
     */
    cancel(url: string, method = "GET"): void {
        const keyPrefix = `${method}:${url}`;

        for (const [key, controller] of this.abortControllers.entries()) {
            if (key.startsWith(keyPrefix)) {
                controller.abort();
                this.abortControllers.delete(key);
                this.cache.delete(key);
            }
        }
    }

    /**
     * 取消所有请求
     */
    cancelAll(): void {
        for (const controller of this.abortControllers.values()) {
            controller.abort();
        }

        this.abortControllers.clear();
        this.cache.clear();
    }

    /**
     * 清理特定请求的缓存和控制器
     * @param method HTTP方法
     * @param url 请求URL
     * @param data 请求数据
     */
    cleanup(method: string, url: string, data?: unknown): void {
        this.delete(method, url, data);
        this.deleteAbortController(method, url, data);
    }
}
