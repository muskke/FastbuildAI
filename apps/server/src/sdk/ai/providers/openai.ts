import OpenAI, { ClientOptions } from "openai";
import { CreateEmbeddingResponse, EmbeddingCreateParams } from "openai/resources/embeddings";
import { ChatCompletion, ChatCompletionCreateParams } from "openai/resources/index";

import { Adapter, ProviderChatCompletionStream } from "../interfaces/adapter";

export class OpenAIAdapter implements Adapter {
    public name = "openai";
    protected client: OpenAI;

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://api.openai.com/v1";
        }
        this.client = new OpenAI(options);
    }

    validator(): void {
        if (!this.client.apiKey) {
            throw new Error("API key is required.");
        }

        if (!this.client.baseURL) {
            throw new Error("base URL is required.");
        }
    }

    async generateText(params: ChatCompletionCreateParams): Promise<ChatCompletion> {
        const response = await this.client.chat.completions.create({
            ...params,
            stream: false,
        });

        return response;
    }

    async streamText(params: ChatCompletionCreateParams): Promise<ProviderChatCompletionStream> {
        const stream = await this.client.chat.completions.create({
            ...params,
            stream: true,
            stream_options: {
                include_usage: true,
            },
        });

        return {
            [Symbol.asyncIterator]() {
                return stream[Symbol.asyncIterator]();
            },
            cancel: () => {
                stream.controller.abort();
            },
        };
    }

    async generateEmbedding(params: EmbeddingCreateParams): Promise<CreateEmbeddingResponse> {
        return await this.client.embeddings.create({
            ...params,
            model: params.model || "text-embedding-3-small",
        });
    }
}

export const openai = (options: ClientOptions = {}) => {
    return new OpenAIAdapter(options);
};
