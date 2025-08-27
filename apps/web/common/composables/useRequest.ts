import {
    type ChatStreamConfig,
    createHttpClient,
    type HttpMethod,
    type RequestOptions,
    type ResponseSchema,
} from "@fastbuildai/http";

import AppConfig from "@/common/config";

// ==================== 类型定义 ====================

/**
 * 请求配置选项接口
 * 用于配置不同类型的请求实例（Console、Web、Plugin）
 */
export interface RequestFactoryOptions {
    /** API 前缀路径 */
    apiPrefix: string;
    /** 是否启用状态日志输出 */
    enableStatusLog?: boolean;
    /** 是否启用运行时配置 */
    enableRuntimeConfig?: boolean;
    /** 是否过滤空值参数（undefined、null） */
    filterEmptyParams?: boolean;
    /** 是否要求用户认证 */
    requireAuth?: boolean;
    /** 自定义参数处理器函数 */
    customParamsProcessor?: (params: Record<string, any>) => Record<string, any>;
    /** 自定义错误处理器函数 */
    customErrorHandler?: (error: unknown) => void;
}

/**
 * 插件API类型枚举
 */
export type PluginApiType = "console" | "web";

// ==================== 核心工厂函数 ====================

/**
 * 通用请求工厂函数
 * 根据配置选项创建具有不同特性的HTTP请求实例
 *
 * @param options 配置选项
 * @returns 包含各种HTTP请求方法的对象
 */
