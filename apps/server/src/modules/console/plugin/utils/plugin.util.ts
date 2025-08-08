import { PluginMinifestJson, PluginPackageJson } from "@common/interfaces/plugin.interface";
import { getTablePrefix } from "@common/utils/table-name.util";
import { parsePackageName } from "@fastbuildai/utils";
import { Logger } from "@nestjs/common";
import AdmZip from "adm-zip";
import chalk from "chalk";
import { exec } from "child_process";
import * as fse from "fs-extra";
import * as path from "path";
import { DataSource, EntitySchema } from "typeorm";

export interface initJsonMenu {
    name: string;
    path: string;
    icon: string;
    component: string;
    permissionCode: string | null;
    sort: number;
    isHidden: 0 | 1;
    type: number; // 例如：1 = 分类菜单，2 = 页面菜单
    sourceType: number; // 例如：1 = 系统菜单，2 = 插件菜单
    pluginPackName: string;
    code?: string; // 仅部分菜单项拥有唯一标识 code
    children?: initJsonMenu[]; // 嵌套子菜单
}

export interface installJsonConfig {
    menus: initJsonMenu[];
}

/**
 * 获取插件路径
 *
 * @param packName 插件包名
 */
export const getPluginPath = (packName: string) => {
    return {
        srcPath: path.join(process.cwd(), "src", "plugins", packName),
        distPath: path.join(process.cwd(), "dist", "plugins", packName),
        webPath: path.join(process.cwd(), "..", "web", "plugins", packName),
        packagePath: path.join(process.cwd(), "storage", "plugins", packName),
        tempPath: path.join(process.cwd(), "storage", "temp", packName),
    };
};

/**
 * 执行 pnpm 命令
 *
 * @param command 要执行的命令
 * @param cwd 工作目录，默认为项目根目录
 * @param silent 是否静默执行，不输出日志，默认为 false
 * @returns 执行结果
 */
export const executePnpmCommand = async (
    command: string,
    cwd: string = process.cwd(),
    silent: boolean = false,
): Promise<{ success: boolean; message: string; output?: string }> => {
    const logger = new Logger("PnpmExecutor");
    const fullCommand = `pnpm ${command}`;

    if (!silent) {
        logger.log(`开始在 ${cwd} 执行命令: ${fullCommand}`);
    }

    try {
        const output = await new Promise<string>((resolve, reject) => {
            exec(fullCommand, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    if (!silent) {
                        logger.error(`命令执行失败: ${error.message}`);
                        if (stderr) {
                            logger.error(`错误输出: ${stderr}`);
                        }
                    }
                    reject(error);
                    return;
                }

                if (!silent) {
                    logger.log("命令执行成功");
                    if (stdout && stdout.trim()) {
                        logger.verbose(`输出: ${stdout}`);
                        console.log(
                            `${chalk.blue("\n==========Print Start==========")}\n${stdout}${chalk.blue("==========Print End============\n")}`,
                        );
                    }
                }
                resolve(stdout);
            });
        });

        return { success: true, message: "命令执行成功", output };
    } catch (error) {
        return {
            success: false,
            message: `命令执行失败: ${error.message}`,
            output: error.stderr || "",
        };
    }
};

/**
 * 确保多个目录存在
 *
 * @param dirs 目录路径
 */
export const ensureDirsExist = async (dirs: string[]) => {
    await Promise.all(dirs.map((dir) => fse.ensureDir(dir)));
};

/**
 * 获取插件manifest.json
 *
 * @param dirPath 目录路径
 */
export const getPluginMinifestJson = async (
    dirPath: string,
): Promise<PluginMinifestJson | null> => {
    try {
        const minifestJsonPath = path.join(dirPath, "manifest.json");
        const exists = await fse.pathExists(minifestJsonPath);

        if (!exists) {
            return null;
        }

        return await fse.readJson(minifestJsonPath);
    } catch (error) {
        return null;
    }
};

/**
 * 解压插件包
 *
 * @param packName 插件包名
 * @returns 解压结果，成功返回true，失败返回false
 */
