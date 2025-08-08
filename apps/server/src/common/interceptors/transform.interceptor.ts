import { FileService } from "@common/base/services/file.service";
import { BusinessCode } from "@common/constants/business-code.constant";
import {
    FILE_URL_METADATA_KEY,
    FileUrlConfig,
    FileUrlFieldConfig,
} from "@common/decorators/file-url.decorator";
import { SKIP_TRANSFORM_KEY } from "@common/decorators/skip-transform.decorator";
import { FileUrlProcessorUtil } from "@common/utils/file-url-processor.util";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";

import { Response } from "../interfaces/response.interface";

/**
 * 全局响应转换拦截器
 *
 * 将所有接口响应统一转换为标准的 RESTful 格式
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    constructor(
        private readonly reflector: Reflector,
        private readonly fileService: FileService,
    ) {}
    /**
     * 拦截器处理方法
     *
     * @param context 执行上下文
     * @param next 调用处理器
     * @returns 统一格式的响应数据
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        // 检查是否跳过响应转换
        const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 如果标记为跳过，直接返回原始数据
        if (skipTransform) {
            return next.handle();
        }

        // 获取响应对象
        const response = context.switchToHttp().getResponse();
        // 获取状态码（默认为200）
        const statusCode = response.statusCode || 200;

        return next.handle().pipe(
            mergeMap(async (data) => {
                // 如果是删除操作且没有返回数据，则返回成功信息
                if (statusCode === 204 && !data) {
                    return {
                        code: BusinessCode.SUCCESS,
                        message: "ok",
                        data: null,
                        timestamp: Date.now(),
                    };
                }

                // 如果响应已经是标准格式，则不做处理
                if (data && typeof data === "object" && "code" in data && "message" in data) {
                    return data;
                }

                // 返回统一格式的响应，使用业务状态码
                return {
                    code: BusinessCode.SUCCESS, // 统一使用成功状态码
                    message: "ok",
                    data: await this.buildFileUrl(data, context),
                    timestamp: Date.now(),
                };
            }),
        );
    }

    /**
     * 构建文件URL
     *
     * @param responseData 响应数据
     * @param context 执行上下文
     * @returns 处理后的响应数据
     */
    private async buildFileUrl(responseData: any, context: ExecutionContext): Promise<any> {
        if (!responseData) {
            return responseData;
        }

        // 获取控制器方法上的文件URL配置
        const fileUrlConfig = this.reflector.get<FileUrlConfig>(
            FILE_URL_METADATA_KEY,
            context.getHandler(),
        );

        if (!fileUrlConfig || !fileUrlConfig.fields || fileUrlConfig.fields.length === 0) {
            return responseData;
        }
        // 处理文件URL字段
        return await this.processFileUrlFields(responseData, fileUrlConfig.fields);
    }

    /**
     * 处理文件URL字段（高性能版本）
     *
     * @param data 数据对象
     * @param fields 需要处理的字段配置
     * @returns 处理后的数据
     */
    private async processFileUrlFields(
        data: any,
        fields: (string | FileUrlFieldConfig)[],
    ): Promise<any> {
        if (!data || typeof data !== "object") {
            return data;
        }

        // 转换字段配置为字符串数组
        const fieldPatterns = fields.map((field) =>
            typeof field === "string" ? field : field.field,
        );

        // 使用高性能处理工具
        const result = await FileUrlProcessorUtil.processFieldsEfficiently(
            data,
            fieldPatterns,
            async (path: string) => await this.fileService.get(path),
        );

        // 定期清理缓存以避免内存泄漏
        FileUrlProcessorUtil.cleanupCache(1000);

        return result;
    }

    /**
     * 处理单个字段
     *
     * @param obj 对象
     * @param fieldPath 字段路径
     * @param isArray 是否为数组字段
     */
    private async processField(obj: any, fieldPath: string, isArray?: boolean): Promise<void> {
        if (!obj || typeof obj !== "object") {
            return;
        }

        // 处理通配符路径，如 'items.*.image'
        if (fieldPath.includes("*")) {
            await this.processWildcardField(obj, fieldPath);
            return;
        }

        // 处理嵌套路径，如 'user.avatar'
        const pathParts = fieldPath.split(".");
        let current = obj;

        // 导航到目标字段的父对象
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part] || typeof current[part] !== "object") {
                return; // 路径不存在，跳过
            }
            current = current[part];
        }

        const finalKey = pathParts[pathParts.length - 1];
        const value = current[finalKey];

        if (value === undefined || value === null) {
            return;
        }

        // 处理数组字段
        if (isArray && Array.isArray(value)) {
            current[finalKey] = await Promise.all(
                value.map(async (item) => {
                    if (typeof item === "string") {
                        return await this.fileService.get(item);
                    }
                    return item;
                }),
            );
        } else if (typeof value === "string") {
            // 处理单个字符串字段
            current[finalKey] = await this.fileService.get(value);
        }
    }

    /**
     * 处理通配符字段路径
     *
     * @param obj 对象
     * @param fieldPath 包含通配符的字段路径
     */
    private async processWildcardField(obj: any, fieldPath: string): Promise<void> {
        const pathParts = fieldPath.split(".");
        const wildcardIndex = pathParts.findIndex((part) => part === "*");

        if (wildcardIndex === -1) {
            return;
        }

        // 获取通配符前的路径
        const beforeWildcard = pathParts.slice(0, wildcardIndex);
        // 获取通配符后的路径
        const afterWildcard = pathParts.slice(wildcardIndex + 1);

        // 导航到通配符位置的父对象
        let current = obj;
        for (const part of beforeWildcard) {
            if (!current[part] || typeof current[part] !== "object") {
                return;
            }
            current = current[part];
        }

        // 如果当前对象是数组，处理每个元素
        if (Array.isArray(current)) {
            for (const item of current) {
                if (item && typeof item === "object") {
                    const remainingPath = afterWildcard.join(".");
                    await this.processField(item, remainingPath);
                }
            }
        }
    }
}
