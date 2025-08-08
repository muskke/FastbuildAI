import { ResponseSchema } from "../types";

/**
 * 处理响应数据
 * @param responseData 原始响应数据
 * @param returnFullResponse 是否返回完整响应
 * @returns 处理后的响应数据
 */
export function handleResponse<T>(
    responseData: ResponseSchema<T>, 
    returnFullResponse = false
): T | ResponseSchema<T> {
    return returnFullResponse ? responseData : responseData.data as T;
} 