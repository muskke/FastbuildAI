import type { HelloWord } from "../../models/hello-word";

/**
 * 获取示例
 * @returns 示例信息
 */
export function apiGetHelloWord(params = {}): Promise<HelloWord> {
    return usePluginWebGet("/example-template", params);
}
