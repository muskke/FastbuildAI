import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { McpServerOptions, MCPTool } from "./type";

/**
 * MCP client wrapper based on Streamable HTTP
 *
 * Goal: Provide equivalent HTTP transport implementation while maintaining identical input/output with `sse.ts`.
 */
export class McpServerHttp {
    protected client: Client;
    protected transport: StreamableHTTPClientTransport;
    private tools: MCPTool[] = [];
    public readonly options: McpServerOptions;

    constructor(options: McpServerOptions) {
        this.options = options;
        // Initialize MCP transport layer (Streamable HTTP) with custom headers support
        this.transport = new StreamableHTTPClientTransport(new URL(options.url), {
            requestInit: {
                headers: options.customHeaders || {},
            },
        });
        // Initialize MCP client
        this.client = new Client(
            {
                name: options.name || "buildingai-mcp-client",
                version: options.version || "1.0.0",
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
     * Connect to MCP server
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
     * Get MCP tools list
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
     * Call MCP tool
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
     * Disconnect from server
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
