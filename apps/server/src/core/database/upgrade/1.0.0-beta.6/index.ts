import { Logger } from "@nestjs/common";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";

import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.6 升级逻辑
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);
    private menuRepository: Repository<Menu>;
    private permissionService: PermissionService;

    constructor(dataSource: DataSource, permissionService: PermissionService) {
        this.menuRepository = dataSource.getRepository(Menu);
        this.permissionService = permissionService;
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.6 版本升级逻辑");

        try {
            // 1. 删除所有现有菜单
            await this.deleteAllMenus();

            // 2. 重新导入菜单
            await this.reimportMenus();

            this.logger.debug("✅ 1.0.0-beta.6 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.6 版本升级逻辑执行失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 删除所有菜单
     */
    private async deleteAllMenus(): Promise<void> {
        this.logger.log("开始删除所有现有菜单...");

        try {
            // 获取所有菜单数量
            const totalCount = await this.menuRepository.count();
            this.logger.log(`发现 ${totalCount} 个菜单项需要删除`);

            if (totalCount > 0) {
                // 递归删除所有菜单（先删除子菜单，再删除父菜单）
                await this.deleteMenusRecursively();
                this.logger.log("✅ 所有菜单已删除");
            } else {
                this.logger.log("未发现需要删除的菜单");
            }
        } catch (error) {
            this.logger.error(`删除菜单失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 删除所有菜单
     */
    private async deleteMenusRecursively(): Promise<void> {
        this.logger.log("开始删除所有菜单...");

        try {
            // 直接清空菜单表
            await this.menuRepository.clear();
            this.logger.log("✅ 菜单删除完成");
        } catch (error) {
            this.logger.error(`菜单删除失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 重新导入菜单
     */
    private async reimportMenus(): Promise<void> {
        this.logger.log("开始重新导入菜单...");

        try {
            // 从 JSON 文件读取菜单数据（复用 database-init.service.ts 的逻辑）
            const menuFilePath = this.getMenuFilePath();

            if (!menuFilePath) {
                throw new Error("无法找到 menu.json 文件");
            }

            const initialMenus = await fse.readJson(menuFilePath);
            this.logger.log(`从配置文件读取到 ${initialMenus.length} 个顶级菜单`);

            // 使用递归方式保存树形菜单数据
            await this.saveMenuTree(initialMenus);

            this.logger.log("✅ 菜单重新导入完成");
        } catch (error) {
            this.logger.error(`重新导入菜单失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取菜单配置文件路径
     */
    private getMenuFilePath(): string | null {
        const possiblePaths = [
            path.join(process.cwd(), "src/core/database/install/menu.json"), // 在 apps/server 目录下运行
            path.join(process.cwd(), "apps/server/src/core/database/install/menu.json"), // 在项目根目录下运行
            path.join(__dirname, "../../install/menu.json"), // 编译后的路径
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                this.logger.log(`找到菜单配置文件: ${possiblePath}`);
                return possiblePath;
            }
        }

        this.logger.error(`未找到菜单配置文件，检查路径: ${possiblePaths.join(", ")}`);
        return null;
    }

    /**
     * 递归保存菜单树（复用 database-init.service.ts 的逻辑）
     */
    private async saveMenuTree(menuItems: any[], parentId: string | null = null): Promise<void> {
        for (const menuItem of menuItems) {
            // 提取子菜单
            const { children, ...menuData } = menuItem;

            // 设置父级ID
            menuData.parentId = parentId;

            // 处理权限编码：空字符串转换为null
            if (menuData.permissionCode === "" || menuData.permissionCode === undefined) {
                menuData.permissionCode = null;
            }

            // 检查权限编码是否存在
            if (menuData.permissionCode) {
                try {
                    // 尝试查询权限编码是否存在
                    const permissionExists = await this.permissionService.findByCodeSafe(
                        menuData.permissionCode,
                    );

                    if (!permissionExists) {
                        // 如果权限编码不存在，则设置为 null
                        this.logger.warn(
                            `权限编码 ${menuData.permissionCode} 不存在，已设置为 null`,
                        );
                        menuData.permissionCode = null;
                    }
                } catch (error) {
                    // 查询失败时，安全起见设置为 null
                    this.logger.error(`检查权限编码失败: ${error.message}`);
                    menuData.permissionCode = null;
                }
            }

            // 处理插件标识：空字符串转换为null
            if (menuData.pluginPackName === "" || menuData.pluginPackName === undefined) {
                menuData.pluginPackName = null;
            }

            // 保存当前菜单项
            const savedMenu = await this.menuRepository.save(menuData);
            this.logger.log(`保存菜单: ${menuData.name} (${savedMenu.id})`);

            // 如果有子菜单，递归保存
            if (children && children.length > 0) {
                await this.saveMenuTree(children, savedMenu.id);
            }
        }
    }
}
