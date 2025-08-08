import { PluginConfigItem } from "@common/interfaces/plugin.interface";
import { PluginFileManager } from "@common/utils/file.util";
import { isNestModule } from "@common/utils/is.util";
import { TerminalLogger } from "@common/utils/log.util";
import { getPackageJson, getPackageJsonSync } from "@common/utils/system.util";
import { table3BorderStyle } from "@fastbuildai/config/ui/table";
import { parsePackageName } from "@fastbuildai/utils";
import { DynamicModule, Injectable, Module, OnModuleInit } from "@nestjs/common";
import chalk from "chalk";
import Table from "cli-table3";
import * as fse from "fs-extra";
import * as path from "path";

import { CacheModule } from "../cache/cache.module";
import { CacheService } from "../cache/cache.service";

// 全局缓存插件信息
let cachedPluginList: PluginConfigItem[] = [];

// 插件列表缓存的键
export const PLUGIN_LIST_CACHE_KEY = "plugin_list";

/**
 * 获取插件目录路径
 *
 * @returns 插件目录的绝对路径
 */
export function getPluginsPath(): string {
    return path.resolve(process.cwd(), "dist", "plugins");
}

let showTitle = false;

/**
 * 获取插件目录下的所有插件文件夹
 *
 * @returns 插件文件夹列表
 */
export function getPluginFolders(): string[] {
    const pluginsPath = getPluginsPath();

    // 检查插件目录是否存在
    if (!fse.pathExistsSync(pluginsPath)) {
        TerminalLogger.warn("", `插件目录不存在: ${pluginsPath}`);
        return [];
    }

    const pluginItemsDir = fse.readdirSync(pluginsPath);

    const pluginItems = pluginItemsDir.filter((name) => {
        const fullPath = path.join(pluginsPath, name);
        const stat = fse.statSync(fullPath);
        // 只要是文件夹，并且不是系统隐藏文件夹
        return stat.isDirectory() && !name.startsWith(".");
    });

    return pluginItems;
}

/**
 * 加载所有插件
 *
 * 读取插件目录下的所有插件，检查插件配置文件和模块有效性，
 * 只加载启用状态的有效插件
 */
