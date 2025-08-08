import type { SiteConfig } from "@/models/global";
import type { WebsiteConfig } from "@/models/website";

// ==================== 网站配置相关 API ====================

/**
 * 获取网站基础配置信息
 * @description 获取网站基础信息，包含网站信息、版权信息、统计信息
 * @returns {Promise<SiteConfig>} 网站基础配置信息
 */
export function apiGetSiteConfig(): Promise<SiteConfig> {
    return useWebGet<SiteConfig>("/config");
}

/**
 * 获取协议配置信息
 * @description 单独获取网站协议相关配置，包含服务协议和隐私协议
 * @returns {Promise<{ agreement: WebsiteConfig["agreement"] }>} 协议配置信息
 */
export function apiGetAgreementConfig(): Promise<{ agreement: WebsiteConfig["agreement"] }> {
    return useWebGet<{ agreement: WebsiteConfig["agreement"] }>("/config/agreement");
}

// ==================== 文件上传相关 API ====================

/**
 * 通用文件上传方法 - 单文件上传
 * @description 上传单个文件到服务器
 * @param {Object} params 上传参数
 * @param {File} params.file 要上传的文件对象
 * @param {string} params.description 文件描述（可选）
 * @param {Object} options 上传选项
 * @param {Function} options.onProgress 上传进度回调函数
 * @returns {Promise<{ id: string, url: string, originalName: string, size: number, type: string, extension: string }>} 上传成功后的文件信息
 */
export function apiUploadFile(
    params: { file: File; description?: string },
    options?: { onProgress?: (percent: number) => void },
): Promise<{
    id: string;
    url: string;
    originalName: string;
    size: number;
    type: string;
    extension: string;
}> {
    return useWebUpload<{
        id: string;
        url: string;
        originalName: string;
        size: number;
        type: string;
        extension: string;
    }>(`/upload/file`, params, options);
}

/**
 * 通用文件上传方法 - 多文件上传
 * @description 上传多个文件到服务器
 * @param {Object} params 上传参数
 * @param {File[]} params.files 要上传的文件对象数组
 * @param {string} params.description 文件描述（可选）
 * @param {Object} options 上传选项
 * @param {Function} options.onProgress 上传进度回调函数
 * @returns {Promise<Array<{ id: string, url: string, originalName: string, size: number, type: string, extension: string }>>} 上传成功后的文件信息数组
 */
export function apiUploadFiles(
    params: { files: File[]; description?: string },
    options?: { onProgress?: (percent: number) => void },
): Promise<
    Array<{
        id: string;
        url: string;
        originalName: string;
        size: number;
        type: string;
        extension: string;
    }>
> {
    return useWebUpload<
        Array<{
            id: string;
            url: string;
            originalName: string;
            size: number;
            type: string;
            extension: string;
        }>
    >(`/upload/files`, params, options);
}
