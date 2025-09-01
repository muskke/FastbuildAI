/**
 * API密钥模板创建/更新请求
 */
export interface KeyTemplateRequest {
    id: string;
    fieldConfig: FieldConfig[];
    icon: string;
    isEnabled: number;
    name: string;
    sortOrder: number;
    type: string;
    keyConfigs: KeyConfig[];
    createdAt: string;
    updatedAt: string;
}

/**
 * 字段配置
 */
export interface FieldConfig {
    name: string;
    placeholder: string;
    required: boolean;
    type: string;
}

/**
 * API密钥配置
 */
export interface KeyConfig {
    id: string;
    name: string;
    templateId: string;
    fieldValues: { name: string; value: string }[];
    remark: string;
    status: number;
    lastUsedAt: string | null;
    usageCount: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * API密钥模板列表
 */
export interface KeyTemplateList {
    items: KeyTemplateRequest[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/**
 * API密钥模板列表参数
 */
export interface KeyTemplateListParams {
    name?: string;
    page: number;
    pageSize: number;
}