export async function loadAllPlugins() {
    // TODO： 待加入数据库查询插件启用状态
    // 记录总体开始时间
    const totalStartTime = performance.now();
    const pluginsPath = getPluginsPath();

    // 确保插件目录存在
    if (!(await fse.pathExists(pluginsPath))) {
        TerminalLogger.warn("", `Plugins directory does not exist: ${pluginsPath}`);
        TerminalLogger.log(
            "",
            `\n✔  Plugins loading completed: ${chalk.green(`${chalk.bold(0)} enabled`)} | ${chalk.bold.yellow(`Total time: 0.00ms`)}`,
        );
        return [];
    }

    const pluginItems = getPluginFolders();

    // 创建表格实例
    const table = new Table({
        chars: table3BorderStyle,
        head: [
            chalk.cyan("NAME"),
            chalk.cyan("VERSION"),
            chalk.cyan("LOAD COST"),
            chalk.cyan("STATUS"),
            chalk.cyan("MESSAGE"),
        ],
        style: {
            head: [],
            border: [],
        },
    });

    const printTitle = () => {
        if (showTitle) return;
        console.log(
            chalk.cyan(
                `\n➜  Scanned ${chalk.bold.blueBright(pluginItems.length)} plugins, starting validation...\n`,
            ),
        );
        showTitle = true;
    };

    const modules: DynamicModule[] = [];
    const validPlugins: string[] = [];
    const disabledPlugins: string[] = [];
    const invalidPlugins: string[] = [];
    const pluginList: PluginConfigItem[] = [];

    for (const pluginName of pluginItems) {
        const pluginDir = path.join(pluginsPath, pluginName);
        const configPath = path.join(pluginDir, "package.json");
        const pluginModulePath = path.join(pluginDir, "plugin-main.module");

        const validateResult = await PluginFileManager.isInvalidPluginPackage(pluginDir);

        if (validateResult.isValid) {
            printTitle();

            // 添加到表格
            table.push([
                chalk.bold.red(pluginName),
                chalk.red("v0.0.0"),
                chalk.red("-"),
                chalk.red("ERROR"),
                chalk.red(validateResult.reason),
            ]);
            invalidPlugins.push(pluginName);
            continue;
        }

        // 检查插件配置文件是否存在
        if (!(await fse.pathExists(configPath))) {
            printTitle();

            // 添加到表格
            table.push([
                chalk.bold.red(pluginName),
                chalk.red("v0.0.0"),
                chalk.red("-"),
                chalk.red("ERROR"),
                chalk.red("Missing package.json"),
            ]);
            invalidPlugins.push(pluginName);
            continue;
        }

        try {
            // 记录单个插件加载开始时间
            const pluginStartTime = performance.now();

            // 读取插件配置
            const packageJson = await getPackageJson(configPath);

            const pluginConfigItem: PluginConfigItem = {
                ...packageJson,
                name: packageJson.name,
                path: pluginDir,
            };

            pluginList.push(pluginConfigItem);

            // 检查插件是否启用
            if (!packageJson.enabled) {
                printTitle();

                // 添加到表格
                table.push([
                    chalk.bold.gray(packageJson.name),
                    chalk.magenta(`v${packageJson.version || "0.0.0"}`),
                    chalk.yellow("-"),
                    chalk.gray("DISABLED"),
                    chalk.gray("Plugin is disabled"),
                ]);
                disabledPlugins.push(packageJson.name);
                continue;
            }

            // 检查app.module.ts是否存在
            if (!(await fse.pathExists(pluginModulePath + ".js"))) {
                printTitle();

                // 添加到表格
                table.push([
                    chalk.bold.red(packageJson.name),
                    chalk.magenta(`v${packageJson.version || "0.0.0"}`),
                    chalk.yellow("-"),
                    chalk.red("ERROR"),
                    chalk.red("Missing app.module.ts"),
                ]);
                invalidPlugins.push(packageJson.name);
                continue;
            }

            // 导入插件模块
            const pluginModule = await import(pluginModulePath);

            // 验证模块是否为有效的NestJS模块
            if (!pluginModule.PluginMainModule || !isNestModule(pluginModule.PluginMainModule)) {
                printTitle();

                // 添加到表格
                table.push([
                    chalk.bold.red(packageJson.name),
                    chalk.magenta(`v${packageJson.version || "0.0.0"}`),
                    chalk.yellow("-"),
                    chalk.red("ERROR"),
                    chalk.red("Invalid NestJS module"),
                ]);
                invalidPlugins.push(packageJson.name);
                continue;
            }

            // 添加有效模块
            modules.push(pluginModule.PluginMainModule);
            validPlugins.push(packageJson.name);
            // 计算单个插件加载耗时
            const pluginEndTime = performance.now();
            printTitle();

            // 添加到表格
            table.push([
                chalk.bold.white(packageJson.name),
                chalk.magenta(`v${packageJson.version}`),
                chalk.yellow(`${(pluginEndTime - pluginStartTime).toFixed(2)}ms`),
                chalk.green("READY"),
                chalk.green("SUCCESS"),
            ]);
        } catch (error) {
            printTitle();
            const errorMessage = error.message || "Unknown error";

            // 添加到表格
            table.push([
                chalk.bold.red(pluginName),
                chalk.magenta("v0.0.0"),
                chalk.yellow("-"),
                chalk.red("ERROR"),
                chalk.red(
                    `${errorMessage.substring(0, 45)}${errorMessage.length > 45 ? "..." : ""}`,
                ),
            ]);
            invalidPlugins.push(pluginName);
        }
    }

    // 计算总耗时
    const totalEndTime = performance.now();
    const totalLoadTime = (totalEndTime - totalStartTime).toFixed(2);

    // 输出表格
    if (showTitle) {
        console.log(table.toString());
    }

    // 输出插件加载统计信息
    console.log(
        chalk.cyan(
            `\n✔  Plugins loading completed: ${chalk.green(`${chalk.bold(validPlugins.length)} enabled`)}${disabledPlugins.length ? chalk.gray(`, ${chalk.bold(disabledPlugins.length)} disabled`) : ""}${invalidPlugins.length ? chalk.yellow(`, ${invalidPlugins.length} invalid`) : ""} | ${chalk.bold.yellow(`Total time: ${totalLoadTime}ms`)}`,
        ),
    );

    // 更新插件列表缓存
    updatePluginListCache(pluginList);

    return modules;
}

// 全局缓存服务实例，用于在非依赖注入环境中访问缓存服务
let globalCacheService: CacheService | null = null;

