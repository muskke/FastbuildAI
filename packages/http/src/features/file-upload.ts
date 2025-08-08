import { UploadOptions, UploadController, ExtendedFetchOptions, ResponseSchema } from "../types";
import { InterceptorManager } from "../core/interceptor-manager";
import { ErrorHandler } from "../handlers/error-handler";

/**
 * 文件上传处理器
 * 负责处理文件上传请求
 */
export class FileUpload {
    constructor(
        private getBaseURL: () => string,
        private interceptorManager: InterceptorManager,
        private errorHandler: ErrorHandler
    ) {}

    /**
     * 文件上传
     * @param url 上传地址
     * @param options 上传选项
     * @returns 上传控制器
     */
    upload<T = any>(url: string, options: UploadOptions): UploadController<T> {
        // 检查运行环境
        if (typeof window === 'undefined' || !window.XMLHttpRequest) {
            throw new Error('文件上传功能需要在浏览器环境中使用');
        }

        // 解构上传选项
        const {
            file,
            fieldName = "file",
            formData = {},
            onProgress,
            headers = {},
            skipBusinessCheck = false,
            returnFullResponse = false,
        } = options;

        // 创建进度变量和控制器
        let progressValue = 0;
        let abortController: (() => void) | null = null;

        // 创建上传 Promise
        const uploadPromise = new Promise<T>(async (resolve, reject) => {
            // 创建 XHR 对象和 FormData
            const xhr = new window.XMLHttpRequest();
            let form: FormData;

            try {
                // 应用请求拦截器获取头信息
                const processedConfig = await this.interceptorManager.runRequestInterceptors({
                    method: "POST",
                    headers: headers,
                } as ExtendedFetchOptions, false);

                // 设置取消函数
                abortController = () => {
                    xhr.abort();
                    reject(new Error("Upload aborted"));
                };

                // 准备表单数据
                form = file instanceof FormData ? file : new FormData();

                // 如果传入的是 File 对象，添加文件和额外数据
                if (!(file instanceof FormData)) {
                    form.append(fieldName, file);
                    Object.entries(formData).forEach(([key, value]) => {
                        form.append(key, value);
                    });
                }

                // 初始化请求
                const baseURL = this.getBaseURL();
                xhr.open("POST", baseURL ? `${baseURL}${url}` : url, true);

                // 应用所有请求头（拦截器设置的头信息优先，用户自定义头信息覆盖）
                const mergedHeaders = {
                    ...(processedConfig.headers || {}),
                    ...headers
                };

                // 设置所有头信息
                Object.entries(mergedHeaders).forEach(([key, value]) => {
                    if (value) xhr.setRequestHeader(key, String(value));
                });
            } catch (error) {
                reject(error);
                return;
            }

            // 监听上传进度
            xhr.upload.onprogress = (event: ProgressEvent) => {
                if (event.lengthComputable) {
                    progressValue = Math.round((event.loaded / event.total) * 100);
                    onProgress?.(progressValue);
                }
            };

            // 处理响应
            xhr.onload = () => {
                try {
                    // 处理 HTTP 状态码
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // 解析响应数据
                        let responseData: ResponseSchema<T>;
                        try {
                            responseData = JSON.parse(xhr.responseText);
                        } catch {
                            // 如果解析失败，直接返回文本内容
                            resolve(xhr.responseText as T);
                            return;
                        }

                        // 处理业务状态码
                        try {
                            this.errorHandler.handle(xhr.status, responseData, skipBusinessCheck);

                            // 根据配置返回完整响应或仅返回数据
                            const result = returnFullResponse ? responseData : responseData.data;
                            resolve(result as T);
                        } catch (error) {
                            reject(error instanceof Error ? error : new Error(String(error)));
                        }
                    } else {
                        // 处理 HTTP 错误状态码
                        try {
                            let responseData: ResponseSchema;
                            try {
                                responseData = JSON.parse(xhr.responseText);
                            } catch {
                                responseData = { 
                                    code: xhr.status, 
                                    data: null, 
                                    message: xhr.statusText,
                                    timestamp: Date.now()
                                };
                            }
                            this.errorHandler.handleHttpError(xhr.status, responseData);
                        } catch (error) {
                            reject(error instanceof Error ? error : new Error(String(error)));
                        }
                    }
                } catch (error) {
                    // 捕获并处理其他异常
                    reject(error instanceof Error ? error : new Error(String(error)));
                }
            };

            // 处理网络错误
            xhr.onerror = () => {
                reject(new Error("Network error occurred during upload"));
            };

            // 处理请求取消
            xhr.onabort = () => {
                reject(new Error("Upload was aborted"));
            };

            // 发送请求
            xhr.send(form);
        });

        // 返回控制器
        return {
            abort: () => abortController?.(),
            progress: progressValue,
            promise: uploadPromise,
        };
    }
} 