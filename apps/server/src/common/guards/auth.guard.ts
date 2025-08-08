import { BusinessCode } from "@common/constants/business-code.constant";
import { AuthService } from "@common/modules/auth/auth.service";
import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { DECORATOR_KEYS } from "../constants/decorators-key.constant";
import { HttpExceptionFactory } from "../exceptions/http-exception.factory";
import { UserPlayground } from "../interfaces/context.interface";
import { getOverrideMetadata } from "../utils/helper.util";

/**
 * 统一认证守卫
 *
 * 根据请求路径自动选择合适的认证服务，验证请求中的JWT令牌，确保用户已登录
 * 并将客户端类型信息添加到用户对象中，与客户端类型守卫配合使用
 */
@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private AuthService: AuthService,
        private reflector: Reflector,
    ) {}

    /**
     * 验证用户是否有权限访问路由
     *
     * @param context 执行上下文
     * @returns 是否允许访问
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        // 检查是否为公共路由
        const isPublic = getOverrideMetadata<boolean>(
            this.reflector,
            DECORATOR_KEYS.IS_PUBLIC_KEY,
            context,
        );

        const validateTokenRes = await this.AuthService.validateToken(token);

        // 公共路由直接放行
        if (isPublic) {
            if (validateTokenRes.user) {
                request["user"] = validateTokenRes.user;
            }
            return true;
        }

        // 非公共路由且没有令牌，拒绝访问
        if (!token) {
            this.logger.warn(`No authentication token provided: ${request.method} ${request.url}`);
            throw HttpExceptionFactory.unauthorized("Please login first");
        }

        if (!validateTokenRes.isValid) {
            this.logger.warn(
                `Invalid authentication token: ${request.method} ${request.url}`,
                validateTokenRes.error,
            );
            // 根据异常类型判断具体的错误类型
            switch (validateTokenRes.errorType) {
                case "TokenExpiredError":
                    throw HttpExceptionFactory.unauthorized(
                        "Login session has expired",
                        null,
                        BusinessCode.TOKEN_EXPIRED,
                    );
                case "JsonWebTokenError":
                    throw HttpExceptionFactory.unauthorized(
                        "Invalid authentication token",
                        null,
                        BusinessCode.TOKEN_INVALID,
                    );
                case "NotBeforeError":
                    throw HttpExceptionFactory.unauthorized(
                        "Authentication token not yet valid",
                        null,
                        BusinessCode.TOKEN_INVALID,
                    );
                default:
                    throw HttpExceptionFactory.unauthorized(
                        validateTokenRes.error || "Invalid authentication token",
                        null,
                        BusinessCode.TOKEN_INVALID,
                    );
            }
        }

        // 将用户信息和客户端类型附加到请求对象上
        request["user"] = validateTokenRes.user;

        this.logger.log(
            `用户 ${validateTokenRes.user.username || validateTokenRes.user.id} 已登录`,
        );

        return true;
    }

    /**
     * 从请求头中提取令牌
     *
     * @param request 请求对象
     * @returns 提取的令牌
     */
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }
}
