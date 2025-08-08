/**
 * 终端类型
 */
export type TerminalType = "web" | "mobile";

/**
 * 布局数据接口
 */
export interface LayoutData {
    /** 布局ID */
    id?: string;
    /** 布局名称 */
    name: string;
    /** 布局配置 */
    data: Record<string, any>;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
}

/**
 * 微页面数据接口（基于后端实际字段）
 */
export interface MicropageFormData {
    /** 微页面ID */
    id?: string;
    /** 页面名称 */
    name: string;
    /** 终端类型 */
    terminal: TerminalType;
    /** 页面内容配置 */
    content: any;
    /** 页面配置 */
    configs: Record<string, any>;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    /** 删除时间 */
    deletedAt?: string;
}

/**
 * 微页面查询请求参数接口
 */
export interface MicropageQueryRequest {
    /** 页面名称（模糊查询） */
    name?: string;
    /** 终端类型 */
    terminal?: TerminalType;
}

/**
 * 创建微页面请求参数 - 排除自动生成的字段
 */
export type MicropageCreateRequest = Omit<
    MicropageFormData,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * 更新微页面请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface MicropageUpdateRequest extends Partial<MicropageCreateRequest> {}
