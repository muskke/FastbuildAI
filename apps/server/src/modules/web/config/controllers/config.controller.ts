import { BaseController } from "@common/base/controllers/base.controller";
import { Public } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Get } from "@nestjs/common";

import { ChatConfigService } from "@/modules/console/ai/services/chat-config.service";

import { WebsiteService } from "../../../console/system/services/website.service";

/**
 * 前台配置控制器
 *
 * 处理前台网站配置信息获取
 */
@WebController("config")
export class ConfigController extends BaseController {
    /**
     * 构造函数
     *
     * @param websiteService 网站配置服务
     * @param chatConfigService 对话配置服务
     */
    constructor(
        private readonly websiteService: WebsiteService,
        private readonly chatConfigService: ChatConfigService,
    ) {
        super();
    }

    /**
     * 获取网站基础配置信息（网站信息、版权信息、统计信息）
     *
     * @returns 网站基础配置信息
     */
    @Get()
    @BuildFileUrl(["**.logo", "**.icon"])
    @Public()
    async getConfig() {
        const fullConfig = await this.websiteService.getConfig();

        return {
            webinfo: fullConfig.webinfo,
            copyright: fullConfig.copyright,
            statistics: fullConfig.statistics,
        };
    }

    /**
     * 获取协议配置信息
     *
     * @returns 协议配置信息
     */
    @Get("agreement")
    @Public()
    async getAgreement() {
        const fullConfig = await this.websiteService.getConfig();

        // 只返回 agreement 配置组
        return {
            agreement: fullConfig.agreement,
        };
    }

    /**
     * 获取对话配置信息
     *
     * @returns 对话配置信息
     */
    @Get("chat")
    @Public()
    async getChatConfig() {
        return await this.chatConfigService.getChatConfig();
    }
}
