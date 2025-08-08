import { getPackageJson } from "@common/utils/system.util";
import { Logger } from "@nestjs/common";
import AdmZip from "adm-zip";
import * as fse from "fs-extra";
import * as path from "path";

import { CreatePlugDto } from "../dtos/create-plugin.dto";
import { findPluginRootDir, installJsonConfig } from "./plugin.util";

const logger = new Logger("PluginTemplateUtil");

/**
 * 解压ZIP文件到指定目录
 *
 * @param zipFilePath ZIP文件路径
 * @param targetDir 目标目录
 */
export async function extractZipFile(zipFilePath: string, targetDir: string): Promise<void> {
    try {
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(targetDir, true);
        const pluginRootDir = await findPluginRootDir(targetDir);
        logger.debug(`成功解压模板文件到: ${pluginRootDir}`);
    } catch (error) {
        logger.error(`解压模板文件失败: ${error.message}`, error.stack);
        throw error;
    }
}

/**
 * 更新模板文件中的信息
 *
 * @param templateDir 模板目录
 * @param pluginInfo 插件信息
 */
export async function updateTemplateFiles(
    templateDir: string,
    pluginInfo: CreatePlugDto,
): Promise<void> {
    try {
        // 更新manifest.json
        const manifestPath = path.join(templateDir, "manifest.json");
        console.log("manifestPath", manifestPath);
        console.log(await fse.pathExists(manifestPath));
        if (await fse.pathExists(manifestPath)) {
            const manifest = await fse.readJson(manifestPath);
            manifest.name = pluginInfo.packName;
            manifest.title = pluginInfo.name;
            manifest.version = pluginInfo.version || "1.0.0";
            manifest.description = pluginInfo.description || "";

            await fse.writeFile(manifestPath, JSON.stringify(manifest, null, 4), "utf-8");
            logger.debug(`更新manifest.json完成: ${manifestPath}`);
        }

        // 更新server/package.json
        const serverPackagePath = path.join(templateDir, "server", "package.json");
        if (await fse.pathExists(serverPackagePath)) {
            const serverPackage = await getPackageJson(serverPackagePath);
            serverPackage.name = `@server/${pluginInfo.packName}`;
            serverPackage.title = pluginInfo.name;
            serverPackage.version = pluginInfo.version || "1.0.0";
            serverPackage.description = pluginInfo.description || "";

            await fse.writeJson(serverPackagePath, serverPackage);
            logger.debug(`更新server/package.json完成: ${serverPackagePath}`);
        }

        // 更新web/package.json
        const webPackagePath = path.join(templateDir, "web", "package.json");
        if (await fse.pathExists(webPackagePath)) {
            const webPackage = await getPackageJson(webPackagePath);
            webPackage.name = `@web/${pluginInfo.packName}`;
            webPackage.title = pluginInfo.name;
            webPackage.version = pluginInfo.version || "1.0.0";
            webPackage.description = pluginInfo.description || "";

            await fse.writeJson(webPackagePath, webPackage);
            logger.debug(`更新web/package.json完成: ${webPackagePath}`);
        }
    } catch (error) {
        logger.error(`更新模板文件信息失败: ${error.message}`, error.stack);
        throw error;
    }
}

/**
 * 将模板文件复制到插件目录
 *
 * @param templateDir 模板目录
 * @param pluginName 插件名称
 */
export async function copyTemplateToPluginDirectories(
    templateDir: string,
    pluginName: string,
): Promise<installJsonConfig | null> {
    try {
        // 后端插件目录
        const serverPluginDir = path.join(process.cwd(), "src/plugins", pluginName);
        // 前端插件目录
        const webPluginDir = path.join(process.cwd(), "../web/plugins", pluginName);

        // 创建插件目录
        await fse.mkdir(serverPluginDir, { recursive: true });
        await fse.mkdir(webPluginDir, { recursive: true });

        // 复制服务端文件
        const serverSourceDir = path.join(templateDir, "server");
        if (await fse.pathExists(serverSourceDir)) {
            await fse.copy(serverSourceDir, serverPluginDir);
            logger.debug(`复制服务端文件完成: ${serverPluginDir}`);
        }

        // 复制前端文件
        const webSourceDir = path.join(templateDir, "web");
        if (await fse.pathExists(webSourceDir)) {
            await fse.copy(webSourceDir, webPluginDir);
            logger.debug(`复制前端文件完成: ${webPluginDir}`);
        }

        // 复制manifest.json到服务端插件目录
        const manifestPath = path.join(templateDir, "manifest.json");
        if (await fse.pathExists(manifestPath)) {
            await fse.copy(manifestPath, path.join(serverPluginDir, "manifest.json"));
            logger.debug(`复制manifest.json完成: ${path.join(serverPluginDir, "manifest.json")}`);
        }

        const installJsonPath = path.join(templateDir, "server", "install", "install.json");

        if (await fse.pathExists(installJsonPath)) {
            return await fse.readJson(installJsonPath);
        }

        return null;
    } catch (error) {
        logger.error(`复制模板文件到插件目录失败: ${error.message}`, error.stack);
        throw error;
    }
}
