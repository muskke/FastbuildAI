import { DECORATOR_KEYS } from "@common/constants/decorators-key.constant";
import { joinRouterPaths } from "@common/utils/helper.util";
import { validatePath } from "@common/utils/path-validator.util";
import { getPluginPackName } from "@common/utils/system.util";
import { applyDecorators, Controller, SetMetadata } from "@nestjs/common";

/**
 * 插件控制器选项接口
 */
export interface PluginControllerOptions {
    /**
     * 控制器路径
     */
    path?: string;

    /**
     * 是否跳过认证
     */
    skipAuth?: boolean;
}

/**
 * 插件API控制器装饰器
 *
 * 用于标记控制器为插件前台API控制器，自动添加路由前缀
 * 路由格式：/{pluginPackName}/web/{controllerPath}
 *
 * @example
 * ```typescript
 * // 假设插件包名为 article-plugin
 *
 * // 基本用法 - 使用路径字符串
 * @PluginWebController('article')
 * export class ArticleController {
 *   // 生成路由: /article-plugin/web/article
 *   @Get()
 *   findAll() {
 *     return this.articleService.findAll();
 *   }
 * }
 *
 * // 使用选项对象
 * @PluginWebController({
 *   path: 'comment',
 *   skipAuth: false // 需要认证（默认）
 * })
 * export class CommentController {
 *   // 生成路由: /article-plugin/web/comment
 *   @Post()
 *   create(@Playground() playground, @Body() createCommentDto) {
 *     return this.commentService.create({
 *       ...createCommentDto,
 *       userId: playground.userId
 *     });
 *   }
 * }
 *
 * // 公开接口（跳过认证）
 * @PluginWebController({
 *   path: 'public',
 *   skipAuth: true
 * })
 * export class PublicController {
 *   // 生成路由: /article-plugin/web/public
 *   // 此路由不需要认证
 *   @Get('categories')
 *   getCategories() {
 *     return this.categoryService.findAll();
 *   }
 * }
 * ```
 */
export function PluginWebController(
    optionsOrPath?: PluginControllerOptions | string,
): ClassDecorator {
    const options: PluginControllerOptions =
        typeof optionsOrPath === "string" ? { path: optionsOrPath } : optionsOrPath || {};

    const pluginPackName = getPluginPackName();
    const pathSegment = options.path || "";

    // 校验路径是否包含非法字符
    if (pathSegment) {
        validatePath(pathSegment, {
            errorMessage: `插件前台控制器路径 "${pathSegment}" 包含非法字符。路径中不允许包含 "/" 和 ":" 字符。`,
        });
    }

    // 从环境变量中读取API前缀
    const apiPrefix = process.env.VITE_APP_WEB_API_PREFIX;

    // 构建完整的路由路径，如果有API前缀则添加
    const routePath = apiPrefix
        ? joinRouterPaths(pluginPackName, apiPrefix, pathSegment)
        : joinRouterPaths(pluginPackName, "api", pathSegment);

    // 创建装饰器数组
    const decorators = [
        Controller(routePath),
        // 存储插件包名元数据，以便在控制器中可以访问
        SetMetadata(DECORATOR_KEYS.PLUGIN_PACK_NAME_KEY, pluginPackName),
        SetMetadata(DECORATOR_KEYS.PLUGIN_WEB_CONTROLLER_KEY, true),
    ];

    // 添加跳过认证标记
    if (options.skipAuth === true) {
        decorators.push(SetMetadata(DECORATOR_KEYS.IS_PUBLIC_KEY, true));
    }

    // 返回组合装饰器
    return applyDecorators(...decorators);
}

/**
 * 插件控制台控制器装饰器
 *
 * 用于标记控制器为插件后台控制台控制器，自动添加路由前缀
 * 路由格式：/{pluginPackName}/console/{controllerPath}
 * 支持设置权限组别信息，将控制器路径作为权限组别的code，groupName作为组别的名称
 *
 * @example
 * ```typescript
 * // 假设插件包名为 article-plugin
 *
 * // 基本用法 - 使用路径字符串
 * @PluginConsoleController('article', '文章管理')
 * export class ArticleController {
 *   // 生成路由: /article-plugin/console/article
 *   // 生成权限组: code="article-plugin@article", name="文章管理"
 *   @Get()
 *   @PluginPermissions({
 *     code: 'article:list',
 *     name: '文章列表',
 *     action: '查看'
 *   })
 *   findAll() {
 *     return this.articleService.findAll();
 *   }
 * }
 *
 * // 使用选项对象
 * @PluginConsoleController({
 *   path: 'settings',
 *   skipAuth: false // 需要认证（默认）
 * }, '插件设置')
 * export class SettingsController {
 *   // 生成路由: /article-plugin/console/settings
 *   // 生成权限组: code="article-plugin@settings", name="插件设置"
 *   @Get()
 *   @PluginPermissions({
 *     code: 'settings:view',
 *     name: '查看设置',
 *     action: '查看'
 *   })
 *   getSettings() {
 *     return this.settingsService.getAll();
 *   }
 * }
 *
 * // 公开接口（跳过认证）
 * @PluginConsoleController({
 *   path: 'public',
 *   skipAuth: true
 * }, '公共接口')
 * export class PublicController {
 *   // 生成路由: /article-plugin/console/public
 *   // 生成权限组: code="article-plugin@public", name="公共接口"
 *   // 此路由不需要认证
 *   @Get('stats')
 *   getStats() {
 *     return this.statsService.getPublicStats();
 *   }
 * }
 * ```
 */
export function PluginConsoleController(
    optionsOrPath: PluginControllerOptions | string,
    groupName: string,
): ClassDecorator {
    const options: PluginControllerOptions =
        typeof optionsOrPath === "string" ? { path: optionsOrPath } : optionsOrPath || {};

    const pluginPackName = getPluginPackName();
    const pathSegment = options.path || "";

    // 校验路径是否包含非法字符
    if (pathSegment) {
        validatePath(pathSegment, {
            errorMessage: `插件后台控制器路径 "${pathSegment}" 包含非法字符。路径中不允许包含 "/" 和 ":" 字符。`,
        });
    }

    // 从环境变量中读取API前缀
    const apiPrefix = process.env.VITE_APP_CONSOLE_API_PREFIX;

    // 构建完整的路由路径
    const routePath = apiPrefix
        ? joinRouterPaths(pluginPackName, apiPrefix, pathSegment)
        : joinRouterPaths(pluginPackName, "consoleapi", pathSegment);

    // 创建装饰器数组
    const decorators = [
        Controller(routePath),
        // 存储插件包名元数据，以便在控制器中可以访问
        SetMetadata(DECORATOR_KEYS.PLUGIN_PACK_NAME_KEY, pluginPackName),
        SetMetadata(DECORATOR_KEYS.PLUGIN_CONSOLE_CONTROLLER_KEY, true),
    ];

    // 添加跳过认证标记
    if (options.skipAuth === true) {
        decorators.push(SetMetadata(DECORATOR_KEYS.IS_PUBLIC_KEY, true));
    }

    // 设置权限组别元数据
    decorators.push(
        SetMetadata(DECORATOR_KEYS.PERMISSION_GROUP_KEY, {
            code: `${pluginPackName}@${pathSegment}`,
            name: groupName,
        }),
    );

    // 返回组合装饰器
    return applyDecorators(...decorators);
}
