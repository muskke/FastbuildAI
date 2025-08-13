/**
 * MCP服务器管理相关类型定义
 *
 * @description 定义MCP服务器管理相关的数据结构和请求参数接口
 * @author FastbuildAI
 */

export enum McpServerType {
    USER = "user",
    SYSTEM = "system",
}

/**
 * MCP服务器查询参数
 */
export interface McpServerQueryParams {
    name?: string;
    isDisabled?: boolean;
    type?: McpServerType;
}

/**
 * MCP服务器信息
 */
export interface McpServerInfo {
    id: string;
    mcpServerId: string;
    name: string;
    description: string;
    icon: string;
    type: "user" | "system";
    timeout: number;
    providerName: string;
    url: string;
    sortOrder: number;
    isDisabled: boolean;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    proproviderIcon?: string;
    isShow?: boolean;
    isAssociated?: boolean;
    connectError: string;
    connectable: boolean;
    alias?: string;
    tools?: ToolsItem[];
}

export interface SystemMcpServerInfo extends McpServerInfo {
    associationId: string;
}

/**
 * MCP服务器创建参数
 */
export interface McpServerCreateParams {
    name: string;
    description: string;
    icon: string;
    providerName?: string;
    providerUrl?: string;
    url: string;
    timeout?: number;
}

/**
 * mcp 返回信息
 */
export interface McpServerResponse {
    items: McpServerInfo[] | SystemMcpServerInfo[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * 系统 mcp 创建参数
 */
export interface SystemMcpServerCreateParams {
    page: number;
    name?: string;
    pageSize?: number;
    isAssociated?: boolean;
}

/**
 * 工具信息
 */
export interface ToolInfo {
    created: number;
    deleted: number;
    total: number;
    updated: number;
}

type ToolsItem = {
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    mcpServerId: string;
    createdAt: string;
    updatedAt: string;
};

/**
 * MCP服务器连接检查返回信息
 */

export interface CheckMcpServerConnectResponse {
    connectable: boolean;
    error?: string;
    message: string;
    success: boolean;
    toolsInfo?: ToolInfo[];
}

export interface Association {
    associationId: string;
    id: string;
    name: string;
    status: string;
}

/**
 * json 导入 MCP 服务返回信息
 */
export interface JsonImportMcpServerResponse {
    results: Association[];
    message: string;
    success: boolean;
    created: number;
    updated: number;
    total: number;
}
