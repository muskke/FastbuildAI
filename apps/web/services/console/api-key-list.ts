import type { KeyConfigRequest } from "@/models/api-key-list";

/**
 * 获取API密钥列表
 */
export const getApiKeyList = (params: {
    page: number;
    pageSize: number;
}): Promise<KeyConfigRequest> => {
    return useConsoleGet("/key-configs", params);
};

/**
 * 获取模板列表
 */
export const getApiKeyTemplateList = (params: { page: number; pageSize: number }) => {
    return useConsoleGet("/key-templates", params);
};

/**
 * 获取API密钥详情
 */
export const getApiKeyDetail = (id: string): Promise<KeyConfigRequest> => {
    return useConsoleGet(`/key-configs/${id}`);
};

/**
 * 创建API密钥
 */
export const createApiKey = (data: KeyConfigRequest) => {
    return useConsolePost("/key-configs", data);
};

/**
 * 更新API密钥
 */
export const updateApiKey = (id: string, data: KeyConfigRequest) => {
    return useConsolePatch(`/key-configs/${id}`, data);
};

/**
 * 删除API密钥
 */
export const deleteApiKey = (id: string) => {
    return useConsoleDelete(`/key-configs/${id}`);
};

/**
 * 批量删除API密钥
 */
export const deleteApiKeys = (ids: string[]) => {
    return useConsoleDelete(`/key-configs`, { ids });
};

/**
 * 更新API密钥状态
 */
export const updateApiKeyStatus = (id: string, data: { status: number }) => {
    return useConsolePatch(`/key-configs/${id}/status`, data);
};