export const unpackPlugin = async (
    packName: string,
    pluginPackagePath?: string,
): Promise<{ success: boolean; message: string }> => {
    const rollbacks: string[] = [];
    try {
        const { packagePath, distPath, srcPath, webPath, tempPath } = getPluginPath(packName);
        const zipFile = `${pluginPackagePath || packagePath}.zip`;

        const exists = await fse.pathExists(zipFile);
        // 检查压缩包是否存在
        if (!exists) {
            console.error(`插件压缩包不存在: ${zipFile}`);
            throw new Error(`插件压缩包不存在: ${zipFile}`);
        }

        // 确保目标目录存在，不存在则创建
        await ensureDirsExist([distPath, srcPath, webPath, tempPath]);

        rollbacks.push(...[distPath, srcPath, webPath, tempPath]);

        // 创建AdmZip实例并解压到临时目录
        const zip = new AdmZip(zipFile);
        zip.extractAllTo(tempPath, true);

        // 处理macOS压缩文件解压后的特殊情况
        // 1. 删除 __MACOSX 目录
        const macosxDir = path.join(tempPath, "__MACOSX");
        if (await fse.pathExists(macosxDir)) {
            await fse.remove(macosxDir);
        }

        // 2. 处理可能的嵌套目录情况
        // 查找实际的插件目录（包含manifest.json的目录）
        await findPluginRootDir(tempPath);

        // 检查解压是否成功（简单检查manifest.json是否存在）
        const minifestJson = await getPluginMinifestJson(tempPath);

        if (!minifestJson) {
            console.error(`插件包中缺少manifest.json文件`);
            throw new Error(`插件包中缺少manifest.json文件`);
        } else {
            if (minifestJson.name !== packName) {
                console.error(`插件包名称不匹配`);
                throw new Error(`插件包名称不匹配`);
            }
        }

        // 检查并复制server/dist目录到distPath
        const serverDistDir = path.join(tempPath, "server", "dist");

        if (await fse.pathExists(serverDistDir)) {
            await fse.copy(serverDistDir, distPath, { overwrite: true });
        } else {
            console.error(`插件包中缺少server/dist目录`);
            throw new Error(`插件包中缺少server/dist目录`);
        }

        // 检查并复制server/src目录到srcPath
        const serverSrcDir = path.join(tempPath, "server", "src");
        console.log("serverSrcDir", serverSrcDir);
        if (await fse.pathExists(serverSrcDir)) {
            await fse.copy(serverSrcDir, srcPath, { overwrite: true });
        } else {
            console.error(`插件包中缺少server/src目录`);
            throw new Error(`插件包中缺少server/src目录`);
        }

        // 检查并复制web目录到webPath
        const webDir = path.join(tempPath, "web");
        console.log("webDir", webDir);
        if (await fse.pathExists(webDir)) {
            await fse.copy(webDir, webPath, { overwrite: true });
        } else {
            console.warn(`插件包中缺少web目录，可能不包含前端代码`);
            throw new Error(`插件包中缺少web目录`);
        }

        // 清理临时目录
        await fse.remove(tempPath);

        return { success: true, message: "解压成功" };
    } catch (error) {
        console.error(`解压插件失败: ${error.message}`);
        try {
            for (const dir of rollbacks) {
                if (await fse.pathExists(dir)) {
                    await fse.remove(dir);
                }
            }
        } catch (rollbackError) {
            console.error(`回滚失败: ${rollbackError.message}`);
        }
        console.log(`已回滚到初始状态`);
        throw new Error(`${error.message}`);
    }
};

/**
 * 初始化插件数据
 *
 * @param packName 插件包名
 * @param dataSource 数据源
 * @returns
 */