/**
 * 设置全局缓存服务实例
 *
 * @param cacheService 缓存服务实例
 */
export function setGlobalCacheService(cacheService: CacheService): void {
    globalCacheService = cacheService;
}

/**
 * 更新插件列表缓存
 *
 * @param pluginList 插件列表，如果不提供，则自动重新加载插件目录下的插件
 */
export function updatePluginListCache(pluginList?: PluginConfigItem[]): void {
    // 如果没有提供插件列表，则自动重新加载
    if (!pluginList) {
        try {
            // 重新加载插件目录下的插件
            const pluginItems = getPluginFolders();
            const pluginsPath = getPluginsPath();

            // 收集插件信息
            const newPluginList: PluginConfigItem[] = [];

            for (const item of pluginItems) {
                const pluginPath = path.join(pluginsPath, item);
                const packageJsonPath = path.join(pluginPath, "package.json");

                if (fse.pathExistsSync(packageJsonPath)) {
                    try {
                        const packageJson = getPackageJsonSync(packageJsonPath);
                        const pluginConfigItem: PluginConfigItem = {
                            ...packageJson,
                            name: packageJson.name,
                            path: pluginPath,
                        };
                        newPluginList.push(pluginConfigItem);
                    } catch (error) {
                        TerminalLogger.error(
                            "",
                            `读取插件 ${item} 的 package.json 失败: ${error.message}`,
                        );
                    }
                }
            }

            pluginList = newPluginList;
            if (cachedPluginList.length > 0) {
                TerminalLogger.info("", `已重新加载 ${pluginList.length} 个插件`);
            }
        } catch (error) {
            TerminalLogger.error("", `重新加载插件失败: ${error.message}`);
            return;
        }
    }

    // 更新内存缓存
    cachedPluginList = pluginList;

    updateGlobalCache(pluginList);
}

const updateGlobalCache = async (pluginList: PluginConfigItem[]) => {
    // 如果全局缓存服务可用，同时更新CacheService中的缓存
    if (globalCacheService) {
        try {
            await globalCacheService.set(PLUGIN_LIST_CACHE_KEY, pluginList, 0);
            TerminalLogger.info("", `已更新插件列表缓存`);
        } catch (error) {
            TerminalLogger.error("", `更新CacheService中的插件列表缓存失败: ${error.message}`);
        }
    }
};

/**
 * 获取已加载的插件列表
 *
 * @returns 插件列表
 */
export function getPluginList(): PluginConfigItem[] {
    return cachedPluginList;
}

@Injectable()
export class PluginsCacheService implements OnModuleInit {
    constructor(private readonly cacheService: CacheService) {}

    /**
     * 模块初始化时将插件列表缓存到 CacheService
     */
    async onModuleInit() {
        try {
            // 设置全局缓存服务实例
            setGlobalCacheService(this.cacheService);

            // 将插件列表缓存到 CacheService
            await this.cacheService.set(PLUGIN_LIST_CACHE_KEY, cachedPluginList, 0);
        } catch (error) {
            TerminalLogger.error("", `缓存插件列表失败: ${error.message}`);
        }
    }

    /**
     * 刷新插件列表缓存
     *
     * 自动重新加载插件目录下的插件，并更新缓存
     */
    async refreshPluginsCache(): Promise<void> {
        // 直接调用全局方法，传入undefined表示自动重新加载
        await updatePluginListCache();
    }

    /**
     * 从 CacheService 获取插件列表
     *
     * @returns 插件列表
     */
    async getPluginsFromCache(): Promise<PluginConfigItem[]> {
        try {
            const plugins = await this.cacheService.get<PluginConfigItem[]>(PLUGIN_LIST_CACHE_KEY);
            return plugins || [];
        } catch (error) {
            TerminalLogger.error("", `从缓存获取插件列表失败: ${error.message}`);
            return [];
        }
    }
}

@Module({
    imports: [CacheModule],
    providers: [PluginsCacheService],
    exports: [PluginsCacheService],
})
export class PluginsCoreModule {
    static async register(plugins: DynamicModule[]): Promise<DynamicModule> {
        return {
            module: PluginsCoreModule,
            imports: [...plugins],
            providers: [PluginsCacheService],
            controllers: [],
            exports: [...plugins, PluginsCacheService],
        };
    }
}
