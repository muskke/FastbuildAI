import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * 将格式为 'key=value' 的字符串转换为对象
 *
 * @param str - 输入的字符串，格式为 'key=value' 一行一个
 * @returns 返回一个键值对组成的对象
 */

export function convertToObject(str: string): Record<string, string> {
    if (!str || !str.trim() || str === "") return {};
    const obj: Record<string, string> = {};

    // 按行拆分
    const lines = str.split("\n");

    for (const line of lines) {
        // 每行可能还包含多个 key=value 对（用 , 分隔）
        const pairs = line.split(",");

        for (const pair of pairs) {
            const [key, value] = pair.split("=").map((item) => item.trim());
            if (key && value !== undefined) {
                obj[key] = value;
            }
        }
    }

    return obj;
}

export function objectToKvString(obj: Record<string, string>): string {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
}

export type ObjectValues<T> = T[keyof T];
