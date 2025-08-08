import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { DictService } from "@common/modules/dict/services/dict.service";
import { FileDownloader } from "@common/utils/file.util";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as fse from "fs-extra";
import * as path from "path";
import { Repository } from "typeorm";

import { CreatePlugDto } from "../dtos/create-plugin.dto";
import { DeveloperSecretDto } from "../dtos/developer.dto";
import { DownloadPluginDto } from "../dtos/download-plugin.dto";
import { PackagePluginDto } from "../dtos/package-plugin.dto";
import { PlugEntity } from "../entities/plugin.entity";
import { executePnpmCommand, getPluginPath, initData, unpackPlugin } from "../utils/plugin.util";
import { packPlugin } from "../utils/plugin-package.util";
import { upgradePlugin } from "../utils/plugin-upgrade.util";

/**
 * 插件服务
 */
@Injectable()
export class pluginService extends BaseService<PlugEntity> implements OnModuleInit {
    constructor(
        @InjectRepository(PlugEntity)
        private readonly plugRepository: Repository<PlugEntity>,
        private readonly dictService: DictService,
    ) {
        super(plugRepository);
    }

    /**
     * 应用启动时执行
     *
     * 重置所有插件的重启状态
     */
    async onModuleInit() {
        await this.resetPluginsRestartStatus();
    }