export const initData = async (packName: string, dataSource: DataSource) => {
    const { srcPath, distPath } = getPluginPath(packName);
    const installDataPath = path.join(srcPath, "install");
    const installSqlPath = path.join(installDataPath, "install.sql");
    const installJsonPath = path.join(installDataPath, "install.json");

    if (!(await fse.pathExists(installDataPath))) {
        return { success: true, message: "无需初始化" };
    }

    const entityFiles = await scanPluginEntityFiles(distPath);

    const entities: EntitySchema[] = [];

    for (const file of entityFiles) {
        try {
            const entityModule = await import(file);
            const entity = Object.values(entityModule).find(
                (v) => typeof v === "function" && v.prototype && v.prototype.constructor,
            );
            if (entity) entities.push(entity as EntitySchema);
        } catch (error) {
            console.error(`Error loading entity file: ${file}`, error);
        }
    }

    const tempDataSource = new DataSource({
        ...dataSource.options,
        entities,
        synchronize: false,
    });

    if (entities.length > 0) {
        try {
            await tempDataSource.initialize();
            await tempDataSource.synchronize(false);

            console.log(`插件 ${packName} 的 ${entities.length} 个实体已同步`);
        } catch (error) {
            console.error(`初始化插件 ${packName} 的数据源失败: ${error.message}`);
            return {
                success: false,
                message: `初始化插件 ${packName} 的数据源失败: ${error.message}`,
            };
        }
    }

    // 执行SQL文件
    if (await fse.pathExists(installSqlPath)) {
        const sqlContent = await fse.readFile(installSqlPath, "utf-8");
        if (sqlContent && sqlContent.trim() !== "") {
            await executeInstallSql(splitSqlStatements(sqlContent), tempDataSource);
        }
    }

    if (await fse.pathExists(installJsonPath)) {
        try {
            // 读取JSON数据
            const jsonContent = await fse.readJson(installJsonPath);

            // 初始化JSON数据
            await installJson(jsonContent, tempDataSource, packName);
        } catch (jsonError) {
            console.error(`处理JSON数据失败: ${jsonError.message}`);
            throw jsonError;
        }
    }

    tempDataSource.destroy();
};

/**
 * 初始化JSON数据
 *
 * @param data JSON数据配置
 * @param dataSource 数据源
 * @param pluginPackName 插件标识
 */
const installJson = async (
    data: installJsonConfig,
    dataSource: DataSource,
    pluginPackName: string,
) => {
    const { menus } = data;
    if (menus && Array.isArray(menus) && menus.length > 0) {
        try {
            // 获取菜单仓库
            const menuRepository = dataSource.getRepository(getTablePrefix("menus"));

            // 递归创建菜单
            const createMenus = async (
                menuItems: initJsonMenu[],
                parentId: string | null = null,
            ) => {
                for (const item of menuItems) {
                    // 创建菜单实体
                    const menu = {
                        name: item.name,
                        path: item.path,
                        icon: item.icon,
                        component: item.component,
                        permissionCode: item.permissionCode,
                        parentId,
                        sort: item.sort || 0,
                        isHidden: item.isHidden || 0,
                        type: item.type || 2, // 默认为菜单类型
                        sourceType: 2, // 插件菜单
                        pluginPackName, // 设置插件标识
                    };

                    // 保存菜单
                    const savedMenu = await menuRepository.save(menu);
                    console.log(`成功创建菜单: ${savedMenu.name}`);

                    // 如果有子菜单，递归创建
                    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                        await createMenus(item.children, savedMenu.id);
                    }
                }
            };

            // 开始创建菜单
            await createMenus(menus);
            console.log(`插件 ${pluginPackName} 的菜单初始化完成`);
        } catch (error) {
            console.error(`初始化菜单数据失败: ${error.message}`);
            throw error;
        }
    }
};

/**
 * 执行SQL文件
 *
 * @param sqlStatements SQL语句数组
 * @param dataSource 数据源
 */
const executeInstallSql = async (sqlStatements: string[], dataSource: DataSource) => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        for (const sql of sqlStatements) {
            if (sql.trim() !== "") {
                await queryRunner.query(sql);
            }
        }
        await queryRunner.commitTransaction();
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

/**
 * 分割SQL语句
 *
 * @param sqlContent SQL内容
 * @returns SQL语句数组
 */
const splitSqlStatements = (sqlContent: string): string[] => {
    return sqlContent
        .replace(/--.*?\n/g, "\n") // 移除单行注释
        .replace(/\/\*[\s\S]*?\*\//g, "") // 移除多行注释
        .split(";") // 按分号分割
        .map((stmt) => stmt.trim()) // 移除空白
        .filter((stmt) => stmt.length > 0); // 移除空语句
};

/**
 * 扫描插件实体文件
 *
 * @param distPath 插件dist目录
 * @returns 实体文件路径数组
 */
const scanPluginEntityFiles = async (distPath: string): Promise<string[]> => {
    const entityFiles: string[] = [];
    const findEntityFiles = async (dir: string) => {
        const files = await fse.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fse.stat(filePath);
            if (stat.isDirectory()) {
                await findEntityFiles(filePath);
            } else if (
                file.endsWith(".entity.js") ||
                file.includes(".entity.") ||
                file.endsWith(".entities.js")
            ) {
                entityFiles.push(filePath);
            }
        }
    };
    await findEntityFiles(distPath);
    return entityFiles;
};

