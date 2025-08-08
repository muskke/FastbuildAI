// ==================== 权限查询相关 API ====================

import type {
    ApiPermissionInfo,
    Permission,
    PermissionCleanupResult,
    PermissionGroup,
    PermissionSyncResult,
} from "@/models/permission";

/**
 * 获取所有带权限编码的接口信息
 * @description 扫描并获取系统中所有带权限编码的API接口信息
 * @param {boolean} group 是否进行分组，默认为 true
 * @returns {Promise<ApiPermissionInfo[] | Record<string, ApiPermissionInfo[]>>} 接口权限信息列表或分组后的接口权限信息
 */
export function apiGetAllApiPermissions(
    group: boolean = true,
): Promise<ApiPermissionInfo[] | Record<string, ApiPermissionInfo[]>> {
    return useConsoleGet(`/permission/scan-permissions?group=${group}`);
}

/**
 * 获取所有权限列表
 * @description 根据查询条件获取权限列表，支持分组显示
 * @param {Object} params 查询参数
 * @param {string} params.type 权限类型
 * @param {string} params.group 权限分组
 * @param {string} params.keyword 关键词搜索
 * @param {boolean} params.isDeprecated 是否包含废弃权限
 * @param {boolean} params.isGrouped 是否分组显示
 * @returns {Promise<Permission[] | PermissionGroup[]>} 权限列表或分组后的权限列表
 */
export function apiGetPermissionList(params?: {
    type?: string;
    group?: string;
    keyword?: string;
    isDeprecated?: boolean;
    isGrouped?: boolean;
}): Promise<Permission[] | PermissionGroup[]> {
    return useConsoleGet("/permission/list", params);
}

/**
 * 获取所有带权限的API接口信息
 * @description 扫描并获取系统中所有带权限的API接口信息
 * @param {boolean} group 是否进行分组，默认为 true
 * @returns {Promise<ApiPermissionInfo[] | Record<string, ApiPermissionInfo[]>>} API接口信息列表或分组后的API接口信息
 */
export function apiGetApiRouterList(
    group: boolean = true,
): Promise<ApiPermissionInfo[] | Record<string, ApiPermissionInfo[]>> {
    return useConsoleGet(`/permission/scan-api?group=${group}`);
}

/**
 * 根据编码查询权限详情
 * @description 根据权限编码获取权限的详细信息
 * @param {string} code 权限编码
 * @returns {Promise<Permission>} 权限详情
 */
export function apiGetPermissionByCode(code: string): Promise<Permission> {
    return useConsoleGet(`/permission/${code}`);
}

// ==================== 权限管理相关 API ====================

/**
 * 同步API权限到数据库
 * @description 扫描系统API接口，将权限信息同步到数据库
 * @returns {Promise<PermissionSyncResult>} 同步结果
 */
export function apiSyncApiPermissions(): Promise<PermissionSyncResult> {
    return useConsolePost("/permission/sync");
}

/**
 * 清理废弃的权限
 * @description 清理系统中已废弃或不再使用的权限数据
 * @returns {Promise<PermissionCleanupResult>} 清理结果
 */
export function apiCleanupDeprecatedPermissions(): Promise<PermissionCleanupResult> {
    return useConsolePost("/permission/cleanup");
}
