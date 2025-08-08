import { BusinessCode, BusinessCodeType } from "@common/constants/business-code.constant";
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * HTTP状态码与业务状态码的映射关系
 */
const HTTP_STATUS_MAP: Record<number, HttpStatus> = {
    // 2xx 成功状态码
    200: HttpStatus.OK,
    201: HttpStatus.CREATED,
    202: HttpStatus.ACCEPTED,
    204: HttpStatus.NO_CONTENT,

    // 4xx 客户端错误状态码
    400: HttpStatus.BAD_REQUEST,
    401: HttpStatus.UNAUTHORIZED,
    403: HttpStatus.FORBIDDEN,
    404: HttpStatus.NOT_FOUND,
    405: HttpStatus.METHOD_NOT_ALLOWED,
    408: HttpStatus.REQUEST_TIMEOUT,
    409: HttpStatus.CONFLICT,
    422: HttpStatus.UNPROCESSABLE_ENTITY,
    429: HttpStatus.TOO_MANY_REQUESTS,

    // 5xx 服务端错误状态码
    500: HttpStatus.INTERNAL_SERVER_ERROR,
    502: HttpStatus.BAD_GATEWAY,
    503: HttpStatus.SERVICE_UNAVAILABLE,
    504: HttpStatus.GATEWAY_TIMEOUT,
};

/**
 * HTTP异常响应接口
 */
export interface HttpExceptionResponse {
    code: number;
    message: string;
    data?: any;
}

/**
 * HTTP异常类
 *
 * 扩展NestJS的HttpException，支持业务状态码
 */
export class BusinessException extends HttpException {
    /**
     * 业务状态码
     */
    private readonly businessCode: BusinessCodeType;

    /**
     * 构造函数
     *
     * @param response 异常响应对象或消息
     * @param businessCode 业务状态码
     * @param httpStatus HTTP状态码（可选，默认根据业务状态码前缀自动判断）
     */
    constructor(
        response: string | HttpExceptionResponse,
        businessCode: BusinessCodeType,
        httpStatus?: HttpStatus,
    ) {
        // 构建响应对象
        const responseObj: HttpExceptionResponse =
            typeof response === "string"
                ? { code: businessCode, message: response, data: null }
                : { ...response, code: businessCode };

        // 如果未提供HTTP状态码，则根据业务状态码自动判断
        if (!httpStatus) {
            httpStatus = getHttpStatusByBusinessCode(businessCode);
        }

        super(responseObj, httpStatus);
        this.businessCode = businessCode;
    }

    /**
     * 获取业务状态码
     */
    getBusinessCode(): BusinessCodeType {
        return this.businessCode;
    }
}

/**
 * 根据业务状态码获取对应的HTTP状态码
 *
 * @param businessCode 业务状态码
 * @returns HTTP状态码
 */
