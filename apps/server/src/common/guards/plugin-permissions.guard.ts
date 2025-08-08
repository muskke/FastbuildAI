import { DECORATOR_KEYS } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { getContextPlayground, getOverrideMetadata } from "@common/utils/helper.util";
import { isEnabled } from "@common/utils/is.util";
import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

/**
 * 插件权限守卫
 *
 * 用于验证用户是否具有访问插件特定路由所需的权限
 * 会自动将插件名称添加到权限前缀
 */
@Injectable()
export class PluginPermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PluginPermissionsGuard.name);

    constructor(private readonly reflector: Reflector) {}

    /**
     * 验证用户是否具有所需权限
     *
     * @param context 执行上下文
     * @returns 是否允许访问
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 获取路由所需的插件权限（不带前缀）
        const pluginPermissions = getOverrideMetadata<string[]>(
            this.reflector,
            DECORATOR_KEYS.PLUGIN_PERMISSIONS_KEY,
            context,
        );

        // 如果没有设置插件权限要求，则允许访问
        if (!pluginPermissions || pluginPermissions.length === 0) {
            return true;
        }

        const { request, user } = getContextPlayground(context);

        // 确保用户已认证
        if (!user) {
            this.logger.warn(
                `尝试访问需要特定权限的插件路由，但用户未认证: ${request.method} ${request.url}`,
            );
            throw HttpExceptionFactory.unauthorized("请先登录");
        }

        if (isEnabled(user.isRoot)) {
            return true;
        }

        // 将插件名称添加到权限前缀
        const requiredPermissions = pluginPermissions.map((permission) => `:${permission}`);

        // 设置权限元数据，供权限守卫使用
        Reflect.defineMetadata(
            DECORATOR_KEYS.PERMISSIONS_KEY,
            requiredPermissions,
            context.getHandler(),
        );

        // 方法1：直接检查用户权限列表（JWT中）
        if (user.permissions && user.permissions.length > 0) {
            const hasDirectPermission = requiredPermissions.some((permission) =>
                user.permissions?.includes(permission),
            );

            if (hasDirectPermission) {
                return true;
            }
        }

        // 记录权限不足的情况
        this.logger.warn(
            `用户 ${user.username} (ID: ${user.id}) 尝试访问需要权限 [${requiredPermissions.join(", ")}] 的插件路由，但没有足够权限`,
        );

        // 权限不足，拒绝访问
        throw HttpExceptionFactory.forbidden("权限不足", BusinessCode.PERMISSION_DENIED);
    }
}
