import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

import { HttpExceptionFactory } from "../exceptions/http-exception.factory";

/**
 * 公开智能体访问令牌守卫
 * 验证请求头中的 accessToken
 */
@Injectable()
export class PublicAccessTokenGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        // 从请求头中获取 accessToken
        const accessToken = this.extractTokenFromHeader(request);

        if (!accessToken) {
            throw HttpExceptionFactory.unauthorized("缺少访问令牌");
        }

        // 验证 accessToken 格式
        if (!this.isValidAccessToken(accessToken)) {
            throw HttpExceptionFactory.unauthorized("无效的访问令牌格式");
        }

        // 将 accessToken 附加到请求对象上，供控制器使用
        request.accessToken = accessToken;

        return true;
    }

    /**
     * 从请求头中提取访问令牌
     */
    private extractTokenFromHeader(request: Request): string | undefined {
        // 优先从自定义头获取
        const publicAccessTokenHeader = request.headers["x-public-access-token"] as string;
        if (publicAccessTokenHeader) {
            return publicAccessTokenHeader;
        }

        // 备用：从 x-access-token 头获取
        const accessTokenHeader = request.headers["x-access-token"] as string;
        if (accessTokenHeader) {
            return accessTokenHeader;
        }

        // 备用：从查询参数获取（不推荐，但为了兼容性）
        const accessTokenQuery = request.query.accessToken as string;
        if (accessTokenQuery) {
            return accessTokenQuery;
        }

        return undefined;
    }

    /**
     * 验证访问令牌格式
     */
    private isValidAccessToken(token: string): boolean {
        // 基本格式验证：64个十六进制字符
        return /^[a-f0-9]{64}$/i.test(token);
    }
}

// 扩展 Request 接口以包含 accessToken
declare module "express-serve-static-core" {
    interface Request {
        accessToken?: string;
    }
}