function createRequestFactory(options: RequestFactoryOptions) {
    const {
        apiPrefix,
        enableStatusLog = false,
        enableRuntimeConfig = false,
        filterEmptyParams = false,
        requireAuth = false,
        customParamsProcessor,
        customErrorHandler,
    } = options;

    // 创建HTTP客户端实例，配置基本参数
    const http = createHttpClient({
        dedupe: true, // 启用请求去重
        ignoreResponseError: true, // 忽略响应错误，由拦截器处理
        timeout: 30000, // 30秒超时
    });

    // 设置API基础路径
    http.setBaseURL(`${AppConfig.BASE_API}${apiPrefix}`);

    // 配置状态码处理逻辑
    http.setStatusHandler((status: number, response: ResponseSchema) => {
        if (enableStatusLog && import.meta.client) {
            console.log(`[HTTP ${status}]`, response);
        }
    });

    // 请求拦截器 - 处理认证头和运行时配置
    http.interceptors.request(async (config) => {
        const userStore = useUserStore();

        // 初始化请求头
        if (!config.headers) {
            config.headers = {};
        }

        // 检查是否需要认证，如果需要认证但用户未登录则阻止请求
        const Authorization = userStore.token || userStore.temporaryToken;

        // 添加认证令牌
        const headers = config.headers as Record<string, string>;
        if (Authorization) {
            headers["Authorization"] = `Bearer ${Authorization}`;
        }

        return config;
    });

    // 响应拦截器 - 处理响应数据格式
    http.interceptors.response(<T>(response: T) => {
        return response;
    });

    // 错误拦截器 - 统一错误处理
    http.interceptors.error((error: unknown) => {
        const typedError = error as Error;

        if (customErrorHandler) {
            customErrorHandler(error);
        } else {
            console.error("[请求失败]", typedError.message, error);
        }

        throw error; // 继续抛出错误以便上层处理
    });

    // 参数处理器配置
    http.setParamsProcessor((params: Record<string, any> = {}) => {
        let processedParams = params;

        // 空值过滤处理
        if (filterEmptyParams) {
            processedParams = Object.fromEntries(
                Object.entries(params).filter(
                    ([_, value]) => value !== undefined && value !== null,
                ),
            );
        }

        // 自定义参数处理
        if (customParamsProcessor) {
            processedParams = customParamsProcessor(processedParams);
        }

        return processedParams;
    });

    // ==================== HTTP 方法定义 ====================

    /**
     * GET 请求
     * @param url 请求路径
     * @param params 查询参数
     * @param options 请求配置选项
     * @returns Promise<T>
     */
    const get = <T>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        http.get<T>(url, { params, requireAuth, ...options });

    /**
     * POST 请求
     * @param url 请求路径
     * @param data 请求体数据
     * @param options 请求配置选项
     * @returns Promise<T>
     */
    const post = <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
        http.post<T>(url, { data, requireAuth, ...options });

    /**
     * PUT 请求
     * @param url 请求路径
     * @param data 请求体数据
     * @param options 请求配置选项
     * @returns Promise<T>
     */
    const put = <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
        http.put<T>(url, { data, requireAuth, ...options });

    /**
     * DELETE 请求
     * @param url 请求路径
     * @param data 请求体数据
     * @param options 请求配置选项
     * @returns Promise<T>
     */
    const del = <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
        http.delete<T>(url, { data, requireAuth, ...options });

    /**
     * PATCH 请求
     * @param url 请求路径
     * @param data 请求体数据
     * @param options 请求配置选项
     * @returns Promise<T>
     */
    const patch = <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
        http.patch<T>(url, { data, requireAuth, ...options });

    /**
     * 通用请求方法
     * @param url 请求路径
     * @param options 请求配置选项（包含HTTP方法）
     * @returns Promise<T>
     */
    const request = <T>(url: string, options: RequestOptions & { method: HttpMethod }) =>
        http.request<T>(options.method, url, { requireAuth, ...options });

    /**
     * 流式请求
     * @param url 流API端点路径
     * @param config 流配置
     * @returns Promise<包含控制方法的流控制器>
     */
    const stream = (url: string, config: ChatStreamConfig) => http.chatStream(url, config);

    /**
     * 文件上传方法
     * @param url 上传接口路径
     * @param data 表单数据，可以包含文件和其他字段
     * @param opts 上传选项配置
     * @returns Promise<T>
     */
    const upload = <T = any>(
        url: string,
        data?: Record<string, any>,
        opts?: {
            /** 上传进度回调函数 */
            onProgress?: (percent: number) => void;
            /** 自定义请求头 */
            headers?: Record<string, string>;
            /** 是否跳过业务状态码检查 */
            skipBusinessCheck?: boolean;
            /** 是否返回完整响应对象 */
            returnFullResponse?: boolean;
        },
    ): Promise<T> => {
        // 构建FormData对象
        const formData = new FormData();
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                // 处理文件数组
                if (Array.isArray(value) && value[0] instanceof File) {
                    value.forEach((file: File) => {
                        formData.append(key, file);
                    });
                } else {
                    formData.append(key, value);
                }
            });
        }

        // 发送上传请求
        const controller = http.upload<T>(url, {
            file: formData,
            ...opts,
        });

        return controller.promise;
    };

    /**
     * 取消指定请求
     * @param url 请求路径
     * @param method HTTP方法，默认为GET
     */
    const cancel = (url: string, method: HttpMethod = "GET") => http.cancel(url, method);

    /**
     * 取消所有活动请求
     */
    const cancelAll = () => http.cancelAll();

    // 返回所有请求方法
    return {
        get,
        post,
        put,
        delete: del,
        patch,
        request,
        stream,
        upload,
        cancel,
        cancelAll,
    };
}

// ==================== Console API 请求实例 ====================

/**
 * 创建后台管理 Console API 请求实例
 * 特点：
 * - 使用 CONSOLE_API_PREFIX 前缀
 * - 不启用状态日志
 * - 不需要运行时配置
 * - 启用空值参数过滤
 *
 * @returns Console API 请求方法集合
 */
function createConsoleApiRequest() {
    const requestFactory = createRequestFactory({
        apiPrefix: AppConfig.CONSOLE_API_PREFIX,
        enableStatusLog: false,
        enableRuntimeConfig: false,
        filterEmptyParams: true,
        requireAuth: true, // Console API 需要认证
        customErrorHandler: (error: unknown) => {
            const typedError = error as Error;
            console.error("[Console API 请求失败]", typedError.message, error);
        },
    });

    return {
        useConsoleGet: requestFactory.get,
        useConsolePost: requestFactory.post,
        useConsolePut: requestFactory.put,
        useConsoleDelete: requestFactory.delete,
        useConsolePatch: requestFactory.patch,
        useConsoleRequest: requestFactory.request,
        useConsoleStream: requestFactory.stream,
        cancelConsoleRequest: requestFactory.cancel,
        cancelConsoleAllRequests: requestFactory.cancelAll,
    };
}

