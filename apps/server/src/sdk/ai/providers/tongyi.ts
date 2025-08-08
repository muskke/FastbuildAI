import { ClientOptions } from "openai";

import { Adapter } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class TongYiAdapter extends OpenAIAdapter implements Adapter {
    name = "tongyi";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
        }
        super(options);
    }
}

export const tongyi = (options: ClientOptions = {}) => {
    return new TongYiAdapter(options);
};
