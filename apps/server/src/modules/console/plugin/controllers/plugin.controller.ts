import { BaseController } from "@common/base/controllers/base.controller";
import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { MenuService } from "@modules/console/menu/menu.service";
import { Body, Delete, Get, Param, Post, Query } from "@nestjs/common";
import * as fse from "fs-extra";
import * as path from "path";
import { ILike } from "typeorm";

import { CreatePlugDto } from "../dtos/create-plugin.dto";
import { DeveloperSecretDto } from "../dtos/developer.dto";
import { DownloadPluginDto } from "../dtos/download-plugin.dto";
import { PackagePluginDto } from "../dtos/package-plugin.dto";
import { QueryPlugDto } from "../dtos/query-plugin.dto";
import { pluginService } from "../services/plugin.service";
import {
    copyTemplateToPluginDirectories,
    extractZipFile,
    updateTemplateFiles,
} from "../utils/plugin-template.util";

/**
 * 插件控制器
 */
@ConsoleController("plugin", "插件管理")
export class PlugController extends BaseController {
    constructor(
        private readonly pluginService: pluginService,
        private readonly menuService: MenuService,
    ) {
        super();
    }

    /**
     * 创建插件
     *
     * 下载即创建
     */
    @Post()
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "create",
        name: "创建插件",
        description: "创建新的插件",
    })
    async create(@Body() createPlugDto: CreatePlugDto, @Playground() user: UserPlayground) {
        // 创建临时目录路径
        const tempExtractPath = path.join(process.cwd(), "storage/temp", createPlugDto.packName);

        try {
            // 检查插件是否已存在
            const existingPlugin = await this.pluginService.findOne({
                where: { packName: createPlugDto.packName, isInstalled: true },
            });

            if (existingPlugin) {
                throw HttpExceptionFactory.badRequest(
                    `插件包名 ${createPlugDto.packName} 已存在，请使用其他名称`,
                );
            }

            // 获取模板文件路径
            const templatePath = path.join(
                process.cwd(),
                "src/assets/templates/default-plugin-template.zip",
            );

            // 解压模板文件到临时目录
            await extractZipFile(templatePath, tempExtractPath);
            // 修改模板文件中的信息
            await updateTemplateFiles(tempExtractPath, createPlugDto);

            // 创建插件目录并复制文件
            const installJsonConfig = await copyTemplateToPluginDirectories(
                tempExtractPath,
                createPlugDto.packName,
            );

            this.logger.log(
                `插件 ${createPlugDto.name}(${createPlugDto.packName}) 模板文件复制完成`,
            );

            if (installJsonConfig) {
                await this.menuService.initMenu(
                    installJsonConfig.menus,
                    user.id,
                    createPlugDto.packName,
                );
            }

            return await this.pluginService.createPlugin(createPlugDto);
        } catch (error) {
            this.logger.error(`创建失败：${error.message}`, error.stack);

            // 回滚：删除已创建的插件文件
            try {
                // 删除服务端插件目录
                const serverPluginDir = path.join(
                    process.cwd(),
                    "src/plugins",
                    createPlugDto.packName,
                );
                if (await fse.pathExists(serverPluginDir)) {
                    await fse.remove(serverPluginDir);
                    this.logger.log(`已删除服务端插件目录: ${serverPluginDir}`);
                }

                // 删除前端插件目录
                const webPluginDir = path.join(
                    process.cwd(),
                    "../web/plugins",
                    createPlugDto.packName,
                );
                if (await fse.pathExists(webPluginDir)) {
                    await fse.remove(webPluginDir);
                    this.logger.log(`已删除前端插件目录: ${webPluginDir}`);
                }

                // 删除临时目录
                if (await fse.pathExists(tempExtractPath)) {
                    await fse.remove(tempExtractPath);
                    this.logger.log(`已删除临时目录: ${tempExtractPath}`);
                }
            } catch (cleanupError) {
                this.logger.error(`回滚删除文件失败: ${cleanupError.message}`, cleanupError.stack);
            }

            // 如果复制模板失败，抛出错误
            throw HttpExceptionFactory.badRequest(error.message || error);
        }
    }

    /**
     * 查询插件列表
     */
    @Get("/dev-list")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "dev-list",
        name: "查询开发版插件列表",
        description: "查询开发版插件列表",
    })
    async devList(@Query() queryPlugDto: QueryPlugDto) {
        // 构建基本查询条件
        const baseCondition1: any = { isInstalled: true, isDeveloper: true };
        const baseCondition2: any = { isInstalled: false, needRestart: true, isDeveloper: true };

        // 如果有名称查询参数，添加模糊搜索条件
        if (queryPlugDto.name) {
            baseCondition1.name = ILike(`%${queryPlugDto.name}%`);
            baseCondition2.name = ILike(`%${queryPlugDto.name}%`);
        }

        return this.pluginService.paginate(queryPlugDto, {
            where: [baseCondition1, baseCondition2],
        });
    }

    /**
     * 查询插件列表
     */
    @Get("/list")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "list",
        name: "查询插件列表",
        description: "查询插件列表",
    })
    async list(@Query() queryPlugDto: QueryPlugDto) {
        return this.pluginService.paginate(queryPlugDto, {
            where: [
                { isInstalled: true, isDeveloper: false, name: ILike(`%${queryPlugDto.name}%`) },
                { needRestart: true, isDeveloper: false, name: ILike(`%${queryPlugDto.name}%`) },
                { name: ILike(`%${queryPlugDto.name}%`), isDeveloper: false },
            ],
        });
    }

    /**
     * 下载插件
     */
    @Post("/download")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "download",
        name: "下载插件",
        description: "下载插件",
    })
    async download(@Body() downloadPlugDto: DownloadPluginDto) {
        return await this.pluginService.download(downloadPlugDto);
    }

    /**
     * 安装插件
     */
    @Post("/install/:id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "install",
        name: "安装插件",
        description: "安装插件",
    })
    async install(@Param("id", UUIDValidationPipe) id: string) {
        return await this.pluginService.install(id);
    }

    /**
     * 卸载插件
     *
     * @param id 插件ID
     * @param deletePackage 是否删除安装包，默认为false
     * @returns 卸载结果
     */
    @Delete("/uninstall/:id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "uninstall",
        name: "卸载插件",
        description: "卸载插件",
    })
    async uninstall(
        @Param("id", UUIDValidationPipe) id: string,
        @Query("deletePackage") deletePackage?: boolean,
    ) {
        deletePackage = deletePackage || false;
        return await this.pluginService.uninstall(id, deletePackage);
    }

    /**
     * 升级插件
     */
    @Post("/upgrade/:id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "upgrade",
        name: "升级插件",
        description: "升级插件",
    })
    async upgrade(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() downloadPlugDto: DownloadPluginDto,
    ) {
        // TODO 升级插件时备份源代码
        return await this.pluginService.upgrade(id, downloadPlugDto);
    }

    /**
     * 插件状态
     */
    @Post("/status/:id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "status",
        name: "插件状态",
        description: "插件状态",
    })
    async status(@Param("id", UUIDValidationPipe) id: string) {
        return await this.pluginService.status(id);
    }

    /**
     * 打包插件
     */
    @Post("/package")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "package",
        name: "打包插件",
        description: "打包插件",
    })
    async package(@Body() packagePluginDto: PackagePluginDto) {
        return await this.pluginService.package(packagePluginDto);
    }

    /**
     * 下载插件包
     */
    @Post("/download-package/:id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "download-package",
        name: "下载插件打包结果",
        description: "下载插件打包结果",
    })
    async downloadPackage(@Param("id", UUIDValidationPipe) id: string) {
        return await this.pluginService.downloadPackageResult(id);
    }

    /**
     * 开发版插件密钥
     */
    @Post("/developer-secret")
    @Permissions({
        code: "developer-secret-set",
        name: "设置开发版插件密钥",
        description: "设置开发版插件密钥",
    })
    async developerSecret(@Body() developerSecretDto: DeveloperSecretDto) {
        return await this.pluginService.setDeveloperSecret(developerSecretDto);
    }

    /**
     * 获取开发版插件密钥
     */
    @Get("/developer-secret")
    @Permissions({
        code: "developer-secret-get",
        name: "获取开发版插件密钥",
        description: "获取开发版插件密钥",
    })
    async getDeveloperSecret() {
        return await this.pluginService.getDeveloperSecret();
    }

    /**
     * 查询插件详情
     */
    @Get(":id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "detail",
        name: "查询插件详情",
        description: "查询插件详情",
    })
    async findOne(@Param("id", UUIDValidationPipe) id: string) {
        return await this.pluginService.findOneById(id);
    }
}
