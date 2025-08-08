import type { UpdateWxOaConfigDto, WxOaConfig } from "@/models/oaconfig.d.ts";

/**
 * 获取公众号配置
 * @returns 公众号配置
 */
export function apiGetWxOaConfig(): Promise<WxOaConfig> {
    return useConsoleGet("/wxoaconfig");
}

/**
 * 更新公众号配置
 */
export function apiUpdateWxOaConfig(data: UpdateWxOaConfigDto): Promise<WxOaConfig> {
    return useConsolePatch("/wxoaconfig", data);
}
