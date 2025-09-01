/**
 * API密钥请求
 */
export interface KeyConfigRequest {
    name: string;
    templateId?: string;
    fieldValues: FieldValues[];
    remark: string;
    status: number;
    sortOrder: number;
    [key: string]: any; // 允许动态字段
}

/**
 *
 */
export interface FieldValues {
    name: string;
    value: string;
    [key: string]: any; // 允许动态字段
}

/**
 * API密钥列表
 */
export interface ApiKeyList {
    items: KeyConfigRequest[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
