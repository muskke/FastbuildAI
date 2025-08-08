// ==================== 插件管理相关 API ====================

import type { PaginationResult } from "@/models/global";
import type { PluginCreateParams, PluginItem, PluginQueryRequest } from "@/models/plugin";

/**
 * 获取插件列表
 * @description 根据查询条件分页获取插件列表
 * @param {PluginQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<PluginItem>>} 插件列表分页结果
 */
export function apiGetPluginList(
    params: PluginQueryRequest,
): Promise<PaginationResult<PluginItem>> {
    return useConsoleGet("/plugin/dev-list", params);
}

/**
 * 获取插件详情
 * @description 根据插件ID获取插件的详细信息
 * @param {string} id 插件ID
 * @returns {Promise<PluginItem>} 插件详情
 */
export function apiGetPluginDetail(id: string): Promise<PluginItem> {
    return useConsoleGet(`/plugin/${id}`);
}

/**
 * 卸载插件
 * @description 根据插件ID卸载指定插件
 * @param {string} id 插件ID
 * @returns {Promise<PaginationResult<PluginItem>>} 卸载结果
 */
export function apiPostPluginDelete(id: string): Promise<PaginationResult<PluginItem>> {
    return useConsoleDelete(`/plugin/uninstall/${id}`);
}

/**
 * 创建插件
 * @description 根据插件信息创建新的插件
 * @param {PluginCreateParams} params 插件信息
 * @returns {Promise<PluginItem>} 创建的插件信息
 */
export function apiPostPluginCreate(params: PluginCreateParams): Promise<PluginItem> {
    return useConsolePost("/plugin", params);
}

// ==================== 插件包管理相关 API ====================

/**
 * 下载插件包
 * @description 根据插件ID下载插件包文件
 * @param {string} id 插件ID
 * @returns {Promise<{ filePath: string }>} 下载文件路径
 */
export function apiPostPluginDownloadPackage(id: string): Promise<{ filePath: string }> {
    return useConsolePost(`/plugin/download-package/${id}`);
}

/**
 * 插件打包
 * @description 将插件打包成可分发的包文件
 * @param {Object} params 插件包信息
 * @param {string} params.packName 包名
 * @param {string} params.version 版本号
 * @returns {Promise<{ filePath: string }>} 打包文件路径
 */
export function apiPostPluginPackage(params: {
    packName: string;
    version: string;
}): Promise<{ filePath: string }> {
    return useConsolePost(`/plugin/package`, params);
}

// ==================== 开发者相关 API ====================

/**
 * 设置开发密钥
 * @description 设置插件开发者密钥
 * @param {Object} params 开发密钥参数
 * @param {string} params.secretKey 开发密钥
 * @returns {Promise<void>} 设置结果
 */
export function apiPostDeveloperSecretSet(params: { secretKey: string }): Promise<void> {
    return useConsolePost(`/plugin/developer-secret`, params);
}

/**
 * 获取开发密钥
 * @description 获取当前设置的开发者密钥
 * @returns {Promise<{ secretKey: string }>} 开发密钥信息
 */
export function apiPostDeveloperSecretGet(): Promise<{ secretKey: string }> {
    return useConsoleGet(`/plugin/developer-secret`);
}