// ==================== Web API 请求实例 ====================

/**
 * 创建前台 Web API 请求实例
 * 特点：
 * - 使用 WEB_API_PREFIX 前缀
 * - 启用状态日志
 * - 需要运行时配置
 * - 不过滤空值参数
 * - 支持文件上传
 *
 * @returns Web API 请求方法集合
 */
function createWebApiRequest() {
    const requestFactory = createRequestFactory({
        apiPrefix: AppConfig.WEB_API_PREFIX,
        enableStatusLog: true,
        enableRuntimeConfig: true,
        filterEmptyParams: false,
        requireAuth: false, // Web API 默认不需要认证，可以根据需要调整
        customErrorHandler: (error: unknown) => {
            const typedError = error as Error;
            console.error("[Web API 请求失败]", typedError.message);
        },
    });

    return {
        useWebGet: requestFactory.get,
        useWebPost: requestFactory.post,
        useWebPut: requestFactory.put,
        useWebDelete: requestFactory.delete,
        useWebPatch: requestFactory.patch,
        useWebRequest: requestFactory.request,
        useWebStream: requestFactory.stream,
        useWebUpload: requestFactory.upload,
        cancelWebRequest: requestFactory.cancel,
        cancelWebAllRequests: requestFactory.cancelAll,
    };
}

// ==================== 插件 API 请求实例 ====================

/**
 * 创建插件请求实例的延迟工厂函数
 *
 * @param apiType API类型（console 或 web）
 * @returns 延迟初始化的请求实例工厂
 */
function createPluginApiRequest(apiType: PluginApiType = AppConfig.WEB_API_PREFIX) {
    // 延迟初始化的实例
    let requestFactory: ReturnType<typeof createRequestFactory> | null = null;

    const getRequestFactory = () => {
        // 延迟获取插件key，避免在模块加载时调用useNuxtApp
        let finalPluginKey: string;
        try {
            const nuxtApp = useNuxtApp();
            finalPluginKey =
                typeof nuxtApp.$getCurrentPluginKey === "function"
                    ? nuxtApp.$getCurrentPluginKey() || "unknown"
                    : "unknown";
        } catch {
            finalPluginKey = "unknown";
        }

        // 构建插件API前缀: /{pluginKey}/{apiType}
        const pluginApiPrefix = `/${finalPluginKey}${apiType}`;

        requestFactory = createRequestFactory({
            apiPrefix: pluginApiPrefix,
            enableStatusLog: apiType === "web",
            enableRuntimeConfig: apiType === "web",
            filterEmptyParams: apiType === "console",
            customErrorHandler: (error: unknown) => {
                const typedError = error as Error;
                console.error(
                    `[插件 ${finalPluginKey} ${apiType.toUpperCase()} API 请求失败]`,
                    typedError.message,
                    error,
                );
            },
        });
        return requestFactory;
    };

    // 返回延迟调用的方法
    return {
        get: <T>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
            getRequestFactory().get<T>(url, params, options),
        post: <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
            getRequestFactory().post<T>(url, data, options),
        put: <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
            getRequestFactory().put<T>(url, data, options),
        delete: <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
            getRequestFactory().delete<T>(url, data, options),
        patch: <T>(url: string, data?: Record<string, any>, options?: RequestOptions) =>
            getRequestFactory().patch<T>(url, data, options),
        request: <T>(url: string, options: RequestOptions & { method: HttpMethod }) =>
            getRequestFactory().request<T>(url, options),
        stream: (url: string, config: ChatStreamConfig) => getRequestFactory().stream(url, config),
        upload: <T>(url: string, data?: Record<string, any>, opts?: RequestOptions) =>
            getRequestFactory().upload<T>(url, data, opts),
        cancel: (url: string, method?: HttpMethod) => getRequestFactory().cancel(url, method),
        cancelAll: () => getRequestFactory().cancelAll(),
    };
}

