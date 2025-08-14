import { ClientOptions } from "openai";

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
     * 通义千问重排功能实现 - 重写基类方法
     * 基于阿里云 DashScope 重排服务
     * 参考文档：https://help.aliyun.com/zh/model-studio/text-rerank-api
     */
    async rerankDocuments(params: RerankParams): Promise<RerankResponse> {
        try {
            // 构建请求体，严格按照阿里云文档格式
            const requestBody = {
                model: params.model || "gte-rerank-v2",
                input: {
                    query: params.query,
                    documents: params.documents,
                },
                parameters: {
                    return_documents: false, // 不返回原文档，节省带宽
                    top_n: params.top_n || params.documents.length,
                },
            };

            // 使用官方文档中的正确端点
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
                console.error("通义千问重排请求详细错误:", errorText);
                throw new Error(
                    `通义千问重排请求失败: ${response.status} ${response.statusText} - ${errorText}`,
                );
            }

            const data = await response.json();

            // 检查是否有错误码
            if (data.code) {
                throw new Error(`通义千问重排服务错误: ${data.message || data.code}`);
            }

            // 转换为标准格式，按照文档中的响应结构
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
