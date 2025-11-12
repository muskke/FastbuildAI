import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

import { McpServerOptions, MCPTool } from "./type";

export class McpServerSSE {
    protected client: Client;
    protected transport: SSEClientTransport;
    private tools: MCPTool[] = [];
    public readonly options: McpServerOptions;

    constructor(options: McpServerOptions) {
        this.options = options;
        // Initialize MCP transport layer with custom headers support
        this.transport = new SSEClientTransport(new URL(options.url), {
            requestInit: {
                headers: options.customHeaders || {},
            },
        });

        // Initialize MCP client
        this.client = new Client(
            {
                name: "buildingai-mcp-client",
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
