/**
 * HTTP 客户端工具
 * 重构后的版本 - 使用模块化设计和设计模式
 */

// 导出类型和常量
export * from "./types";
export * from "./constants";

// 导出核心模块
export { HttpClientImpl } from "./core/http-client-impl";
export { InterceptorManager } from "./core/interceptor-manager";
export { RequestExecutor } from "./core/request-executor";

// 导出工具类
export { RequestCache } from "./utils/request-cache";
export { ParamsProcessor } from "./utils/params-processor";

// 导出处理器
export { ErrorHandler } from "./handlers/error-handler";
export { handleResponse } from "./handlers/response-handler";

// 导出功能模块
export { ChatStream } from "./features/chat-stream";
export { FileUpload } from "./features/file-upload";

// 导出建造者
export { HttpClientBuilder } from "./builders/http-client-builder";

// 导入依赖
import { HttpClientOptions, HttpClient } from "./types";
import { HttpClientBuilder } from "./builders/http-client-builder";

/**
 * 创建 HTTP 客户端工厂函数
 * @param config 客户端配置
 * @returns HTTP 客户端实例
 */
export function createHttpClient(config: HttpClientOptions = {}): HttpClient {
    return new HttpClientBuilder()
        .setBaseURL(config.baseURL || "")
        .setTimeout(config.timeout || 30000)
        .setDedupe(config.dedupe !== undefined ? config.dedupe : true)
        .setIgnoreResponseError(config.ignoreResponseError || false)
        .setFetchOptions(config.fetchOptions)
        .build();
}

/**
 * 创建默认 HTTP 客户端实例
 */
export const http = createHttpClient();


// 兼容性：保留原有的创建方式
export { createHttpClient as default }; 