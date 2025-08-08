import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Permission, PermissionType } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Like, Repository } from "typeorm";

import { initJsonMenu, installJsonConfig } from "../plugin/utils/plugin.util";
import { CreateMenuDto, QueryMenuDto, UpdateMenuDto } from "./dto";
import { Menu, MenuSourceType } from "./entities/menu.entity";

/**
 * 菜单服务
 */
@Injectable()
export class MenuService extends BaseService<Menu> {
    /**
     * 构造函数
     */
    constructor(
        @InjectRepository(Menu)
        private readonly menuRepository: Repository<Menu>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {
        super(menuRepository);
    }

    /**
     * 创建菜单
     *
     * @param createMenuDto 创建菜单DTO
     * @returns 创建的菜单
     */
    async create(createMenuDto: CreateMenuDto): Promise<Partial<Menu>> {
        // 检查权限编码是否存在
        if (createMenuDto.permissionCode) {
            const permission = await this.permissionRepository.findOne({
                where: {
                    code: createMenuDto.permissionCode,
                    isDeprecated: false,
                },
            });

            if (!permission) {
                throw HttpExceptionFactory.badRequest(
                    `权限编码 ${createMenuDto.permissionCode} 不存在`,
                );
            }
        }

        // 检查父级菜单是否存在
        if (createMenuDto.parentId) {
            const parentMenu = await this.menuRepository.findOne({
                where: { id: createMenuDto.parentId },
            });

            if (!parentMenu) {
                throw HttpExceptionFactory.badRequest(`父级菜单 ${createMenuDto.parentId} 不存在`);
            }
        }

        // 检查插件菜单必须提供插件标识
        if (createMenuDto.sourceType === MenuSourceType.PLUGIN && !createMenuDto.pluginPackName) {
            throw HttpExceptionFactory.badRequest("插件菜单必须提供插件标识");
        }

        // 创建菜单
        return super.create(createMenuDto);
    }

    /**
     * 更新菜单
     *
     * @param id 菜单ID
     * @param updateMenuDto 更新菜单DTO
     * @returns 更新后的菜单
     */
    async updateById(id: string, updateMenuDto: UpdateMenuDto): Promise<Partial<Menu>> {
        // 检查菜单是否存在
        const menu = await this.menuRepository.findOne({
            where: { id },
        });

        if (!menu) {
            throw HttpExceptionFactory.notFound(`菜单 ${id} 不存在`);
        }

        // 检查权限编码是否存在
        if (updateMenuDto.permissionCode) {
            const permission = await this.permissionRepository.findOne({
                where: {
                    code: updateMenuDto.permissionCode,
                    isDeprecated: false,
                },
            });

            if (!permission) {
                throw HttpExceptionFactory.badRequest(
                    `权限编码 ${updateMenuDto.permissionCode} 不存在`,
                );
            }
        }

        if (!updateMenuDto.parentId) {
            updateMenuDto.parentId = null;
        }

        // 检查父级菜单是否存在
        if (updateMenuDto.parentId) {
            // 不能将自己设为自己的父级
            if (updateMenuDto.parentId === id) {
                throw HttpExceptionFactory.badRequest("不能将自己设为自己的父级菜单");
            }

            const parentMenu = await this.menuRepository.findOne({
                where: { id: updateMenuDto.parentId },
            });

            if (!parentMenu) {
                throw HttpExceptionFactory.badRequest(`父级菜单 ${updateMenuDto.parentId} 不存在`);
            }

            // 检查是否形成循环引用
            let currentParentId = parentMenu.parentId;
            while (currentParentId) {
                if (currentParentId === id) {
                    throw HttpExceptionFactory.badRequest(
                        "不能将子菜单设为父级菜单，这会导致循环引用",
                    );
                }

                const parent = await this.menuRepository.findOne({
                    where: { id: currentParentId },
                });

                if (!parent) {
                    break;
                }

                currentParentId = parent.parentId;
            }
        }

        // 检查插件菜单必须提供插件标识
        if (
            updateMenuDto.sourceType === MenuSourceType.PLUGIN &&
            updateMenuDto.pluginPackName === ""
        ) {
            throw HttpExceptionFactory.badRequest("插件菜单必须提供插件标识");
        }

        // 如果更改菜单来源类型为插件，但没有提供插件标识，则使用原来的插件标识
        if (
            updateMenuDto.sourceType === MenuSourceType.PLUGIN &&
            !updateMenuDto.pluginPackName &&
            !menu.pluginPackName
        ) {
            throw HttpExceptionFactory.badRequest("插件菜单必须提供插件标识");
        }

        // 更新菜单
        return super.updateById(id, updateMenuDto);
    }

    /**
     * 查询菜单列表
     *
     * @param queryMenuDto 查询菜单DTO
     * @returns 菜单列表和分页信息
     */
    async list(queryMenuDto: QueryMenuDto) {
        const { name, type, parentId, sourceType, pluginPackName } = queryMenuDto;

        // 构建查询条件
        const where: any = {};

        if (name) {
            where.name = Like(`%${name}%`);
        }

        if (type !== undefined) {
            where.type = type;
        }

        if (parentId !== undefined) {
            where.parentId = parentId;
        }

        if (sourceType !== undefined) {
            where.sourceType = sourceType;
        }

        if (pluginPackName) {
            where.pluginPackName = pluginPackName;
        }

        // 查询菜单列表
        return this.paginate(queryMenuDto, {
            where,
            order: { sort: "DESC", createdAt: "DESC" },
        });
    }

    /**
     * 获取菜单树
     *
     * @param sourceType 菜单来源类型，可选
     * @returns 菜单树
     */
    async getMenuTree(sourceType?: MenuSourceType): Promise<Menu[]> {
        // 构建查询条件
        const where: any = {};

        if (sourceType !== undefined) {
            where.sourceType = sourceType;
        }

        // 查询所有菜单
        const menus = await this.menuRepository.find({
            where,
            order: { sort: "ASC", createdAt: "DESC" },
        });

        // 构建菜单树
        return this.buildMenuTree(menus);
    }

    /**
     * 初始化菜单数据
     *
     * @param menuData 菜单数据数组
     * @param pluginPackName 插件包名，用于替换菜单配置中的变量
     * @param userId 用户ID
     * @returns 初始化结果
     */
    async initMenu(
        menuData: initJsonMenu[],
        userId: string,
        pluginPackName: string,
    ): Promise<Menu[]> {
        // 查找 app-center 父级菜单
        const appCenterMenu = await this.menuRepository.findOne({
            where: { code: "app-center" },
        });

        if (!appCenterMenu) {
            throw HttpExceptionFactory.notFound("应用中心菜单(app-center)不存在");
        }

        const createdMenus: Menu[] = [];

        // 处理每个菜单项
        for (const item of menuData) {
            // 替换菜单项中的 ${pluginPackName} 变量
            const processedItem = this.processMenuItemVariables(item, pluginPackName);

            // 生成唯一的 code
            const menuCode =
                processedItem.code ||
                `${pluginPackName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // 构建菜单数据
            const menuDto: CreateMenuDto = {
                name: processedItem.name,
                path: processedItem.path,
                icon: processedItem.icon,
                component: processedItem.component,
                permissionCode: processedItem.permissionCode,
                sort: processedItem.sort || 0,
                isHidden: processedItem.isHidden,
                type: processedItem.type,
                sourceType: processedItem.sourceType,
                pluginPackName: pluginPackName, // 统一使用传入的插件包名
                parentId: appCenterMenu.id, // 设置父级菜单为 app-center
                code: menuCode,
            };

            try {
                // 检查菜单是否已存在
                const existingMenu = menuCode
                    ? await this.menuRepository.findOne({
                          where: { code: menuCode },
                      })
                    : null;

                let menu: Menu;
                if (existingMenu) {
                    // 更新已存在的菜单
                    menu = await this.updateMenuForInit(existingMenu.id, menuDto, userId);
                    this.logger.log(`更新菜单: ${menu.name}`);
                } else {
                    // 创建新菜单
                    menu = await this.createMenuForInit(menuDto, userId);
                    this.logger.log(`创建菜单: ${menu.name}`);
                }

                createdMenus.push(menu);

                // 递归处理子菜单
                if (processedItem.children && processedItem.children.length > 0) {
                    for (const child of processedItem.children) {
                        // 替换子菜单项中的 ${pluginPackName} 变量
                        const processedChild = this.processMenuItemVariables(child, pluginPackName);

                        // 为子菜单生成唯一的 code
                        const childMenuCode =
                            processedChild.code ||
                            `${pluginPackName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                        // 构建子菜单数据
                        const childMenuDto: CreateMenuDto = {
                            name: processedChild.name,
                            path: processedChild.path,
                            icon: processedChild.icon,
                            component: processedChild.component,
                            permissionCode: processedChild.permissionCode,
                            sort: processedChild.sort || 0,
                            isHidden: processedChild.isHidden,
                            type: processedChild.type,
                            sourceType: processedChild.sourceType,
                            pluginPackName: pluginPackName, // 统一使用传入的插件包名
                            parentId: menu.id, // 设置父级为当前创建的菜单
                            code: childMenuCode,
                        };

                        // 检查子菜单是否已存在
                        const existingChildMenu = childMenuCode
                            ? await this.menuRepository.findOne({
                                  where: { code: childMenuCode },
                              })
                            : null;

                        if (existingChildMenu) {
                            // 更新已存在的子菜单
                            const updatedChildMenu = await this.updateMenuForInit(
                                existingChildMenu.id,
                                childMenuDto,
                                userId,
                            );
                            this.logger.log(`更新子菜单: ${updatedChildMenu.name}`);
                            createdMenus.push(updatedChildMenu);
                        } else {
                            // 创建新子菜单
                            const newChildMenu = await this.createMenuForInit(childMenuDto, userId);
                            this.logger.log(`创建子菜单: ${newChildMenu.name}`);
                            createdMenus.push(newChildMenu);
                        }
                    }
                }
            } catch (error) {
                this.logger.error(`初始化菜单失败: ${processedItem.name}`, error.message);
                throw HttpExceptionFactory.internal(`初始化菜单失败: ${error.message}`);
            }
        }