/**
 * 递归查找插件根目录并将内容提取到临时目录根目录
 *
 * @param dirPath 要检查的目录路径
 * @param maxDepth 最大递归深度，防止无限递归
 * @returns 找到的插件根目录路径，如果没找到返回原目录
 */
export const findPluginRootDir = async (dirPath: string, maxDepth: number = 3): Promise<string> => {
    // 打印当前目录结构，便于调试
    await printDirectoryTree(dirPath, { maxDepth: 2 });

    // 检查当前目录是否包含 manifest.json
    if (await fse.pathExists(path.join(dirPath, "manifest.json"))) {
        console.log(`在目录 ${dirPath} 中找到 manifest.json`);
        return dirPath; // 当前目录就是插件根目录
    }

    // 防止无限递归
    if (maxDepth <= 0) {
        return dirPath;
    }

    // 获取当前目录的内容
    const contents = await fse.readdir(dirPath);

    // 检查当前目录下的所有子目录
    const subDirs = [];
    for (const item of contents) {
        const itemPath = path.join(dirPath, item);
        const stat = await fse.stat(itemPath);
        if (stat.isDirectory()) {
            subDirs.push({
                name: item,
                path: itemPath,
            });
        }
    }

    // 如果没有子目录，返回当前目录
    if (subDirs.length === 0) {
        return dirPath;
    }

    // 如果只有一个子目录，先检查该子目录
    if (subDirs.length === 1) {
        const subDir = subDirs[0];

        // 递归检查子目录
        const pluginDir = await findPluginRootDir(subDir.path, maxDepth - 1);

        // 如果找到了插件目录
        if (pluginDir !== subDir.path) {
            // 将插件目录内容复制到当前目录
            await copyDirContents(pluginDir, dirPath);
            return dirPath;
        } else {
            // 如果子目录下有 manifest.json，则将子目录内容移动到当前目录
            if (await fse.pathExists(path.join(subDir.path, "manifest.json"))) {
                await copyDirContents(subDir.path, dirPath);
                return dirPath;
            }
        }
    }

    // 如果有多个子目录，检查是否有与当前目录同名的子目录
    const dirName = path.basename(dirPath);
    const sameNameDir = subDirs.find((dir) => dir.name === dirName);

    if (sameNameDir) {
        // 递归检查这个同名子目录
        const pluginDir = await findPluginRootDir(sameNameDir.path, maxDepth - 1);

        // 如果找到了插件目录
        if (pluginDir !== sameNameDir.path) {
            // 将插件目录内容复制到当前目录
            await copyDirContents(pluginDir, dirPath);
            return dirPath;
        } else {
            // 如果同名子目录下有 manifest.json，则将子目录内容移动到当前目录
            if (await fse.pathExists(path.join(sameNameDir.path, "manifest.json"))) {
                await copyDirContents(sameNameDir.path, dirPath);
                return dirPath;
            }
        }
    }

    // 逐个检查其他子目录
    for (const subDir of subDirs) {
        // 已经检查过同名目录，跳过
        if (subDir.name === dirName) continue;

        // 检查子目录是否有 manifest.json
        if (await fse.pathExists(path.join(subDir.path, "manifest.json"))) {
            await copyDirContents(subDir.path, dirPath);
            return dirPath;
        }

        // 递归检查子目录
        const pluginDir = await findPluginRootDir(subDir.path, maxDepth - 1);

        // 如果找到了插件目录
        if (pluginDir !== subDir.path) {
            // 将插件目录内容复制到当前目录
            await copyDirContents(pluginDir, dirPath);
            return dirPath;
        }
    }

    return dirPath;
};

/**
 * 复制目录内容到目标目录
 *
 * @param sourceDir 源目录
 * @param targetDir 目标目录
 */
