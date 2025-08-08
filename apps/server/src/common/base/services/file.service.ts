import { DictCacheService } from "@common/modules/dict/services/dict-cache.service";
import { joinPaths } from "@common/utils/helper.util";
import { Injectable, Logger } from "@nestjs/common";

/**
 * 存储引擎类型常量
 */
export const STORAGE_ENGINE = {
    /** 本地存储 */
    LOCAL: "local",
    // 后续可扩展其他存储引擎，如：
    // OSS: "oss",
    // S3: "s3",
    // COS: "cos",
} as const;

/**
 * 存储配置接口
 */
export interface StorageConfig {
    /** 存储引擎类型 */
    engine: (typeof STORAGE_ENGINE)[keyof typeof STORAGE_ENGINE];
    /** 域名 */
    domain?: string;
    // 后续可扩展其他配置项，如：
    // accessKey?: string;
    // secretKey?: string;
    // bucket?: string;
    // region?: string;
}

/**
 * 文件服务
 *
 * 用于处理文件路径的存储和获取，支持多种存储引擎
 */
@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(private readonly dictCacheService: DictCacheService) {}

    /**
     * 设置文件路径，去除域名部分，只保留相对路径
     *
     * @param url 完整的文件URL
     * @returns 处理后的相对路径
     */
    async set(url: string): Promise<string> {
        if (!url) {
            return "";
        }

        try {
            const config = await this.getStorageConfig();

            // 根据不同的存储引擎处理URL
            switch (config.engine) {
                case STORAGE_ENGINE.LOCAL:
                    return this.removeBaseDomain(
                        url,
                        config.domain || process.env.VITE_APP_BASE_URL,
                    );
                // 后续可扩展其他存储引擎的处理逻辑
                // case STORAGE_ENGINE.OSS:
                //     return this.removeBaseDomain(url, config.domain);
                default:
                    return this.removeBaseDomain(
                        url,
                        config.domain || process.env.VITE_APP_BASE_URL,
                    );
            }
        } catch (error) {
            this.logger.error(`处理文件路径失败: ${url}`, error);
            return url; // 出错时返回原始URL
        }
    }

    /**
     * 获取完整的文件URL，在相对路径前添加当前存储引擎的域名
     *
     * @param path 文件相对路径
     * @returns 完整的文件URL
     */
    async get(path: string): Promise<string> {
        if (!path) {
            return "";
        }

        // 如果已经是完整URL，直接返回
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }

        try {
            const config = await this.getStorageConfig();
            const baseDomain = config.domain || process.env.VITE_APP_BASE_URL || "";

            // 根据不同的存储引擎处理路径
            switch (config.engine) {
                case STORAGE_ENGINE.LOCAL:
                    return joinPaths(baseDomain, path);
                // 后续可扩展其他存储引擎的处理逻辑
                // case STORAGE_ENGINE.OSS:
                //     return joinPaths(config.domain, path);
                default:
                    return joinPaths(baseDomain, path);
            }
        } catch (error) {
            this.logger.error(`获取文件URL失败: ${path}`, error);
            return path; // 出错时返回原始路径
        }
    }

    /**
     * 获取存储配置
     *
     * @returns 存储配置对象
     */
    private async getStorageConfig(): Promise<StorageConfig> {
        const config = await this.dictCacheService.getGroupValues<StorageConfig>("storage_config");
        return {
            engine: config?.engine || STORAGE_ENGINE.LOCAL,
            domain: config?.domain || process.env.VITE_APP_BASE_URL,
        };
    }

    /**
     * 从URL中移除基础域名，只保留相对路径
     *
     * @param url 完整URL
     * @param baseDomain 基础域名
     * @returns 相对路径
     */
    private removeBaseDomain(url: string, baseDomain?: string): string {
        if (!url) return "";
        if (!baseDomain) return url;

        try {
            // 尝试创建URL对象
            const urlObj = new URL(url);

            // 如果URL的域名与基础域名匹配，则只返回路径部分
            if (baseDomain.includes(urlObj.hostname)) {
                // 移除开头的斜杠，确保返回的是相对路径
                return urlObj.pathname.replace(/^\//, "");
            }

            // 如果域名不匹配，可能是外部资源，返回完整URL
            return url;
        } catch (error) {
            // 如果URL解析失败，可能是相对路径，直接返回
            if (url.startsWith(baseDomain)) {
                return url.substring(baseDomain.length).replace(/^\//, "");
            }
            return url;
        }
    }
}
