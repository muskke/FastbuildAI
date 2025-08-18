import { BusinessCode } from "../constants";
import { ResponseSchema } from "../types";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { useUserStore } from "@/common/stores/user";
import type { Composer } from "vue-i18n";

/**
 * 错误处理器
 * 负责HTTP状态码错误和业务错误码的处理
 */
export class ErrorHandler {
    /** 全局自定义业务状态码处理器 */
    private customCodeHandler: ((status: number, response: ResponseSchema) => void) | null = null;

    /**
     * 设置自定义状态码处理器
     * @param handler 状态码处理函数
     */
    setCustomCodeHandler(handler: (status: number, response: ResponseSchema) => void): void {
        this.customCodeHandler = handler;
    }

    /**
     * 处理HTTP状态码错误
     * @param status HTTP状态码
     * @param responseData 响应数据
     */
    handleHttpError(status: number, responseData: ResponseSchema): void {
        const response = responseData as ResponseSchema;
        const errorMessage = response?.message || "Unknown error";
        const errorPath = response?.path ? ` (${response.path})` : "";

        const { $i18n } = useNuxtApp();
        const t = ($i18n as Composer).t;

        switch (status) {
            case 400:
                useMessage().error(`Bad Request: ${errorMessage}${errorPath}`, {
                    title: t("console-common.request.400"),
                });
                throw new Error(`Bad Request: ${errorMessage}${errorPath}`);

            case 401:
                // 未授权401
                useMessage().error(`Unauthorized: ${errorMessage}`, {
                    title: t("console-common.request.401"),
                });
                useUserStore().toLogin();
                throw new Error(`Unauthorized: ${errorMessage}${errorPath}`);

            case 403:
                useMessage().error(`Forbidden: ${errorMessage}${errorPath}`, {
                    title: t("console-common.request.403"),
                });
                throw new Error(`Forbidden: ${errorMessage}${errorPath}`);

            case 404:
                useMessage().error(`Not Found: ${errorMessage}${errorPath}`, {
                    title: t("console-common.request.404"),
                });
                throw new Error(`Not Found: ${status}: ${errorMessage}${errorPath}`);

            default:
                throw new Error(`HTTP Error ${status}: ${errorMessage}${errorPath}`);
        }
    }

    /**
     * 处理业务状态码错误
     * @param code 业务状态码
     * @param response 响应数据
     */
    handleBusinessError(code: number, response: ResponseSchema): void {
        // 成功状态码处理
        if (code === BusinessCode.SUCCESS.code) {
            return; // 业务状态码正常，不需要处理
        }

        // 获取错误信息
        let errorMessage = response?.message || `未知错误，错误码: ${code}`;
        const errorPath = response?.path ? ` (${response.path})` : "";

        // 根据错误码匹配错误信息
        Object.values(BusinessCode).forEach((businessError) => {
            if (
                businessError &&
                typeof businessError === "object" &&
                "code" in businessError &&
                businessError.code === code
            ) {
                errorMessage = businessError.message;
            }
        });

        // 抛出业务错误
        throw new Error(`${errorMessage}${errorPath}`);
    }

    /**
     * 处理完整的错误流程
     * @param status HTTP状态码
     * @param response 响应数据
     * @param skipBusinessCheck 是否跳过业务状态码检查
     */
    handle(status: number, response: ResponseSchema, skipBusinessCheck = false): void {
        // 处理 HTTP 状态码
        if (status < 200 || status >= 300) {
            return this.handleHttpError(status, response);
        }

        // 1. 全局自定义业务状态码处理
        this.customCodeHandler && this.customCodeHandler(response.code, response);

        // 2. 系统级业务状态码处理
        !skipBusinessCheck && this.handleBusinessError(response.code, response);
    }
}
