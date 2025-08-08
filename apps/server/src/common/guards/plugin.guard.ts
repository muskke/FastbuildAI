import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { getPluginList } from "@core/plugins/plugins.module";
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";

/**
 * 插件名称守卫
 *
 * 用于验证请求中的插件名称参数是否对应一个真实存在的插件
 */
@Injectable()
export class PluginGuard implements CanActivate {
    private readonly logger = new Logger(PluginGuard.name);

    // 静态属性，用于在其他地方访问插件映射关系
    private static instance: PluginGuard;

    constructor() {
        // 保存实例引用，用于静态方法访问
        if (!PluginGuard.instance) {
            PluginGuard.instance = this;
        }
    }

    /**
     * 验证请求中的插件包名是否有效
     *
     * @param context 执行上下文
     * @returns 是否允许访问
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const pluginList = getPluginList().filter((plugin) => plugin.enabled);

        if (
            request.path.startsWith(process.env.VITE_APP_CONSOLE_API_PREFIX || "/console") ||
            request.path.startsWith(process.env.VITE_APP_WEB_API_PREFIX || "/web")
        ) {
            return true;
        }

        const pluginPackName = request.path.split("/")[1];

        if (pluginList.some((plugin) => plugin.name === pluginPackName)) {
            return true;
        } else {
            this.logger.warn(`路由不存在或者尝试访问无效的插件，插件包名为: ${pluginPackName}`);
            throw HttpExceptionFactory.notFound("The requested path does not exist.");
        }
    }
}
