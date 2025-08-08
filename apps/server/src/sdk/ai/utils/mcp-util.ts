import OpenAI from "openai";

interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export const convertToOpenAIFunctions = (
    tools: MCPTool[],
): OpenAI.Chat.Completions.ChatCompletionTool[] => {
    return tools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema || {
                type: "object",
                properties: {},
                required: [],
            },
        },
    }));
};
