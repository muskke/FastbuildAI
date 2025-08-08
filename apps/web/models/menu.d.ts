/**
 * 菜单表单数据接口
 */
export interface MenuFormData {
    /** ID */
    id?: string;
    /** 菜单来源类型：1-系统菜单，2-插件菜单 */
    sourceType: number;
    /** 插件标识 */
    pluginPackName: string;
    /** 菜单名称 */
    name: string;
    /** 菜单路径 */
    path?: string;
    /** 菜单图标 */
    icon?: string;
    /** 菜单类型：0-目录，1-菜单，2-按钮 */
    type: number;
    /** 父级菜单ID */
    parentId: string | number | null;
    /** 权限编码 */
    permissionCode?: string;
    /** 排序 */
    sort?: number;
    /** 是否隐藏：0-显示，1-隐藏 */
    isHidden?: number;
    /** 组件路径 */
    component?: string;
    /** 子菜单 */
    children?: MenuFormData[];
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
}

/**
 * 菜单查询请求参数接口
 */
export interface MenuQueryRequest extends PaginationRequest {
    /** 菜单名称 */
    name?: string;
    /** 菜单类型 */
    type?: number | null;
    /** 父级菜单ID */
    parentId?: string | null;
}

/**
 * 菜单创建请求参数 - 排除自动生成的字段和子菜单
 */
export type MenuCreateRequest = Omit<MenuFormData, "id" | "createdAt" | "updatedAt" | "children">;

/**
 * 菜单更新请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface MenuUpdateRequest extends Partial<MenuCreateRequest> {}