    /**
     * 重置所有需要重启的插件状态
     *
     * 将所有 needRestart 为 true 的插件重置为 false
     */
    private async resetPluginsRestartStatus() {
        try {
            const count = (
                await this.findAll({
                    where: {
                        needRestart: true,
                    },
                })
            ).length;

            if (count === 0) {
                this.logger.log("无重启项需要重置");
            } else {
                await this.update(
                    {
                        needRestart: false,
                    },
                    {
                        where: {
                            needRestart: true,
                        },
                    },
                );
                this.logger.log(`已重置 ${count} 个插件的重启状态`);
            }
        } catch (error) {
            this.logger.log(`重置插件重启状态失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 创建插件
     *
     * @param createPlugDto 创建插件DTO
     * @returns 创建的插件
     */
    async createPlugin(createPlugDto: CreatePlugDto): Promise<Partial<PlugEntity>> {
        // 检查插件标识符是否已存在
        const existingPlugin = await this.findOne({
            where: { packName: createPlugDto.packName, isInstalled: true },
        });

        if (existingPlugin) {
            throw HttpExceptionFactory.badRequest("该插件已存在");
        }

        // 创建插件
        return await this.create({
            ...createPlugDto,
            isDownloaded: true,
            isInstalled: true,
            isEnabled: true,
            needRestart: true,
            isDeveloper: true,
        });
    }

    /**
     * 激活插件
     */
    async status(id: string) {
        // 检查插件标识符是否已存在
        const existingPlugin = await this.findOneById(id);

        if (!existingPlugin) {
            throw HttpExceptionFactory.badRequest("该插件不存在");
        }

        existingPlugin.isEnabled = !existingPlugin.isEnabled;
        return await this.updateById(id, existingPlugin);
    }

    /**
     * 下载插件
     *
     * @param downloadPluginDto 下载插件DTO
     * @returns 下载结果
     */
    async download(downloadPluginDto: DownloadPluginDto) {
        const { packName, url } = downloadPluginDto;
        let filePath: string;

        try {
            // 创建存储目录（如果不存在）
            const storageDir = path.resolve(process.cwd(), "storage/plugins");
            filePath = await FileDownloader.downloadFile({
                url,
                fileName: `${packName}.zip`,
                targetDir: storageDir,
            });

            const plugin = await this.createPlugin({
                name: downloadPluginDto.name,
                packName,
                version: downloadPluginDto.version,
                description: downloadPluginDto.description,
                icon: downloadPluginDto.icon,
            });

            // TODO 返回拼接为正式的url

            return { filePath, ...plugin };
        } catch (error) {
            // 删除下载的文件
            await fse.remove(filePath);
            this.logger.error(`插件下载失败: ${error.message}`);
            throw HttpExceptionFactory.badRequest(`插件下载失败: ${error.message}`);
        }
    }

    /**
     * 安装插件
     *
     * @param id 插件ID
     * @returns 安装结果
     */
    async install(id: string) {
        try {
            const plugin = await this.findOneById(id);
            if (!plugin) {
                throw HttpExceptionFactory.badRequest("插件不存在");
            }

            // 解压插件
            await unpackPlugin(plugin.packName);

            // 初始化插件数据
            await initData(plugin.packName, this.dataSource);

            // 在项目根目录执行 pnpm install
            const rootDir = process.cwd();
            const pnpmResult = await executePnpmCommand("install", rootDir);

            if (!pnpmResult.success) {
                this.logger.warn(`pnpm install 执行失败，但将继续安装过程: ${pnpmResult.message}`);
                // 不中断安装过程，继续执行
            }

            // 更新插件状态，包括重启相关字段
            await this.updateById(id, {
                isInstalled: true,
                isEnabled: true,
                needRestart: true,
                restartReason: "插件安装",
                lastOperationAt: new Date(),
            });

            return { success: true, message: "插件安装成功，需要重启系统才能生效" };
        } catch (error) {
            this.logger.error(`插件安装失败: ${error.message}`);
            throw HttpExceptionFactory.badRequest(`插件安装失败: ${error.message}`);
        }
    }

    /**
     * 打包插件
     *
     * @param packagePluginDto 打包插件DTO
     * @returns 打包结果
     */
    async package(packagePluginDto: PackagePluginDto) {
        const plugin = await this.findOne({ where: { packName: packagePluginDto.packName } });
        if (!plugin) {
            throw HttpExceptionFactory.badRequest("插件不存在");
        }
        const result = await packPlugin(packagePluginDto);
        if (!result.success) {
            throw HttpExceptionFactory.badRequest(result.message);
        }
        return result;
    }

    /**
     * 下载插件打包结果
     *
     * @param id 插件ID
     * @returns 下载结果
     */
    async downloadPackageResult(id: string) {
        const plugin = await this.findOneById(id);
        if (!plugin) {
            throw HttpExceptionFactory.badRequest("插件不存在");
        }
        const { packName } = plugin;
        const { packagePath } = getPluginPath(packName);
        const filePath = path.join(packagePath, `${packName}.zip`);
        if (!(await fse.pathExists(filePath))) {
            throw HttpExceptionFactory.badRequest("插件打包结果不存在");
        }
        return filePath;
    }

    /**
     * 升级插件版本
     *
     * @param id 插件ID
     * @param downloadPluginDto 下载插件DTO
     * @returns 升级结果
     */
    async upgrade(id: string, downloadPluginDto: DownloadPluginDto) {
        const plugin = await this.findOneById(id);
        const { packName, url } = downloadPluginDto;
        const { tempPath } = getPluginPath(packName);
        const storageDir = path.join(tempPath, "upgrade");

        if (!plugin) {
            throw HttpExceptionFactory.badRequest("插件不存在");
        }

        if (!plugin.isInstalled) {
            throw HttpExceptionFactory.badRequest("插件未安装");
        }

        if (!plugin.isDownloaded) {
            throw HttpExceptionFactory.badRequest("插件未下载");
        }

        // TODO 官网查询最新版本，校验是否可以更新

        const filePath = await FileDownloader.downloadFile({
            url,
            fileName: `${packName}-upgrade.zip`,
            targetDir: storageDir,
        });

        await unpackPlugin(packName, filePath);
        await upgradePlugin(plugin.packName);

        // 在项目根目录执行 pnpm install
        const rootDir = process.cwd();
        const pnpmResult = await executePnpmCommand("install", rootDir);

        if (!pnpmResult.success) {
            this.logger.warn(`pnpm install 执行失败，但将继续升级过程: ${pnpmResult.message}`);
            // 不中断升级过程，继续执行
        }

        // 更新插件状态，包括重启相关字段
        await this.updateById(id, {
            needRestart: true,
            restartReason: "插件升级",
            lastOperationAt: new Date(),
        });

        return { success: true, message: "插件升级成功，需要重启系统才能生效" };
    }

    /**
     * 卸载插件
     *
     * 删除插件文件和相关数据表
     *
     * @param id 插件ID
     * @returns 卸载结果
     */
    async uninstall(id: string, deletePackage: boolean) {
        const plugin = await this.findOneById(id);
        if (!plugin) {
            throw HttpExceptionFactory.badRequest("插件不存在");
        }

        try {
            // 1. 删除插件文件
            const { distPath, srcPath, webPath, packagePath } = getPluginPath(plugin.packName);

            await fse.remove(distPath);
            await fse.remove(srcPath);
            await fse.remove(webPath);

            // 2. 清理插件相关数据表
            await this.cleanPluginTables(plugin.packName);

            // 3. 在项目根目录执行 pnpm install
            // 卸载插件后需要重新安装依赖，以确保移除不再需要的依赖
            const rootDir = process.cwd();
            const pnpmResult = await executePnpmCommand("install", rootDir);

            if (!pnpmResult.success) {
                this.logger.warn(`pnpm install 执行失败，但将继续卸载过程: ${pnpmResult.message}`);
                // 不中断卸载过程，继续执行
            }

            // 4. 更新插件状态，包括重启相关字段
            await this.updateById(id, {
                isInstalled: false,
                isEnabled: false,
                needRestart: true,
                restartReason: "插件卸载",
                lastOperationAt: new Date(),
                isDownloaded: !deletePackage,
            });

            // 5. 是否删除插件安装包
            if (
                deletePackage &&
                (await fse.pathExists(path.join(packagePath, `${plugin.packName}.zip`)))
            ) {
                await fse.unlink(path.join(packagePath, `${plugin.packName}.zip`));
            }

            return { success: true, message: "插件卸载成功，需要重启系统才能生效" };
        } catch (error) {
            this.logger.error(`插件卸载失败: ${error.message || error}`, error.stack);
            throw HttpExceptionFactory.internal(`插件卸载失败：${error.message || error}`);
        }
    }

    /**
     * 清理插件相关数据表
     *
     * 删除所有以插件packName为前缀的数据表
     *
     * @param pluginPackName 插件标识
     */
    private async cleanPluginTables(pluginPackName: string): Promise<void> {
        try {
            this.logger.log(`开始清理插件 ${pluginPackName} 相关数据表`);

            // 1. 获取数据库中所有表名
            const tables = await this.dataSource.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
            );

            // 2. 过滤出以插件标识为前缀的表
            const tablePrefix = `${pluginPackName}_`;
            const pluginTables = tables
                .map((table: { table_name: string }) => table.table_name)
                .filter((tableName: string) => tableName.startsWith(tablePrefix));

            if (pluginTables.length === 0) {
                this.logger.log(`未找到插件 ${pluginPackName} 相关数据表`);
                return;
            }

            // 3. 逐个删除表
            for (const tableName of pluginTables) {
                this.logger.log(`删除表: ${tableName}`);
                await this.dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
            }

            this.logger.log(
                `插件 ${pluginPackName} 相关数据表清理完成，共删除 ${pluginTables.length} 个表`,
            );
        } catch (error) {
            this.logger.error(`清理插件数据表失败: ${error.message || error}`, error.stack);
            throw new Error(`清理插件数据表失败: ${error.message || error}`);
        }
    }

    /**
     * 设置开发版插件密钥
     */
    async setDeveloperSecret(developerSecretDto: DeveloperSecretDto) {
        const { secretKey } = developerSecretDto;
        return await this.dictService.set("developer_secret", secretKey);
    }

    /**
     * 获取开发版插件密钥
     */
    async getDeveloperSecret() {
        const secretKey = await this.dictService.get("developer_secret");
        return {
            secretKey: secretKey || null,
        };
    }
}
