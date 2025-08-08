import { getPackageJson } from "@common/utils/system.util";
import { parsePackageName } from "@fastbuildai/utils";
import AdmZip from "adm-zip";
import * as fse from "fs-extra";
import * as path from "path";

import { PackagePluginDto } from "../dtos/package-plugin.dto";
import { getPluginPath } from "./plugin.util";

/**
 * 打包插件
 *
 * @param packagePluginDto 打包插件DTO
 * @returns 打包结果
 */
export const packPlugin = async (
    packagePluginDto: PackagePluginDto,
): Promise<{ success: boolean; message: string; filePath?: string }> => {
    // 排除的文件和目录列表
    const excludeFiles = ["node_modules", ".initialized"];
    try {
        const { distPath, srcPath, webPath, tempPath } = getPluginPath(packagePluginDto.packName);

        if (!(await fse.pathExists(path.join(distPath, "package.json")))) {
            return {
                success: false,
                message: "插件dist目录下package.json文件不存在",
            };
        }

        if (!(await fse.pathExists(path.join(srcPath, "package.json")))) {
            return {
                success: false,
                message: "插件src目录下package.json文件不存在",
            };
        }

        if (!(await fse.pathExists(path.join(webPath, "package.json")))) {
            return {
                success: false,
                message: "插件web目录下package.json文件不存在",
            };
        }

        // 确保临时目录存在
        await fse.ensureDir(tempPath);

        // 创建插件包目录结构
        const pluginPackDir = path.join(tempPath, packagePluginDto.packName);
        const pluginServerDir = path.join(pluginPackDir, "server");
        const pluginWebDir = path.join(pluginPackDir, "web");

        // 确保目录存在
        await fse.ensureDir(pluginServerDir);
        await fse.ensureDir(pluginWebDir);

        // 复制服务端文件
        const serverSrcDir = path.join(pluginServerDir, "src");
        const serverDistDir = path.join(pluginServerDir, "dist");
        await fse.ensureDir(serverSrcDir);
        await fse.ensureDir(serverDistDir);

        // 复制源码和编译后的文件
        if (await fse.pathExists(srcPath)) {
            await fse.copy(srcPath, serverSrcDir, {
                filter: (src) => {
                    // 获取相对于源目录的路径
                    const relativePath = path.relative(srcPath, src);
                    // 检查是否是排除的文件或目录
                    return !excludeFiles.some(
                        (exclude) =>
                            relativePath === exclude || // 完全匹配
                            relativePath.startsWith(`${exclude}/`) || // 目录匹配
                            relativePath.endsWith(`/${exclude}`), // 文件匹配
                    );
                },
            });
        }

        if (await fse.pathExists(distPath)) {
            await fse.copy(distPath, serverDistDir);
        }

        // 复制前端文件
        if (await fse.pathExists(webPath)) {
            await fse.copy(webPath, pluginWebDir);
        }

        // 读取package.json文件
        const packageJsonPath = path.join(srcPath, "package.json");
        if (!(await fse.pathExists(packageJsonPath))) {
            throw new Error(`插件package.json文件不存在: ${packageJsonPath}`);
        }

        // 读取package.json并提取所需字段
        const packageJson = await getPackageJson(packageJsonPath);
        const manifestJson = {
            name: packageJson.name,
            version: packagePluginDto.version,
            title: packageJson.title,
            description: packageJson.description,
        };

        // 创建manifest.json文件
        await fse.writeJson(path.join(pluginPackDir, "manifest.json"), manifestJson, { spaces: 4 });

        // 确保builds目录存在
        const buildsDir = path.join(process.cwd(), "storage", "builds");
        await fse.ensureDir(buildsDir);

        // 创建zip文件
        const zipFileName = `${packagePluginDto.packName}.zip`;
        const zipFilePath = path.join(buildsDir, zipFileName);

        // 创建zip实例并添加文件
        const zip = new AdmZip();
        // zip.addLocalFolder(pluginPackDir);
        // 递归添加文件，保持相对路径结构，避免额外的目录层级
        const addFilesRecursively = async (dir: string, baseDir: string) => {
            const files = await fse.readdir(dir);

            for (const file of files) {
                // 检查文件名是否在排除列表中
                if (excludeFiles.includes(file)) {
                    continue; // 跳过排除的文件或目录
                }

                const filePath = path.join(dir, file);
                const relativePath = path.relative(baseDir, filePath);

                // 检查相对路径是否应该被排除
                const shouldExclude = excludeFiles.some(
                    (exclude) =>
                        relativePath === exclude || // 完全匹配
                        relativePath.startsWith(`${exclude}/`) || // 目录前缀匹配
                        relativePath.endsWith(`/${exclude}`), // 文件后缀匹配
                );

                if (shouldExclude) {
                    continue; // 跳过排除的文件或目录
                }

                const stat = await fse.stat(filePath);

                if (stat.isDirectory()) {
                    await addFilesRecursively(filePath, baseDir);
                } else {
                    const fileData = await fse.readFile(filePath);
                    zip.addFile(relativePath, fileData);
                }
            }
        };

        // 添加所有文件
        await addFilesRecursively(pluginPackDir, pluginPackDir);

        // 写入zip文件
        zip.writeZip(zipFilePath);

        // 清理临时目录
        await fse.remove(pluginPackDir);

        return {
            success: true,
            message: `插件打包成功: ${zipFileName}`,
            filePath: zipFilePath,
        };
    } catch (error) {
        console.error("打包插件失败:", error);
        return {
            success: false,
            message: `打包插件失败: ${error.message}`,
        };
    }
};
