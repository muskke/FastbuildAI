// ==================== 用户查询相关 API ====================

import type { RoleFormData } from "@/models";
import type { ACTION_VALUE } from "@/models/account-balance";
import type { PaginationResult } from "@/models/global";
import type {
    UserCreateRequest,
    UserInfo,
    UserQueryRequest,
    UserUpdateRequest,
} from "@/models/user";

/**
 * 获取用户列表
 * @description 根据查询条件分页获取用户列表
 * @param {UserQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<UserInfo>>} 分页结果
 */
export function apiGetUserList(params: UserQueryRequest): Promise<PaginationResult<UserInfo>> {
    return useConsoleGet("/users", params);
}

/**
 * 获取用户角色列表
 * @description 获取系统中所有角色的列表，不分页
 * @returns {Promise<RoleFormData[]>} 全部角色列表
 */
export function apiGetUserRolesList(): Promise<RoleFormData[]> {
    return useConsoleGet("/users/roles");
}

/**
 * 获取用户详情
 * @description 根据用户ID获取用户的详细信息
 * @param {string} id 用户ID
 * @returns {Promise<UserInfo>} 用户详情
 */
export function apiGetUserDetail(id: string): Promise<UserInfo> {
    return useConsoleGet(`/users/${id}`);
}

// ==================== 用户管理相关 API ====================

/**
 * 创建用户
 * @description 创建新的用户账户
 * @param {UserCreateRequest} data 创建数据
 * @returns {Promise<UserInfo>} 创建结果
 */
export function apiCreateUser(data: UserCreateRequest): Promise<UserInfo> {
    return useConsolePost("/users", data);
}

/**
 * 更新用户
 * @description 根据用户ID更新用户信息
 * @param {string} id 用户ID
 * @param {UserUpdateRequest} data 更新数据
 * @returns {Promise<UserInfo>} 更新结果
 */
export function apiUpdateUser(id: string, data: UserUpdateRequest): Promise<UserInfo> {
    return useConsolePatch(`/users/${id}`, data);
}

/**
 * 删除用户
 * @description 根据用户ID删除单个用户
 * @param {string} id 用户ID
 * @returns {Promise<{ success: boolean }>} 删除结果
 */
export function apiDeleteUser(id: string): Promise<{ success: boolean }> {
    return useConsoleDelete(`/users/${id}`);
}

/**
 * 批量删除用户
 * @description 根据用户ID数组批量删除多个用户
 * @param {string[]} ids 用户ID数组
 * @returns {Promise<{ success: boolean }>} 删除结果
 */
export function apiBatchDeleteUser(ids: string[]): Promise<{ success: boolean }> {
    return useConsolePost("/users/batch-delete", { ids });
}

// ==================== 用户操作相关 API ====================

/**
 * 重置用户密码
 * @description 管理员重置指定用户的密码
 * @param {string} id 用户ID
 * @param {string} password 新密码
 * @returns {Promise<{ success: boolean }>} 重置结果
 */
export function apiResetUserPassword(id: string, password: string): Promise<{ success: boolean }> {
    return useConsolePost(`/users/reset-password/${id}`, { password });
}

/**
 * 设置用户状态
 * @description 设置用户的启用/禁用状态
 * @param {string} id 用户ID
 * @param {number} status 状态值
 * @returns {Promise<UserInfo>} 更新结果
 */
export function apiSetUserStatus(id: string, status: number): Promise<UserInfo> {
    return useConsolePost(`/users/status/${id}`, { status });
}

/**
 * 更新算力
 * @description 更新指定用户的算力
 * @param {string} id 用户ID
 * @param {number} amount 算力值
 * @returns {Promise<UserInfo>} 更新结果
 */
export function apiUpdateUserAmount(
    id: string,
    amount: number,
    action: ACTION_VALUE,
): Promise<UserInfo> {
    return useConsolePost(`/users/change-balance/${id}`, { amount, action });
}
