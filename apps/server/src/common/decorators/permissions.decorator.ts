import { PermissionType } from "@common/modules/auth/entities/permission.entity";
import { getPluginPackName } from "@common/utils/system.util";
import { applyDecorators, SetMetadata } from "@nestjs/common";

import { DECORATOR_KEYS } from "../constants/decorators-key.constant";

/**
 * 权限装饰器
 *
 * 用于标记控制器或路由处理程序需要的权限
 *
 * @param permissions 需要的权限列表
 * @returns 装饰器
 *
 * @example
 * ```typescript
 * @Permissions('users:create', 'users:edit')
 * @Post('users')
 * create(@Body() createUserDto: CreateUserDto) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 */
/**
 * 权限装饰器参数接口
 */
export interface PermissionOptions {
    /**
     * 权限编码
     */
    code: string;

    /**
     * 权限名称
     */
    name: string;

    /**
     * 权限描述
     */
    description?: string;

    /**
     * 操作类型
     *
     * 例如："查看"、"创建"、"编辑"、"删除"等
     */
    action?: string;

    /**
     * 权限分组
     *
     * 用于在前端界面中对权限进行分类显示
     */
    group?: string;

    /**
     * 组名
     */
    groupName?: string;

    /**
     * 权限类型
     */
    type?: PermissionType;

    /**
     * 插件包名
     *
     * 插件必传
     */
    pluginPackName?: string;
}

/**
 * 权限装饰器
 *
 * 用于标记控制器或路由处理程序需要的权限
 * 此装饰器用于主程序控制器，会自动将权限类型设置为 SYSTEM
 *
 * @param permissions 权限列表，可以是字符串数组或权限选项对象数组
 * @returns 装饰器
 *
 * @example
 * ```typescript
 *
 * // 在方法上使用，只对特定方法进行权限控制
 * @ConsoleController('role', '角色管理')
 * export class RoleController {
 *   @Get()
 *   @Permissions({
 *     code: 'role:list',
 *     name: '角色列表',
 *     action: '查看'
 *   })
 *   findAll() {
 *     return this.roleService.findAll();
 *   }
 *
 *   @Post()
 *   @Permissions({
 *     code: 'role:create',
 *     name: '创建角色',
 *     action: '创建'
 *   })
 *   create(@Body() createRoleDto) {
 *     return this.roleService.create(createRoleDto);
 *   }
 * }
 * ```
 */
export const Permissions = (...permissions: PermissionOptions[]) => {
    permissions = permissions.map((item) => {
        item.type = PermissionType.SYSTEM;
        return item;
    });

    const decorators = [SetMetadata(DECORATOR_KEYS.PERMISSIONS_KEY, permissions)];

    return applyDecorators(...decorators);
};

/**
 * 插件权限装饰器
 *
 * 用于标记插件控制器或路由处理程序需要的权限
 * 会自动添加插件名称作为权限前缀
 *
 * 例如：对于插件 "article-plugin"，使用 @PluginPermissions("users:create")
 * 实际权限会变成 "article-plugin:users:create"
 *
 * @param permissions 需要的权限列表（不包含插件前缀）
 * @returns 装饰器
 *
 * @example
 * ```typescript
 * @PluginPermissions('users:create', 'users:edit')
 * @Post('users')
 * create(@Body() createUserDto: CreateUserDto) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 */
/**
 * 插件权限装饰器
 *
 * 用于标记插件控制器或路由处理程序需要的权限
 * 会自动添加插件名称作为权限前缀
 * 会自动将权限类型设置为 PLUGIN
 * 会自动获取并设置插件包名
 *
 * @param permissions 权限列表，可以是字符串数组或权限选项对象数组
 * @returns 装饰器
 *
 * @example
 * ```typescript
 * // 假设插件包名为 article-plugin
 *
 * // 在插件控制器类上使用，定义整个控制器的权限
 * @PluginConsoleController('article', '文章管理')
 * @PluginPermissions(
 *   {
 *     code: 'article:list',
 *     name: '文章列表',
 *     action: '查看',
 *     description: '查看文章列表'
 *   },
 *   {
 *     code: 'article:create',
 *     name: '创建文章',
 *     action: '创建',
 *     description: '创建新文章'
 *   }
 * )
 * export class ArticleController {
 *   // ...
 * }
 *
 * // 在方法上使用，只对特定方法进行权限控制
 * @PluginConsoleController('category', '分类管理')
 * export class CategoryController {
 *   @Get()
 *   @PluginPermissions({
 *     code: 'category:list',
 *     name: '分类列表',
 *     action: '查看'
 *   })
 *   findAll() {
 *     return this.categoryService.findAll();
 *   }
 *
 *   @Post()
 *   @PluginPermissions({
 *     code: 'category:create',
 *     name: '创建分类',
 *     action: '创建'
 *   })
 *   create(@Body() createCategoryDto) {
 *     return this.categoryService.create(createCategoryDto);
 *   }
 * }
 *
 * // 注意：实际生成的权限会自动添加插件包名作为前缀
 * // 例如：'article:list' 会变成 'article-plugin:article:list'
 * ```
 */
export const PluginPermissions = (...permissions: PermissionOptions[]) => {
    const pluginName = getPluginPackName();

    permissions = permissions.map((item) => {
        item.type = PermissionType.PLUGIN;
        item.pluginPackName = pluginName;
        return item;
    });

    const decorators = [SetMetadata(DECORATOR_KEYS.PLUGIN_PERMISSIONS_KEY, permissions)];

    return applyDecorators(...decorators);
};
