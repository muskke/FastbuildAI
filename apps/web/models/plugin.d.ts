/** 插件列表请求参数 - 继承基础查询参数 */
export interface PluginQueryRequest extends BaseQueryParams {}

export interface PluginItem {
    id: string;
    name: string;
    packName: string;
    description: string;
    icon: string;
    version: string;
    isEnabled: boolean;
    error: null;
    isInstalled: boolean;
    isDownloaded: boolean;
    needRestart: boolean;
    restartReason: string;
    lastOperationAt: string;
    installedAt: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: null;
}

export interface PluginCreateParams {
    /**
     * 插件名称
     */
    name: string;

    /**
     * 插件图标
     */
    icon?: string;

    /**
     * 插件唯一标识符
     */
    packName: string;

    /**
     * 插件版本
     */
    version: string;

    /**
     * 插件描述
     */
    description?: string;
}
