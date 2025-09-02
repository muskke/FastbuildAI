/**
 * MCP服务器管理相关类型定义
 *
 * @description 定义MCP服务器管理相关的数据结构和请求参数接口
 * @author FastbuildAI
 */
import type { UserInfo } from "./user";

/**
 * MCP工具调用记录接口
 */
export interface McpToolCall {
    id?: string;
    mcpServer?: McpServerInfo;
    tool?: Omit<McpServerTool, "id" | "createdAt" | "updatedAt" | "mcpServerId">;
    /** 工具输入参数 */
    input?: Record<string, any>;
    /** 工具输出结果 */
    output?: Record<string, any>;
    /** 调用时间戳 */
    timestamp?: number;
    /** 执行状态 */
    status?: "success" | "error";
    /** 错误信息（如果有） */
    error?: string;
    /** 执行耗时（毫秒） */
    duration?: number;
}

/**
 * Mcp服务器列表接口
 */
export interface McpServerInfo {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    env: Record<string, unknown>;
    args: Record<string, unknown>;
    isActive: boolean;
    isPublic: boolean;
    providerName: string;
    providerUrl: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user: UserInfo;
}

/**
 * Mcp服务器查询参数接口
 */
export interface McpServerQueryParams {
    /**
     * 状态
     */
    isActive?: boolean;
    /**
     * 名称
     */
    name?: string;
    /**
     * 类型
     */
    type?: string;
    /**
     * 用户id
     */
    userId?: string;
    [property: string]: any;
}

/**
 * Mcp服务器详情接口
 */
export interface McpServerDetail {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    env: Record<string, unknown>;
    args: Record<string, unknown>;
    isDisabled: boolean;
    isPublic: boolean;
    providerName: string;
    providerUrl: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user: UserInfo;
    url: string;
    timeout: number;
    connectable: boolean;
    connectError: string;
    tools: McpServerTool[];
    isQuickMenu: boolean;
    alias: string;
}

export interface McpServerTool {
    id: string;
    name: string;
    description: string;
    mcpServerId: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * 创建供应商请求参数
 */
export interface CreateMcpServerRequest {
    description: string;
    icon: string;
    isDisabled: boolean;
    name: string;
    providerName: string;
    url: string;
    sortOrder?: number;
    timeout?: number;
    jsonImport?: string;
    type?: string;
    tools?: McpServerTool[];
    isQuickMenu?: boolean;
    alias?: string;
    providerUrl?: string;
    customHeaders?: string | Record<string, string>;
}

export interface ToolInfo {
    created: number;
    deleted: number;
    total: number;
    updated: number;
}

export interface CheckMcpServerConnectResponse {
    connectable: boolean;
    error?: string;
    message: string;
    success: boolean;
    toolsInfo?: ToolInfo[];
}

export interface results {
    id: string;
    name: string;
}

/**
 * json 导入 MCP 服务返回信息
 */
export interface JsonImportMcpServerResponse {
    results: results[];
    message: string;
    success: boolean;
    created: number;
    updated: number;
    total: number;
}

export interface UpdateMcpServerRequest extends Partial<CreateMcpServerRequest> {}
