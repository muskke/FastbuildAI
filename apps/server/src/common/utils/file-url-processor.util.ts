/**
 * 文件URL处理工具类
 *
 * 提供高性能的文件URL处理功能，避免大量循环和递归导致的性能问题
 */
export class FileUrlProcessorUtil {
    /**
     * 批量处理文件URL的最大并发数
     */
    private static readonly MAX_CONCURRENT_REQUESTS = 10;

    /**
     * 缓存已处理的URL，避免重复处理
     */
    private static readonly urlCache = new Map<string, string>();

    /**
     * 批量处理文件URL
     *
     * @param urls 需要处理的URL数组
     * @param processor URL处理函数
     * @returns 处理后的URL数组
     */
    static async batchProcessUrls(
        urls: string[],
        processor: (url: string) => Promise<string>,
    ): Promise<string[]> {
        if (!urls || urls.length === 0) {
            return [];
        }

        // 去重处理
        const uniqueUrls = [...new Set(urls)];
        const results = new Map<string, string>();

        // 分批处理，避免并发过多
        for (let i = 0; i < uniqueUrls.length; i += this.MAX_CONCURRENT_REQUESTS) {
            const batch = uniqueUrls.slice(i, i + this.MAX_CONCURRENT_REQUESTS);

            const batchPromises = batch.map(async (url) => {
                // 检查缓存
                if (this.urlCache.has(url)) {
                    return { url, result: this.urlCache.get(url)! };
                }

                try {
                    const result = await processor(url);
                    // 缓存结果
                    this.urlCache.set(url, result);
                    return { url, result };
                } catch (error) {
                    // 处理失败时返回原始URL
                    return { url, result: url };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(({ url, result }) => {
                results.set(url, result);
            });
        }

        // 按原始顺序返回结果
        return urls.map((url) => results.get(url) || url);
    }

    /**
     * 清理URL缓存
     *
     * @param maxSize 缓存最大大小，超过时清理一半
     */
    static cleanupCache(maxSize: number = 1000): void {
        if (this.urlCache.size > maxSize) {
            const entries = Array.from(this.urlCache.entries());
            const keepCount = Math.floor(maxSize / 2);

            this.urlCache.clear();

            // 保留最近的一半缓存
            entries.slice(-keepCount).forEach(([key, value]) => {
                this.urlCache.set(key, value);
            });
        }
    }

    /**
     * 获取缓存统计信息
     */
    static getCacheStats(): { size: number; hitRate?: number } {
        return {
            size: this.urlCache.size,
            // 这里可以添加命中率统计
        };
    }

    /**
     * 清空所有缓存
     */
    static clearCache(): void {
        this.urlCache.clear();
    }

    /**
     * 检查字段路径是否匹配
     *
     * @param fieldPath 字段路径（支持 * 和 ** 通配符）
     * @param targetPath 目标路径
     * @returns 是否匹配
     *
     * @example
     * - "avatar" 匹配 "avatar"
     * - "*.avatar" 匹配 "user.avatar", "item.avatar"
     * - "**.avatar" 匹配 "avatar"(根层级), "user.avatar", "data.user.avatar", "items.0.user.avatar"
     * - "items.*.avatar" 匹配 "items.0.avatar", "items.user.avatar"
     */
    static isFieldPathMatch(fieldPath: string, targetPath: string): boolean {
        if (fieldPath === targetPath) {
            return true;
        }

        // 处理通配符匹配
        if (fieldPath.includes("*")) {
            // 处理深度通配符 **
            if (fieldPath.includes("**")) {
                // 特殊处理 **.fieldName 的情况，应该匹配任何层级的 fieldName，包括根层级
                if (fieldPath.startsWith("**.")) {
                    const fieldName = fieldPath.substring(3); // 去掉 "**."
                    // 匹配根层级的字段名或任意深度的字段名
                    const patterns = [
                        `^${fieldName}$`, // 根层级
                        `^.*\\.${fieldName}$`, // 任意深度
                    ];
                    return patterns.some((pattern) => new RegExp(pattern).test(targetPath));
                }

                // 其他 ** 通配符情况
                const regexPattern = fieldPath
                    .replace(/\*\*/g, "DOUBLE_WILDCARD") // 临时替换
                    .replace(/\*/g, "[^.]+") // 单个通配符匹配一层
                    .replace(/DOUBLE_WILDCARD/g, ".*"); // 双通配符匹配任意层级

                const regex = new RegExp("^" + regexPattern + "$");
                return regex.test(targetPath);
            }

            // 处理单层通配符 *
            const regex = new RegExp("^" + fieldPath.replace(/\*/g, "[^.]+") + "$");
            return regex.test(targetPath);
        }

        return false;
    }

    /**
     * 扁平化对象，提取所有可能的字段路径
     *
     * @param obj 对象
     * @param prefix 路径前缀
     * @returns 字段路径映射
     */
    static flattenObject(
        obj: any,
        prefix: string = "",
    ): Map<string, { value: any; parent: any; key: string }> {
        const result = new Map();

        if (!obj || typeof obj !== "object") {
            return result;
        }

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                const currentPath = prefix ? `${prefix}.${index}` : `${index}`;
                if (item && typeof item === "object") {
                    const nested = this.flattenObject(item, currentPath);
                    nested.forEach((value, key) => {
                        result.set(key, value);
                    });
                } else {
                    result.set(currentPath, { value: item, parent: obj, key: index });
                }
            });
        } else {
            Object.keys(obj).forEach((key) => {
                const currentPath = prefix ? `${prefix}.${key}` : key;
                const value = obj[key];

                if (value && typeof value === "object") {
                    const nested = this.flattenObject(value, currentPath);
                    nested.forEach((nestedValue, nestedKey) => {
                        result.set(nestedKey, nestedValue);
                    });
                } else {
                    result.set(currentPath, { value, parent: obj, key });
                }
            });
        }

        return result;
    }

    /**
     * 高性能字段匹配和处理
     *
     * @param data 数据对象
     * @param fieldPatterns 字段模式数组
     * @param processor 处理函数
     * @returns 处理后的数据
     */
    static async processFieldsEfficiently(
        data: any,
        fieldPatterns: string[],
        processor: (value: string) => Promise<string>,
    ): Promise<any> {
        if (!data || typeof data !== "object" || fieldPatterns.length === 0) {
            return data;
        }

        // 扁平化对象，获取所有字段路径
        const flattenedFields = this.flattenObject(data);

        // 收集需要处理的字段
        const fieldsToProcess: Array<{
            path: string;
            value: string;
            parent: any;
            key: string | number;
        }> = [];

        flattenedFields.forEach(({ value, parent, key }, path) => {
            if (typeof value === "string" && value) {
                // 检查是否匹配任何字段模式
                const matches = fieldPatterns.some((pattern) =>
                    this.isFieldPathMatch(pattern, path),
                );

                if (matches) {
                    fieldsToProcess.push({ path, value, parent, key });
                }
            }
        });

        // 批量处理所有匹配的字段
        if (fieldsToProcess.length > 0) {
            const values = fieldsToProcess.map((field) => field.value);
            const processedValues = await this.batchProcessUrls(values, processor);

            // 更新原始数据
            fieldsToProcess.forEach((field, index) => {
                field.parent[field.key] = processedValues[index];
            });
        }

        return data;
    }
}