const copyDirContents = async (sourceDir: string, targetDir: string): Promise<void> => {
    // 获取源目录中的所有文件和目录
    const items = await fse.readdir(sourceDir);

    // 逐个复制文件和目录
    for (const item of items) {
        const sourcePath = path.join(sourceDir, item);
        const targetPath = path.join(targetDir, item);

        // 检查是否是目录
        const stat = await fse.stat(sourcePath);

        if (stat.isDirectory()) {
            // 如果是目录，递归复制
            await fse.ensureDir(targetPath);
            await fse.copy(sourcePath, targetPath, { overwrite: true });
        } else {
            // 如果是文件，直接复制
            await fse.ensureDir(path.dirname(targetPath));
            await fse.copyFile(sourcePath, targetPath);
        }
    }

    // 删除源目录
    await fse.remove(sourceDir);
};

/**
 * 打印目录结构树
 *
 * @param dirPath 要打印的目录路径
 * @param options 选项配置
 * @returns 目录结构树字符串
 */
export const printDirectoryTree = async (
    dirPath: string,
    options: {
        /**
         * 最大递归深度
         * @default 5
         */
        maxDepth?: number;
        /**
         * 是否显示文件
         * @default true
         */
        showFiles?: boolean;
        /**
         * 要排除的文件或目录名称正则表达式
         * @default /node_modules|.git|.DS_Store/
         */
        exclude?: RegExp;
        /**
         * 是否在控制台直接打印
         * @default true
         */
        logToConsole?: boolean;
        /**
         * 前缀字符串，用于递归调用时的缩进
         * @default ''
         */
        prefix?: string;
        /**
         * 是否是根目录，用于递归调用
         * @default true
         */
        isRoot?: boolean;
    } = {},
): Promise<string> => {
    const {
        maxDepth = 5,
        showFiles = true,
        exclude = /node_modules|\.git|\.DS_Store/,
        logToConsole = true,
        prefix = "",
        isRoot = true,
    } = options;

    // 防止无限递归
    if (maxDepth <= 0) {
        return "";
    }

    // 检查目录是否存在
    if (!(await fse.pathExists(dirPath))) {
        const errorMsg = `目录不存在: ${dirPath}`;
        if (logToConsole && isRoot) {
            console.error(errorMsg);
        }
        return errorMsg;
    }

    // 获取目录名
    const dirName = path.basename(dirPath);
    let result = isRoot ? `${dirName}/\n` : "";

    try {
        // 读取目录内容
        const items = await fse.readdir(dirPath);

        // 过滤目录内容
        const filteredItems = items.filter((item) => !exclude.test(item));

        // 获取每个项目的信息
        const itemsInfo = await Promise.all(
            filteredItems.map(async (item) => {
                const itemPath = path.join(dirPath, item);
                const stat = await fse.stat(itemPath);
                return {
                    name: item,
                    isDirectory: stat.isDirectory(),
                };
            }),
        );

        // 排序（目录优先，然后按字母排序）
        itemsInfo.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        // 获取排序后的文件名列表
        const sortedItems = itemsInfo.map((item) => item.name);

        // 处理每个条目
        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            const itemPath = path.join(dirPath, item);
            // 使用已经获取的信息，避免再次调用 stat
            const isDir = itemsInfo[i].isDirectory;
            const isLast = i === sortedItems.length - 1;

            // 确定当前项的前缀
            const currentPrefix = `${prefix}${isLast ? "└── " : "├── "}`;
            // 确定子项的前缀
            const childPrefix = `${prefix}${isLast ? "    " : "│   "}`;

            if (isDir) {
                // 处理目录
                result += `${currentPrefix}${item}/\n`;
                // 递归处理子目录
                const subTree = await printDirectoryTree(itemPath, {
                    maxDepth: maxDepth - 1,
                    showFiles,
                    exclude,
                    logToConsole: false,
                    prefix: childPrefix,
                    isRoot: false,
                });
                result += subTree;
            } else if (showFiles) {
                // 处理文件
                result += `${currentPrefix}${item}\n`;
            }
        }

        // 如果是根调用且需要打印到控制台，则打印结果
        if (logToConsole && isRoot) {
            console.log(result);
        }

        return result;
    } catch (error) {
        const errorMsg = `读取目录出错: ${error.message}`;
        if (logToConsole && isRoot) {
            console.error(errorMsg);
        }
        return errorMsg;
    }
};
