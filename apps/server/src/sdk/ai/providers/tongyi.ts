import { ClientOptions } from "openai";

import { AIError } from "../errors/basic";
import { Adapter, RerankParams, RerankResponse } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class TongYiAdapter extends OpenAIAdapter implements Adapter {
    name = "tongyi";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
        }
        super(options);
    }

    /**
     * Tongyi Qianwen rerank implementation - overrides base class method
     * Powered by Alibaba Cloud DashScope Rerank service
     * Reference: https://help.aliyun.com/zh/model-studio/text-rerank-api
     */
    async rerankDocuments(params: RerankParams): Promise<RerankResponse> {
        try {
            // Build request body strictly following Alibaba Cloud documentation format
            const requestBody = {
                model: params.model || "gte-rerank-v2",
                input: {
                    query: params.query,
                    documents: params.documents,
                },
                parameters: {
                    return_documents: false, // Do not return original documents to save bandwidth
                    top_n: params.top_n || params.documents.length,
                },
            };

            // Use the correct endpoint per official documentation
            const response = await fetch(
                "https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.client.apiKey}`,
                    },
                    body: JSON.stringify(requestBody),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Qwen rerank request detailed error:", errorText);
                throw new AIError(
                    `Qwen rerank request failed: ${response.status} ${response.statusText} - ${errorText}`,
                    undefined,
                );
            }

            const data = await response.json();

            // Check whether the response contains an error code
            if (data.code) {
                throw new AIError(
                    `Qwen rerank service error: ${data.message || data.code}`,
                    undefined,
                );
            }

            // Normalize to the standard format according to the documented response structure
            const results = data.output?.results || [];
            return {
                results: results.map((item: any) => ({
                    index: item.index,
                    relevance_score: item.relevance_score,
                })),
                model: requestBody.model,
            };
        } catch (error) {
            console.error("通义千问重排服务调用失败:", error);
            throw new Error(`通义千问重排服务调用失败: ${error.message}`);
        }
    }
}

export const tongyi = (options: ClientOptions = {}) => {
    return new TongYiAdapter(options);
};
