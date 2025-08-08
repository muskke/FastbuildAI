import { BaseController } from "@common/base/controllers/base.controller";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Body, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";

import { UpdateRechargeConfigDto } from "../dto/update-recharge-config.dto";
import { RechargeConfigService } from "../services/recharge-config.service";
@ConsoleController("recharge-config", "充值配置")
export class RechargeConfigController extends BaseController {
    constructor(private readonly rechargeConfigService: RechargeConfigService) {
        super();
    }

    @Get()
    @Permissions({
        code: "getConfig",
        name: "获取充值配置",
        description: "获取充值配置",
    })
    async getConfig() {
        return await this.rechargeConfigService.getConfig();
    }

    @Post()
    @Permissions({
        code: "setConfig",
        name: "设置充值配置",
        description: "设置充值配置",
    })
    async setConfig(@Body() updateRechargeConfigDto: UpdateRechargeConfigDto) {
        return await this.rechargeConfigService.setConfig(updateRechargeConfigDto);
    }
}
