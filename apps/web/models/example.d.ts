export interface ExampleQueryRequest extends ExtendedBaseQueryParams {
    // 所有常用的查询字段都已在 ExtendedBaseQueryParams 中定义
}

export interface ExampleFormData {
    /** ID */
    id?: number | string;
    /** 名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 状态：1-启用，0-禁用 */
    status: number;
    /** 图片 */
    image: string;
    /** 多图片 */
    images: string[];
    /** 内容 */
    content?: string;
    /** 标签 */
    tags: string[];
    /** 水果选择 */
    fruits?: string[];
    /** 分类 */
    category?: string;
    /** 优先级 */
    priority?: number;
    /** 发布日期 */
    publishDate?: string;
    /** 发布时间 */
    publishTime?: string;
    /** 开始日期 */
    startDate?: string;
    /** 结束日期 */
    endDate?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    /** 用户信息 */
    creator?: Record<string, any>;
    [key: string]: any;
}

/**
 * 示例创建请求参数 - 排除自动生成的字段
 */
export type ExampleCreateRequest = Omit<
    ExampleFormData,
    "id" | "createdAt" | "updatedAt" | "creator"
>;

/**
 * 示例更新请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface ExampleUpdateRequest extends Partial<ExampleCreateRequest> {
    /** 示例ID（更新时必需） */
    id: string | number;
}
