import type {
    CheckMcpServerConnectResponse,
    CreateMcpServerRequest,
    JsonImportMcpServerResponse,
    McpServerDetail,
    McpServerInfo,
    McpServerQueryParams,
    UpdateMcpServerRequest,
} from "@/models/mcp-server.ts";

// ==================== MCP服务器查询相关 API ====================

/**
 * 获取MCP服务器列表
 * @description 根据查询条件获取MCP服务器列表
 * @param {McpServerQueryParams} params 查询参数
 * @returns {Promise<McpServerInfo[]>} 供应商列表
 */
export function apiGetMcpServerList(params?: McpServerQueryParams): Promise<McpServerInfo[]> {
    return useConsoleGet("/ai-mcp-servers", params);
}
/**
 * 获取MCP服务器详情
 * @description 根据MCP服务器ID获取MCP服务器的基本详情信息
 * @param {string} id MCP服务器ID
 * @returns {Promise<McpServerDetail>} MCP服务器详情
 */
export function apiGetMcpServerDetail(id: string): Promise<McpServerDetail> {
    return useConsoleGet(`/ai-mcp-servers/${id}`);
}

// ==================== MCP服务器管理相关 API ====================

/**
 * 创建MCP服务器
 * @description 创建新的MCP服务器配置
 * @param {CreateMcpServerRequest} data MCP服务器创建数据
 * @returns {Promise<McpServerInfo>} 创建的MCP服务器信息
 */
export function apiCreateMcpServer(
    data:
        | CreateMcpServerRequest
        | (Omit<CreateMcpServerRequest, "args"> & { args?: Record<string, unknown> }),
): Promise<McpServerInfo> {
    return useConsolePost("/ai-mcp-servers", data);
}

/**
 * 删除MCP服务器
 * @description 根据MCP服务器ID删除指定的MCP服务器配置
 * @param {string} id MCP服务器ID
 * @returns {Promise<void>} 删除结果
 */
export function apiDeleteMcpServer(id: string): Promise<void> {
    return useConsoleDelete(`/ai-mcp-servers/${id}`);
}

/**
 * 批量删除MCP服务器
 * @description 根据MCP服务器ID数组批量删除多个MCP服务器
 * @param {string[]} ids MCP服务器ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiBatchDeleteMcpServers(ids: string[]): Promise<void> {
    return useConsolePost("/ai-mcp-servers/batch-delete", { ids });
}

/**
 * 更新MCP服务器
 * @description 根据MCP服务器ID更新MCP服务器配置信息
 * @param {string} id MCP服务器ID
 * @param {UpdateMcpServerRequest} data 更新数据
 * @returns {Promise<McpServerInfo>} 更新结果
 */
export function apiUpdateMcpServer(
    id: string,
    data:
        | UpdateMcpServerRequest
        | (Omit<CreateMcpServerRequest, "args"> & { args?: Record<string, unknown> }),
): Promise<McpServerInfo> {
    return useConsolePut(`/ai-mcp-servers/${id}`, data);
}

/**
 * json导入MCP服务器
 * @description 根据MCP服务器ID数组批量删除多个MCP服务器
 * @param {string[]} ids MCP服务器ID数组
 * @returns {Promise<void>} 删除结果
 */
export function apiJsonImportMcpServers(jsonString: string): Promise<JsonImportMcpServerResponse> {
    return useConsolePost("/ai-mcp-servers/import-json-string", { jsonString });
}

/**
 * 查询 mcp 连通性
 * @description 根据MCP服务器ID查询MCP服务器连通性
 * @param {string} id MCP服务器ID
 * @returns {Promise<McpServerInfo>} 连通性
 */
export function apiCheckMcpServerConnect(id: string): Promise<CheckMcpServerConnectResponse> {
    return useConsolePost(`/ai-mcp-servers/${id}/check-connection`);
}

/**
 * 设置快速菜单
 * @description 根据MCP服务器ID设置快速菜单
 * @param {string} id MCP服务器ID
 * @returns {Promise<void>} 设置结果
 */
export function apiSetQuickMenu(id: string): Promise<void> {
    return useConsolePost(`/ai-mcp-servers/quick-menu/${id}`);
}

/**
 * 批量查询 mcp 连通性
 * @description 根据MCP服务器ID数组批量查询MCP服务器连通性
 * @param {string[]} mcpServerIds MCP服务器ID数组
 * @returns {Promise<void>} 查询结果
 */
export function apiBatchCheckMcpServerConnect(mcpServerIds: string[]): Promise<void> {
    return useConsolePost("/ai-mcp-servers/batch-check-connection", { mcpServerIds });
}