function getHttpStatusByBusinessCode(businessCode: BusinessCodeType): HttpStatus {
    const codeStr = businessCode.toString();
    const prefix = codeStr.substring(0, 1);
    const secondDigit = codeStr.substring(1, 2);

    // 成功状态码
    if (prefix === "2") {
        return HttpStatus.OK;
    }

    // 客户端错误
    if (prefix === "4") {
        // 尝试根据前两位获取HTTP状态码
        const statusKey = parseInt(`${prefix}${secondDigit}0`, 10);
        return HTTP_STATUS_MAP[statusKey] || HttpStatus.BAD_REQUEST;
    }

    // 服务端错误
    if (prefix === "5") {
        // 尝试根据前两位获取HTTP状态码
        const statusKey = parseInt(`${prefix}${secondDigit}0`, 10);
        return HTTP_STATUS_MAP[statusKey] || HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // 默认返回服务器内部错误
    return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * HTTP异常工厂
 *
 * 提供便捷的方法创建各种HTTP异常
 */
export class HttpExceptionFactory {
    /**
     * 创建业务异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码
     * @param httpStatus 可选的HTTP状态码（如果不提供，将根据业务状态码自动判断）
     * @param data 可选的额外数据
     */
    static create(
        message: string,
        businessCode: BusinessCodeType,
        httpStatus?: HttpStatus,
        data?: any,
    ): BusinessException {
        return new BusinessException(
            { code: businessCode, message, data },
            businessCode,
            httpStatus,
        );
    }

    /**
     * 创建成功响应的异常（用于提前返回）
     *
     * @param message 成功消息
     * @param data 响应数据
     */
    static success(message: string = "操作成功", data?: any): BusinessException {
        return this.create(message, BusinessCode.SUCCESS, HttpStatus.OK, data);
    }

    /**
     * 创建错误请求异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为BAD_REQUEST）
     * @param data 可选的额外数据
     */
    static badRequest(
        message: string = "错误的请求",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.BAD_REQUEST,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.BAD_REQUEST, data);
    }

    /**
     * 创建未授权异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为UNAUTHORIZED）
     * @param data 可选的额外数据
     */
    static unauthorized(
        message: string = "未授权访问",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.UNAUTHORIZED,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.UNAUTHORIZED, data);
    }

    /**
     * 创建禁止访问异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为FORBIDDEN）
     * @param data 可选的额外数据
     */
    static forbidden(
        message: string = "禁止访问",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.FORBIDDEN,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.FORBIDDEN, data);
    }

    /**
     * 创建资源不存在异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为RESOURCE_NOT_FOUND）
     * @param data 可选的额外数据
     */
    static notFound(
        message: string = "资源不存在",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.RESOURCE_NOT_FOUND,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.NOT_FOUND, data);
    }

    /**
     * 创建请求超时异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为REQUEST_TIMEOUT）
     * @param data 可选的额外数据
     */
    static timeout(
        message: string = "请求超时",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.REQUEST_TIMEOUT,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.REQUEST_TIMEOUT, data);
    }

    /**
     * 创建请求过于频繁异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为TOO_MANY_REQUESTS）
     * @param data 可选的额外数据
     */
    static tooManyRequests(
        message: string = "请求过于频繁",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.TOO_MANY_REQUESTS,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.TOO_MANY_REQUESTS, data);
    }

    /**
     * 创建服务器内部错误异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为INTERNAL_SERVER_ERROR）
     * @param data 可选的额外数据
     */
    static internal(
        message: string = "服务器内部错误",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.INTERNAL_SERVER_ERROR,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.INTERNAL_SERVER_ERROR, data);
    }

    /**
     * 创建服务不可用异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为SERVICE_UNAVAILABLE）
     * @param data 可选的额外数据
     */
    static serviceUnavailable(
        message: string = "服务不可用",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.SERVICE_UNAVAILABLE,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.SERVICE_UNAVAILABLE, data);
    }

    /**
     * 创建网关超时异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为GATEWAY_TIMEOUT）
     * @param data 可选的额外数据
     */
    static gatewayTimeout(
        message: string = "网关超时",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.GATEWAY_TIMEOUT,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.GATEWAY_TIMEOUT, data);
    }

    /**
     * 创建业务逻辑错误异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为BUSINESS_ERROR）
     * @param data 可选的额外数据
     */
    static business(
        message: string = "业务逻辑错误",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.BUSINESS_ERROR,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.BAD_REQUEST, data);
    }

    /**
     * 创建参数错误异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为PARAM_INVALID）
     * @param data 可选的额外数据
     */
    static paramError(
        message: string = "参数错误",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.PARAM_INVALID,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.BAD_REQUEST, data);
    }

    /**
     * 创建数据库错误异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为DB_QUERY_ERROR）
     * @param data 可选的额外数据
     */
    static dbError(
        message: string = "数据库错误",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.DB_QUERY_ERROR,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.INTERNAL_SERVER_ERROR, data);
    }

    /**
     * 创建第三方服务错误异常
     *
     * @param message 错误消息
     * @param businessCode 业务状态码（默认为THIRD_PARTY_SERVICE_ERROR）
     * @param data 可选的额外数据
     */
    static thirdPartyError(
        message: string = "第三方服务错误",
        data?: any,
        businessCode: BusinessCodeType = BusinessCode.THIRD_PARTY_SERVICE_ERROR,
    ): BusinessException {
        return this.create(message, businessCode, HttpStatus.BAD_GATEWAY, data);
    }
}
