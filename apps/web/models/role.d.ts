export interface RoleQueryRequest extends BaseQueryParams {
    /** 角色名称（精确匹配） */
    name?: string;
    /** 角色描述（模糊匹配） */
    description?: string;
}

export interface RoleFormData {
    /** ID */
    id?: string;
    /** 名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 角色关联的权限ID列表 */
    permissions: Permission[];
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
}

/**
 * 角色创建请求参数
 */
export type RoleCreateRequest = Omit<
    RoleFormData,
    "id" | "createdAt" | "updatedAt" | "permissions"
>;

/**
 * 角色更新请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface RoleUpdateRequest extends Partial<RoleCreateRequest> {
    /** 角色ID（更新时必需） */
    id: string;
}
