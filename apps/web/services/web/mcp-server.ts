import type {
    CheckMcpServerConnectResponse,
    JsonImportMcpServerResponse,
    McpServerCreateParams,
    McpServerInfo,
    McpServerQueryParams,
    McpServerResponse,
    SystemMcpServerCreateParams,
    SystemMcpServerInfo,
} from "@/models/web-mcp-server";
// ==================== MCP服务器查询相关 API ====================

/**
 * 获取MCP服务器列表
 * @description 根据查询条件获取MCP服务器列表
 * @param {McpServerQueryParams} params 查询参数
 * @returns {Promise<McpServerResponse>} MCP服务器列表
 */
export function apiGetMcpServerList(params?: McpServerQueryParams): Promise<McpServerResponse> {
    return useWebGet("/ai-mcp-servers", params, { requireAuth: true });
}

/**
 * 获取所有 mcp 列表
 * @description 获取所有 mcp 列表
 * @returns {Promise<McpServerResponse>} MCP服务器列表
 */
export function apiGetAllMcpServerList(): Promise<McpServerInfo[] | SystemMcpServerInfo[]> {
    return useWebGet("/ai-mcp-servers/all", {}, { requireAuth: true });
}

/**
 * 获取 mcp 详情
 * @description 根据MCP服务器ID获取MCP服务器详情
 * @param {string} id MCP服务器ID
 * @returns {Promise<McpServerInfo>} MCP服务器详情
 */
export function apiGetMcpServerDetail(id: string): Promise<McpServerInfo> {
    return useWebGet(`/ai-mcp-servers/${id}`);
}

/**
 * 创建MCP服务
 * @description 创建新的MCP服务器配置
 * @param {McpServerCreateParams} data MCP服务器创建数据
 * @returns {Promise<McpServerInfo>} 创建的MCP服务器信息
 */
export function apiCreateMcpServer(
    data:
        | McpServerCreateParams
        | (Omit<McpServerCreateParams, "args"> & { args?: Record<string, unknown> }),
): Promise<McpServerInfo> {
    return useWebPost("/ai-mcp-servers", data);
}

/**
 * 更新MCP服务
 * @description 根据MCP服务器ID更新MCP服务器配置信息
 * @param {string} id MCP服务器ID
 * @param {UpdateMcpServerRequest} data 更新数据
 * @returns {Promise<McpServerInfo>} 更新结果
 */
export function apiUpdateMcpServer(
    id: string,
    data:
        | McpServerCreateParams
        | (Omit<McpServerCreateParams, "args"> & { args?: Record<string, unknown> }),
): Promise<McpServerInfo> {
    return useWebPut(`/ai-mcp-servers/${id}`, data);
}

/**
 * 删除MCP服务
 * @description 根据MCP服务器ID删除MCP服务器配置信息
 * @param {string} id MCP服务器ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteMcpServer(id: string): Promise<void> {
    return useWebDelete(`/ai-mcp-servers/${id}`);
}

/**
 * 获取系统 mcp 列表
 * @description 获取系统 mcp 列表
 * @returns {Promise<McpServerResponse>} 系统 mcp 列表
 */
export function apiGetSystemMcpServerList(
    params?: SystemMcpServerCreateParams,
): Promise<McpServerResponse> {
    return useWebGet("/ai-mcp-servers/system-mcp", params);
}

/**
 * 添加系统 mcp
 * @description 添加系统 mcp
 * @param {string} id MCP服务器ID
 * @returns {Promise<void>} 添加结果
 */
export function apiAddSystemMcpServer(mcpServerId: string): Promise<{ message: string }> {
    return useWebPost("/ai-mcp-servers/user-servers", { mcpServerId });
}

/**
 * 移除系统 mcp
 * @description 移除系统 mcp
 * @param {string} id MCP服务器ID
 * @returns {Promise<{ message: string }>} 移除结果
 */
export function apiRemoveSystemMcpServer(id: string): Promise<{ message: string }> {
    return useWebDelete(`/ai-mcp-servers/${id}`);
}

/**
 * 更新MCP服务
 * @description 根据MCP服务ID更新MCP服务配置信息
 * @param {string} id MCP服务ID
 * @param {Object} data 更新数据
 * @returns {Promise<McpServerInfo>} 更新结果
 */
export function apiUpdateMcpServerVisible(
    id: string,
    data: { status: boolean },
): Promise<McpServerInfo> {
    return useWebPut(`/ai-mcp-servers/${id}/toggle-disabled`, data);
}

/**
 * 获取系统 mcp 详情
 * @description 获取系统 mcp 详情
 * @returns {Promise<SystemMcpServerInfo>} 系统 mcp 详情
 */
export function apiGetSystemMcpServerDetail(id: string): Promise<SystemMcpServerInfo> {
    return useWebGet(`/ai-mcp-servers/system-mcp/${id}`);
}

/**
 * 查询 MCP 连通性
 * @description 查询 MCP 连通性
 * @param {string} id MCP服务器ID
 * @returns {Promise<CheckMcpServerConnectResponse>} 查询结果
 */
export function apiCheckMcpServerConnect(id: string): Promise<CheckMcpServerConnectResponse> {
    return useWebPost(`/ai-mcp-servers/${id}/check-connection`);
}

/**
 * json 导入 MCP 服务
 * @description json 导入 MCP 服务
 * @param {Object} data 导入数据
 * @returns {Promise<void>} 导入结果
 */
export function apiJsonImportMcpServers(jsonString: string): Promise<JsonImportMcpServerResponse> {
    return useWebPost("/ai-mcp-servers/import-json-string", { jsonString });
}

/**
 * 批量查询 MCP 连通性
 * @description 批量查询 MCP 连通性
 * @param {string[]} mcpServerIds MCP 服务器 ID 数组
 * @returns {Promise<void>} 查询结果
 */
export function apiBatchCheckMcpServerConnect(mcpServerIds: string[]): Promise<void> {
    return useWebPost("/ai-mcp-servers/batch-check-connection", { mcpServerIds });
}
