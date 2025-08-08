import type { PaginationResult } from "@/models/global";
import type {
    RoleCreateRequest,
    RoleFormData,
    RoleQueryRequest,
    RoleUpdateRequest,
} from "@/models/role.d.ts";

// ==================== 角色查询相关 API ====================

/**
 * 获取角色列表
 * @description 根据查询条件分页获取角色列表
 * @param {RoleQueryRequest} params 查询参数
 * @returns {Promise<PaginationResult<RoleFormData>>} 分页结果
 */
export function apiGetRoleList(params: RoleQueryRequest): Promise<PaginationResult<RoleFormData>> {
    return useConsoleGet("/role", params);
}

/**
 * 获取全部角色列表
 * @description 获取系统中所有角色的列表，不分页
 * @returns {Promise<RoleFormData[]>} 全部角色列表
 */
export function apiGetAllRoleList(): Promise<RoleFormData[]> {
    return useConsoleGet("/role/all");
}

/**
 * 获取角色详情
 * @description 根据角色ID获取角色的详细信息
 * @param {string} id 角色ID
 * @returns {Promise<RoleFormData>} 角色详情
 */
export function apiGetRoleDetail(id: string): Promise<RoleFormData> {
    return useConsoleGet(`/role/${id}`);
}

// ==================== 角色管理相关 API ====================

/**
 * 角色新增
 * @description 创建新的角色
 * @param {RoleCreateRequest} data 创建数据
 * @returns {Promise<RoleFormData>} 创建结果
 */
export function apiCreateRole(data: RoleCreateRequest): Promise<RoleFormData> {
    return useConsolePost("/role", data);
}

/**
 * 角色更新
 * @description 更新角色信息
 * @param {RoleUpdateRequest} data 更新数据
 * @returns {Promise<RoleFormData>} 更新结果
 */
export function apiUpdateRole(data: RoleUpdateRequest): Promise<RoleFormData> {
    return useConsolePut(`/role`, data);
}

/**
 * 角色删除
 * @description 根据角色ID删除指定角色
 * @param {string} id 角色ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteRole(id: string): Promise<void> {
    return useConsoleDelete(`/role/${id}`);
}

/**
 * 角色批量删除
 * @description 根据角色ID数组批量删除多个角色
 * @param {Object} params 删除参数
 * @param {string[]} params.ids 角色ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiBatchDeleteRole(params: { ids: string[] }): Promise<void> {
    return useConsolePost(`/role/batch-delete`, params);
}

// ==================== 权限管理相关 API ====================

/**
 * 角色分配权限
 * @description 为指定角色分配权限
 * @param {Object} data 分配权限数据
 * @param {string} data.id 角色ID
 * @param {string[]} data.permissionIds 权限ID数组
 * @returns {Promise<RoleFormData>} 更新后的角色信息
 */
export function apiAssignPermissions(data: {
    id: string;
    permissionIds: string[];
}): Promise<RoleFormData> {
    return useConsolePut(`/role/permissions`, data);
}
