import type {
    KeyTemplateFormData,
    KeyTemplateList,
    KeyTemplateListParams,
    KeyTemplateRequest,
} from "@/models/key-templates";

/**
 * 创建API密钥模板
 */
export const createApiKeyType = (data: KeyTemplateFormData) => {
    return useConsolePost("/key-templates", data);
};

/**
 * 获取API密钥模板列表（分页）
 */
export const getApiKeyTypeList = (params: KeyTemplateListParams): Promise<KeyTemplateList> => {
    return useConsoleGet("/key-templates", params);
};

/**
 * 获取API密钥模板列表（不分页）
 */
export const getApiKeyTypeListAll = (): Promise<KeyTemplateRequest[]> => {
    return useConsoleGet("/key-templates/enabled/all");
};

/**
 * 更新API密钥模板
 */
export const updateApiKeyType = (id: string, data: KeyTemplateFormData) => {
    return useConsolePatch(`/key-templates/${id}`, data);
};

/**
 * 获取API密钥模板详情
 */
export const getApiKeyTypeDetail = (id: string): Promise<KeyTemplateRequest> => {
    return useConsoleGet(`/key-templates/${id}`);
};

/**
 * 删除API密钥模板
 */
export const deleteApiKeyType = (id: string) => {
    return useConsoleDelete(`/key-templates/${id}`);
};

/**
 * 修改API密钥模板状态
 */
export const updateApiKeyTypeStatus = (id: string, data: { isEnabled: number }) => {
    return useConsolePatch(`/key-templates/${id}/enabled`, data);
};

/**
 * 导入API密钥模板
 */
export const importApiKeyType = (data: { jsonData: string }) => {
    return useConsolePost("/key-templates/import/json", data);
};
