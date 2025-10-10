import { ClientOptions } from "openai";

import { Adapter } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class GeminiAdapter extends OpenAIAdapter implements Adapter {
    name = "gemini";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai";
        }
        super(options);
    }
}

export const gemini = (options: ClientOptions = {}) => {
    return new GeminiAdapter(options);
};
