import { ClientOptions } from "openai";

import { Adapter } from "../interfaces/adapter";
import { OpenAIAdapter } from "./openai";

export class WenXinAdapter extends OpenAIAdapter implements Adapter {
    name = "wenxin";

    constructor(options: ClientOptions) {
        if (!options.baseURL) {
            options.baseURL = "https://qianfan.baidubce.com/v2";
        }
        super(options);
    }
}

export const wenxin = (options: ClientOptions = {}) => {
    return new WenXinAdapter(options);
};
