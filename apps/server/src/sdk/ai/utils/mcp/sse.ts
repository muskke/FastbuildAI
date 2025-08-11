import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { ChatCompletionFunctionTool } from "openai/resources/index";

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

/**
 * 将MCP工具转换为OpenAI ChatCompletionTool格式
 *
 * @param mcpTool MCP工具对象
 * @returns OpenAI ChatCompletionTool格式的工具对象
 */
export function convertMCPToolToOpenAI(mcpTool: MCPTool): ChatCompletionFunctionTool {
    return {
        type: "function",
        function: {
            name: mcpTool.name,
            description: mcpTool.description,
            parameters: mcpTool.inputSchema || {},
        },
    };
}

/**
 * 批量将MCP工具数组转换为OpenAI ChatCompletionTool格式
 *
 * @param mcpTools MCP工具数组
 * @returns OpenAI ChatCompletionTool格式的工具数组
 */
export function convertMCPToolsToOpenAI(mcpTools: MCPTool[]): ChatCompletionFunctionTool[] {
    return mcpTools.map(convertMCPToolToOpenAI);
}

export interface McpServerOptions {
    url: string;
    name?: string;
    description?: string;
    version?: string;
}

export class McpServer {
    protected client: Client;
    protected transport: SSEClientTransport;
    private tools: MCPTool[] = [];
    public readonly options: McpServerOptions;

    constructor(options: McpServerOptions) {
        this.options = options;
        // 初始化 MCP 传输层
        this.transport = new SSEClientTransport(new URL(options.url));

        // 初始化 MCP 客户端
        this.client = new Client(
            {
                name: "fastbuildai-mcp-client",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            },
        );
    }

    /**
     * 连接 MCP 服务器
     */
    async connect(): Promise<void> {
        try {
            await this.client.connect(this.transport);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * 获取 MCP 工具列表
     */
    async getToolsList(): Promise<MCPTool[]> {
        try {
            const response = await this.client.listTools();

            this.tools = response.tools.map((tool) => ({
                name: tool.name,
                description: tool.description || "",
                inputSchema: tool.inputSchema,
            }));

            return this.tools;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * 调用 MCP 工具
     */
    async callTool(name: string, arguments_: any): Promise<any> {
        try {
            const response = await this.client.callTool({
                name: name,
                arguments: arguments_,
            });

            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * 断开连接
     */
    async disconnect(): Promise<void> {
        try {
            await this.client.close();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
