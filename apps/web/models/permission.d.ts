/**
 * 权限实体接口
 */
export interface Permission {
    /** ID */
    id: string;
    /** 权限编码 */
    code: string;
    /** 权限名称 */
    name: string;
    /** 权限描述 */
    description?: string;
    /** 权限分组 */
    group: string;
    /** 是否废弃 */
    isDeprecated?: boolean;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
}

/**
 * API权限信息接口
 */
export interface ApiPermissionInfo {
    /** 权限编码 */
    code: string;
    /** 权限名称 */
    name: string;
    /** 权限描述 */
    description?: string;
    /** 权限分组 */
    group: string;
    /** 路由路径 */
    path: string;
    /** HTTP方法 */
    method: string;
}

/**
 * 权限同步结果接口
 */
export interface PermissionSyncResult {
    /** 新增权限数量 */
    added: number;
    /** 更新权限数量 */
    updated: number;
    /** 废弃权限数量 */
    deprecated: number;
    /** 总权限数量 */
    total: number;
}

/**
 * 权限清理结果接口
 */
export interface PermissionCleanupResult {
    /** 移除权限数量 */
    removed: number;
}

/**
 * 定义权限分组类型
 */
export interface PermissionGroup {
    code: string;
    name: string;
    permissions: Permission[];
}
