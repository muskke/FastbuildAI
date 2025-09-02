import { ClientOptions } from "openai";
import { CreateEmbeddingResponse, EmbeddingCreateParams } from "openai/resources/index";

import { Adapter, RerankParams, RerankResponse } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class WenXinAdapter extends OpenAIAdapter implements Adapter {
    name = "wenxin";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://qianfan.baidubce.com/v2";
        }
        super(options);
    }

    async generateEmbedding(params: EmbeddingCreateParams): Promise<CreateEmbeddingResponse> {
        try {
            // 检查输入参数
            if (!params.input || (Array.isArray(params.input) && params.input.length === 0)) {
                throw new Error("输入文本不能为空");
            }

            // 检查是否为单文本模型（通过模型名称判断）
            const singleTextModels = ["tao-8k"]; // 可以根据需要扩展更多单文本模型
            const isSingleTextModel = singleTextModels.includes(params.model);
            const inputTexts = Array.isArray(params.input) ? params.input : [params.input];

            if (isSingleTextModel && inputTexts.length > 1) {
                throw new Error(`${params.model} 模型只支持单个文本输入，不支持批量处理`);
            }

            // 检查文本长度限制（单文本模型限制）
            if (isSingleTextModel) {
                const text = inputTexts[0];
                if (typeof text === "string" && text.length > 28000) {
                    throw new Error(`${params.model} 模型输入文本长度不能超过 28,000 个字符`);
                }
            }

            // 构建请求体，适配百度千帆向量接口
            const requestBody = {
                model: params.model,
                input: isSingleTextModel ? inputTexts[0] : inputTexts, // 单文本模型使用单个文本，其他模型使用数组
            };

            // 使用千帆的向量接口
            const response = await fetch(`${this.client.baseURL}/embeddings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.client.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("文心一言向量请求失败详情:", {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    requestBody,
                });
                throw new Error(`文心一言向量请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // 检查响应中的错误信息
            if (data.error_code) {
                throw new Error(`文心一言向量服务错误: ${data.error_msg || data.error_code}`);
            }

            return data;
        } catch (error) {
            console.log("error", this.client.baseURL, `Bearer ${this.client.apiKey}`);
            console.error("文心一言向量服务调用失败:", error);
            throw new Error(`文心一言向量服务调用失败: ${error.message}`);
        }
    }

    /**
     * 文心一言重排功能实现 - 重写基类方法
     * 基于百度千帆重排服务
     */
    async rerankDocuments(params: RerankParams): Promise<RerankResponse> {
        try {
            // 构建请求体，适配百度千帆重排接口
            const requestBody = {
                model: params.model || "bce-reranker-base_v1", // 文心一言重排模型
                query: params.query,
                documents: params.documents,
                top_n: params.top_n || params.documents.length,
            };

            // 使用千帆的重排接口
            const response = await fetch(`${this.client.baseURL}/rerank`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.client.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`文心一言重排请求失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // 检查响应状态
            if (data.error_code) {
                throw new Error(`文心一言重排服务错误: ${data.error_msg || data.error_code}`);
            }

            // 转换为标准格式
            const results = data.results || data.data || [];
            return {
                results: results.map((item: any, index: number) => ({
                    index: item.index !== undefined ? item.index : index,
                    relevance_score: item.relevance_score || item.score || 0,
                })),
                model: data.model || requestBody.model,
            };
        } catch (error) {
            console.error("文心一言重排服务调用失败:", error);
            throw new Error(`文心一言重排服务调用失败: ${error.message}`);
        }
    }
}

export const wenxin = (options: ClientOptions = {}) => {
    return new WenXinAdapter(options);
};
