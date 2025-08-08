import { BaseController } from "@common/base/controllers/base.controller";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Body, Get, Post } from "@nestjs/common";

import { UpdateWebsiteDto } from "../dto/update-website.dto";
import { WebsiteService } from "../services/website.service";

@ConsoleController("system-website", "网站设置")
export class WebsiteController extends BaseController {
    constructor(private readonly websiteService: WebsiteService) {
        super();
    }

    @Get()
    @BuildFileUrl(["**.logo", "**.icon"])
    @Permissions({
        code: "getConfig",
        name: "获取网站配置",
        description: "获取网站配置",
    })
    async getConfig() {
        return await this.websiteService.getConfig();
    }

    @Post()
    @BuildFileUrl(["**.logo", "**.icon"])
    @Permissions({
        code: "setConfig",
        name: "设置网站配置",
        description: "设置网站配置",
    })
    async setConfig(@Body() updateWebsiteDto: UpdateWebsiteDto) {
        return await this.websiteService.setConfig(updateWebsiteDto);
    }
}
