import { ClientOptions } from "openai";

import { Adapter } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class ZhipuAdapter extends OpenAIAdapter implements Adapter {
    name = "zhipu";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://open.bigmodel.cn/api/paas/v4/";
        }
        super(options);
    }
}

export const zhipu = (options: ClientOptions = {}) => {
    return new ZhipuAdapter(options);
};
