import type { PaginationResult } from "@/models/global";
import type {
    MenuCreateRequest,
    MenuFormData,
    MenuQueryRequest,
    MenuUpdateRequest,
} from "@/models/menu.d.ts";

// ==================== 菜单查询相关 API ====================

/**
 * 获取菜单列表
 * @description 根据查询条件分页获取菜单列表
 * @param {MenuQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<MenuFormData>>} 分页结果
 */
export function apiGetMenuList(params: MenuQueryRequest): Promise<PaginationResult<MenuFormData>> {
    return useConsoleGet("/menu", params);
}

/**
 * 获取菜单树
 * @description 根据来源类型获取菜单的树形结构
 * @param {number} sourceType 菜单树获取类型 1 系统菜单 2 插件菜单
 * @returns {Promise<MenuFormData[]>} 菜单树结构
 */
export function apiGetMenuTree(sourceType: number): Promise<MenuFormData[]> {
    return useConsoleGet("/menu/tree", { sourceType });
}

/**
 * 获取菜单详情
 * @description 根据菜单ID获取菜单的详细信息
 * @param {string} id 菜单ID
 * @returns {Promise<MenuFormData>} 菜单详情
 */
export function apiGetMenuDetail(id: string): Promise<MenuFormData> {
    return useConsoleGet(`/menu/${id}`);
}

// ==================== 菜单管理相关 API ====================

/**
 * 菜单新增
 * @description 创建新的菜单项
 * @param {MenuCreateRequest} data 创建数据
 * @returns {Promise<MenuFormData>} 创建结果
 */
export function apiCreateMenu(data: MenuCreateRequest): Promise<MenuFormData> {
    return useConsolePost("/menu", data);
}

/**
 * 菜单更新
 * @description 根据菜单ID更新菜单信息
 * @param {string} id 菜单ID
 * @param {MenuUpdateRequest} data 更新数据
 * @returns {Promise<MenuFormData>} 更新结果
 */
export function apiUpdateMenu(id: string, data: MenuUpdateRequest): Promise<MenuFormData> {
    return useConsolePut(`/menu/${id}`, data);
}

/**
 * 菜单删除
 * @description 根据菜单ID删除指定菜单
 * @param {string} id 菜单ID
 * @returns {Promise<{ message: string; success: boolean }>} 删除结果
 */
export function apiDeleteMenu(id: string): Promise<{
    message: string;
    success: boolean;
}> {
    return useConsoleDelete(`/menu/${id}`);
}

/**
 * 菜单批量删除
 * @description 根据菜单ID数组批量删除多个菜单
 * @param {Object} params 批量删除参数
 * @param {string[]} params.ids 菜单ID数组
 * @returns {Promise<{ message: string; success: boolean }>} 删除结果
 */
export function apiBatchDeleteMenu(params: { ids: string[] }): Promise<{
    message: string;
    success: boolean;
}> {
    return useConsolePost("/menu/batch-delete", params);
}
