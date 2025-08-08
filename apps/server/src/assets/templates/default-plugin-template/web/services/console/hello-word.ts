import type { HelloWord } from "../../models/hello-word";

/**
 * 获取启用的栏目列表
 * @returns 栏目列表
 */
export function apiGetHelloWord(params = {}): Promise<HelloWord> {
    return usePluginConsoleGet("/example-template", params);
}
