import { ClientOptions } from "openai";

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