        return createdMenus;
    }

    /**
     * 专门用于菜单初始化的创建方法，直接操作数据库而不通过 BaseService 的 create 方法
     * @param menuDto 菜单数据
     * @returns 创建的菜单实体
     */
    private async createMenuForInit(menuDto: CreateMenuDto, userId: string): Promise<Menu> {
        // 如果有权限编码，先检查权限是否存在，不存在则创建
        if (menuDto.permissionCode) {
            await this.ensurePermissionExists(
                menuDto.permissionCode,
                menuDto.name,
                menuDto.pluginPackName,
                userId,
            );
        }

        // 创建菜单实体
        const menu = new Menu();
        Object.assign(menu, menuDto);

        // 保存到数据库
        return await this.menuRepository.save(menu);
    }

    /**
     * 专门用于菜单初始化的更新方法，直接操作数据库而不通过 BaseService 的 updateById 方法
     * @param id 菜单ID
     * @param menuDto 菜单数据
     * @returns 更新后的菜单实体
     */
    private async updateMenuForInit(
        id: string,
        menuDto: CreateMenuDto,
        userId: string,
    ): Promise<Menu> {
        // 查找现有菜单
        const existingMenu = await this.menuRepository.findOne({ where: { id } });
        if (!existingMenu) {
            throw HttpExceptionFactory.notFound(`菜单不存在: ${id}`);
        }

        // 如果有权限编码，先检查权限是否存在，不存在则创建
        if (menuDto.permissionCode) {
            await this.ensurePermissionExists(
                menuDto.permissionCode,
                menuDto.name,
                menuDto.pluginPackName,
                userId,
            );
        }

        // 更新菜单实体
        Object.assign(existingMenu, menuDto);

        // 保存到数据库
        return await this.menuRepository.save(existingMenu);
    }

    /**
     * 确保权限存在，如果不存在则创建
     * @param code 权限编码
     * @param name 权限名称（取自菜单名称）
     * @param pluginPackName 插件包名
     */
    private async ensurePermissionExists(
        code: string,
        name: string,
        pluginPackName: string,
        userId: string,
    ): Promise<void> {
        // 查找权限是否存在
        const permission = await this.permissionRepository.findOne({
            where: { code },
        });

        // 如果权限不存在，则创建
        if (!permission) {
            this.logger.log(`创建权限: ${code}`);
            const newPermission = new Permission();
            newPermission.code = code;
            newPermission.name = `${name}权限`;
            newPermission.description = `菜单 ${name} 的访问权限`;
            newPermission.type = PermissionType.PLUGIN; // 插件权限
            newPermission.pluginPackName = pluginPackName;

            // 保存新权限
            const savedPermission = await this.permissionRepository.save(newPermission);

            // 查找用户及其角色
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ["role"],
            });

            if (user && user.role) {
                // 查找角色的完整信息，包括已有权限
                const role = await this.roleRepository.findOne({
                    where: { id: user.role.id },
                    relations: ["permissions"],
                });

                if (role) {
                    // 将新权限添加到角色的权限列表中
                    if (!role.permissions) {
                        role.permissions = [];
                    }

                    // 检查权限是否已存在于角色中
                    const permissionExists = role.permissions.some(
                        (p) => p.id === savedPermission.id,
                    );

                    if (!permissionExists) {
                        // 添加新权限到角色
                        role.permissions.push(savedPermission);

                        // 保存更新后的角色
                        await this.roleRepository.save(role);
                        this.logger.log(`已将权限 ${code} 分配给角色 ${role.name}`);
                    }
                }
            }
        }
    }

    /**
     * 处理菜单项中的变量替换，将 ${pluginPackName} 替换为实际的插件包名
     * @param menuItem 菜单项
     * @param pluginPackName 实际的插件包名
     * @returns 处理后的菜单项
     */
    private processMenuItemVariables(menuItem: initJsonMenu, pluginPackName: string): initJsonMenu {
        if (!pluginPackName) {
            return menuItem;
        }

        // 创建一个新对象，避免修改原始对象
        const processedItem = { ...menuItem };

        // 替换字符串字段中的变量
        const stringFields = [
            "name",
            "path",
            "icon",
            "component",
            "permissionCode",
            "code",
        ] as const;

        for (const field of stringFields) {
            if (typeof processedItem[field] === "string" && processedItem[field]) {
                // 使用类型断言来确保类型安全
                const value = processedItem[field] as string;
                processedItem[field] = value.replace(
                    /\$\{pluginPackName\}/g,
                    pluginPackName,
                ) as any; // 使用 any 类型来解决类型限制
            }
        }

        // 递归处理子菜单
        if (processedItem.children && processedItem.children.length > 0) {
            processedItem.children = processedItem.children.map((child) =>
                this.processMenuItemVariables(child, pluginPackName),
            );
        }

        return processedItem;
    }

    /**
     * 批量删除菜单
     *
     * @param ids 菜单ID数组
     * @returns 删除结果
     */
    async batchDelete(ids: string[]): Promise<void> {
        // 检查是否有子菜单
        for (const id of ids) {
            const children = await this.menuRepository.find({
                where: { parentId: id },
            });

            if (children.length > 0) {
                const menu = await this.menuRepository.findOne({
                    where: { id },
                });
                throw HttpExceptionFactory.badRequest(
                    `菜单"${menu?.name || id}"下存在子菜单，无法删除`,
                );
            }
        }

        // 批量删除
        await this.deleteMany(ids);
    }

    /**
     * 构建菜单树
     *
     * @param menus 菜单列表
     * @param parentId 父级菜单ID
     * @returns 菜单树
     */
    private buildMenuTree(menus: Menu[], parentId: string | null = null): Menu[] {
        const result: Menu[] = [];

        // 如果没有指定 parentId，则找出根节点
        if (parentId === null) {
            // 找出在当前菜单列表中没有父级菜单的菜单作为根节点
            const menuIds = new Set(menus.map((menu) => menu.id));
            const rootMenus = menus.filter(
                (menu) => menu.parentId === null || !menuIds.has(menu.parentId),
            );

            // 递归构建每个根节点的子树
            for (const rootMenu of rootMenus) {
                const children = this.buildMenuTree(menus, rootMenu.id);
                if (children.length > 0) {
                    rootMenu.children = children;
                }
                result.push(rootMenu);
            }
        } else {
            // 找出当前层级的菜单
            const currentLevelMenus = menus.filter((menu) => menu.parentId === parentId);

            // 递归构建子菜单
            for (const menu of currentLevelMenus) {
                const children = this.buildMenuTree(menus, menu.id);
                if (children.length > 0) {
                    menu.children = children;
                }
                result.push(menu);
            }
        }

        return result;
    }
}