/**
 * 创建插件 Console API 请求方法集合
 */
function createPluginConsoleApiRequest() {
    const requestFactory = createPluginApiRequest(AppConfig.CONSOLE_API_PREFIX);

    return {
        usePluginConsoleGet: requestFactory.get,
        usePluginConsolePost: requestFactory.post,
        usePluginConsolePut: requestFactory.put,
        usePluginConsoleDelete: requestFactory.delete,
        usePluginConsolePatch: requestFactory.patch,
        usePluginConsoleRequest: requestFactory.request,
        usePluginConsoleStream: requestFactory.stream,
        cancelPluginConsoleRequest: requestFactory.cancel,
        cancelPluginConsoleAllRequests: requestFactory.cancelAll,
    };
}

/**
 * 创建插件 Web API 请求方法集合
 */
function createPluginWebApiRequest() {
    const requestFactory = createPluginApiRequest(AppConfig.WEB_API_PREFIX);

    return {
        usePluginWebGet: requestFactory.get,
        usePluginWebPost: requestFactory.post,
        usePluginWebPut: requestFactory.put,
        usePluginWebDelete: requestFactory.delete,
        usePluginWebPatch: requestFactory.patch,
        usePluginWebRequest: requestFactory.request,
        usePluginWebStream: requestFactory.stream,
        usePluginWebUpload: requestFactory.upload,
        cancelPluginWebRequest: requestFactory.cancel,
        cancelPluginWebAllRequests: requestFactory.cancelAll,
    };
}

// ==================== 导出 Console API 请求方法 ====================

/**
 * 导出后台管理 Console API 请求方法
 * 用于后台管理系统的数据操作
 */
export const {
    useConsoleGet,
    useConsolePost,
    useConsolePut,
    useConsoleDelete,
    useConsolePatch,
    useConsoleRequest,
    useConsoleStream,
    cancelConsoleRequest,
    cancelConsoleAllRequests,
} = createConsoleApiRequest();

// ==================== 导出 Web API 请求方法 ====================

/**
 * 导出前台 Web API 请求方法
 * 用于前台用户界面的数据操作
 */
export const {
    useWebGet,
    useWebPost,
    useWebPut,
    useWebDelete,
    useWebPatch,
    useWebRequest,
    useWebStream,
    useWebUpload,
    cancelWebRequest,
    cancelWebAllRequests,
} = createWebApiRequest();

// ==================== 导出插件 API 请求方法 ====================

/**
 * 导出插件 Console API 请求方法
 * 用于插件的后台管理功能
 */
export const {
    usePluginConsoleGet,
    usePluginConsolePost,
    usePluginConsolePut,
    usePluginConsoleDelete,
    usePluginConsolePatch,
    usePluginConsoleRequest,
    usePluginConsoleStream,
    cancelPluginConsoleRequest,
    cancelPluginConsoleAllRequests,
} = createPluginConsoleApiRequest();

/**
 * 导出插件 Web API 请求方法
 * 用于插件的前台展示功能
 */
export const {
    usePluginWebGet,
    usePluginWebPost,
    usePluginWebPut,
    usePluginWebDelete,
    usePluginWebPatch,
    usePluginWebRequest,
    usePluginWebStream,
    usePluginWebUpload,
    cancelPluginWebRequest,
    cancelPluginWebAllRequests,
} = createPluginWebApiRequest();

// ==================== 导出工厂函数 ====================

/**
 * 导出工厂函数，供需要自定义配置的场景使用
 */
export {
    createConsoleApiRequest,
    createPluginApiRequest,
    createPluginConsoleApiRequest,
    createPluginWebApiRequest,
    createRequestFactory,
    createWebApiRequest,
};
