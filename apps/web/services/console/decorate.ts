import type { LayoutConfig } from "@/app/console/decorate/layout/types";
import type { LayoutData, MicropageFormData } from "@/models/decorate.d.ts";

/**
 * 根据类型获取布局配置
 * @param type 布局类型 (如: web)
 * @returns 布局配置
 */
export function apiGetLayoutConfig(type: string): Promise<LayoutData> {
    return useConsoleGet(`/decorate-page/layout/${type}`);
}

/**
 * 保存布局配置
 * @param type 布局类型 (如: web)
 * @param data 布局配置数据
 * @returns 保存结果
 */
export function apiSaveLayoutConfig(type: string, data: LayoutConfig): Promise<LayoutData> {
    return useConsolePost(`/decorate-page/layout/${type}`, data);
}

import type {
    MicropageCreateRequest,
    MicropageQueryRequest,
    MicropageUpdateRequest,
} from "@/models/decorate.d.ts";

/**
 * 获取微页面列表
 * @param params 查询参数
 * @returns 微页面列表
 */
export function apiGetMicropageList(params?: MicropageQueryRequest): Promise<MicropageFormData[]> {
    return useConsoleGet("/decorate-micropage", params);
}

/**
 * 获取微页面详情
 * @param id 微页面ID
 * @returns 微页面详情
 */
export function apiGetMicropageDetail(id: string): Promise<MicropageFormData> {
    return useConsoleGet(`/decorate-micropage/${id}`);
}

/**
 * 微页面新增
 * @param data 创建数据
 * @returns 创建结果
 */
export function apiCreateMicropage(data: MicropageCreateRequest): Promise<MicropageFormData> {
    return useConsolePost("/decorate-micropage", data);
}

/**
 * 微页面更新
 * @param id 微页面ID
 * @param data 更新数据
 * @returns 更新结果
 */
export function apiUpdateMicropage(
    id: string,
    data: MicropageUpdateRequest,
): Promise<MicropageFormData> {
    return useConsolePatch(`/decorate-micropage/${id}`, data);
}

/**
 * 设置微页面为首页
 * @param id 微页面ID
 * @returns 操作结果
 */
export function apiSetMicropageHome(id: string): Promise<{
    message: string;
    success: boolean;
}> {
    return useConsolePatch(`/decorate-micropage/home/${id}`, {});
}

/**
 * 微页面删除
 * @param id 微页面ID
 * @returns 删除结果
 */
export function apiDeleteMicropage(id: string): Promise<{
    message: string;
    success: boolean;
}> {
    return useConsoleDelete(`/decorate-micropage/${id}`);
}

/**
 * 微页面批量删除
 * @param params 批量删除参数
 * @returns 删除结果
 */
export function apiBatchDeleteMicropage(params: { ids: string[] }): Promise<{
    message: string;
    success: boolean;
}> {
    return useConsolePost("/decorate-micropage/batch-delete", params);
}
