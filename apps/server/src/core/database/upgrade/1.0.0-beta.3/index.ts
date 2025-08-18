import { Logger } from "@nestjs/common";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";

import { PageService } from "@/modules/console/decorate/services/page.service";
import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 版本 1.0.0-beta.3 升级逻辑
 */
export class Upgrade {
    private readonly logger = new Logger(Upgrade.name);
    private menuRepository: Repository<Menu>;
    private permissionService: PermissionService;
    private pageService: PageService;

    constructor(
        dataSource: DataSource,
        permissionService: PermissionService,
        pageService: PageService,
    ) {
        this.menuRepository = dataSource.getRepository(Menu);
        this.permissionService = permissionService;
        this.pageService = pageService;
    }

    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        this.logger.debug("开始执行 1.0.0-beta.3 版本升级逻辑");

        try {
            // 1. 删除所有现有菜单
            await this.deleteAllMenus();

            // 2. 重新导入菜单
            await this.reimportMenus();

            // 3. 升级前台菜单配置
            await this.upgradeHomeMenus();

            this.logger.log("✅ 1.0.0-beta.3 版本升级逻辑执行完成");
        } catch (error) {
            this.logger.error(`❌ 1.0.0-beta.3 版本升级逻辑执行失败: ${error.message}`);
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

    /**
     * 升级前台菜单配置
     */
    private async upgradeHomeMenus(): Promise<void> {
        this.logger.debug("开始升级前台菜单配置...");

        try {
            // 查找升级前台菜单配置文件
            const upgradeHomeMenuPath = this.getUpgradeHomeMenuFilePath("1.0.0-beta.3");
            if (!upgradeHomeMenuPath) {
                this.logger.log("未找到版本 1.0.0-beta.3 的升级前台菜单配置文件，跳过前台菜单升级");
                return;
            }

            // 读取升级前台菜单配置
            const upgradeHomeMenus = await fse.readJson(upgradeHomeMenuPath);
            if (!Array.isArray(upgradeHomeMenus)) {
                throw new Error("升级前台菜单配置格式不正确，应为数组格式");
            }

            this.logger.log(`读取到 ${upgradeHomeMenus.length} 个升级前台菜单项`);

            // 更新或创建前台菜单配置（增量更新）
            try {
                // 先查找是否已存在 web 页面配置
                const existingPage = await this.pageService.findOne({
                    where: { name: "web" },
                });

                if (existingPage && existingPage.data) {
                    // 如果存在，进行增量更新且查重
                    const existingData = existingPage.data as any;
                    const existingMenus = existingData.menus || [];

                    // 获取现有菜单的ID集合
                    const existingMenuIds = new Set(existingMenus.map((menu: any) => menu.id));

                    // 过滤出不重复的新菜单项
                    const newMenus = upgradeHomeMenus.filter(
                        (menu: any) => !existingMenuIds.has(menu.id),
                    );

                    if (newMenus.length > 0) {
                        // 合并菜单：现有菜单 + 新增菜单
                        const mergedMenus = [...existingMenus, ...newMenus];

                        const updatedData = {
                            ...existingData,
                            menus: mergedMenus,
                            layout: existingData.layout || "layout-5", // 保持现有布局或使用默认值
                        };

                        await this.pageService.updateById(existingPage.id, {
                            data: updatedData,
                        });
                        this.logger.log(
                            `增量更新前台菜单配置成功，新增 ${newMenus.length} 个菜单项`,
                        );
                    } else {
                        this.logger.log("所有菜单项已存在，跳过更新");
                    }
                } else {
                    // 如果不存在，创建新的配置
                    const homeMenuData = {
                        menus: upgradeHomeMenus,
                        layout: "layout-5",
                    };

                    await this.pageService.create({
                        name: "web",
                        data: homeMenuData,
                    });
                    this.logger.log(
                        `创建前台菜单配置成功，包含 ${upgradeHomeMenus.length} 个菜单项`,
                    );
                }
            } catch (error) {
                throw new Error(`前台菜单配置操作失败: ${error.message}`);
            }

            this.logger.log("✅ 前台菜单配置升级完成");
        } catch (error) {
            this.logger.error(`❌ 前台菜单配置升级失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取升级前台菜单配置文件路径
     */
    private getUpgradeHomeMenuFilePath(version: string): string | null {
        const possiblePaths = [
            path.join(process.cwd(), `data/upgrade/${version}/home-menu.json`), // 在 apps/server 目录下运行
            path.join(process.cwd(), `apps/server/data/upgrade/${version}/home-menu.json`), // 在项目根目录下运行
            path.join(__dirname, `../../../data/upgrade/${version}/home-menu.json`), // 编译后的路径
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                this.logger.log(`找到升级前台菜单配置文件: ${possiblePath}`);
                return possiblePath;
            }
        }

        this.logger.log(
            `未找到版本 ${version} 的升级前台菜单配置文件，检查路径: ${possiblePaths.join(", ")}`,
        );
        return null;
    }
}
