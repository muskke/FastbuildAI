import { BaseController } from "@common/base/controllers/base.controller";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";

import { UpdatePayconfigDto } from "../dto/update-payconfig";
import { BooleanNumberType } from "../inerface/payconfig.constant";
import { PayconfigService } from "../services/payconfig.service";

@ConsoleController("system-payconfig", "支付配置")
export class PayconfigController extends BaseController {
    constructor(private readonly payconfigService: PayconfigService) {
        super();
    }

    /**
     * 获取支付配置列表
     *
     * @returns 支付配置列表
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查看支付列表",
        description: "获取支付配置列表",
    })
    @BuildFileUrl(["**.logo"])
    async getPayconfigList() {
        return await this.payconfigService.list();
    }
    /**
     * 根据id更改支付配置状态
     *
     * @param id 支付配置id
     * @param isEnable 是否启用
     * @returns 更新后的支付配置
     */
    @Patch(":id")
    @Permissions({
        code: "update-status",
        name: "更新支付配置状态",
        description: "根据id更改支付配置状态",
    })
    async updateStatus(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() body: { isEnable: BooleanNumberType },
    ) {
        return await this.payconfigService.updateStatus(id, body.isEnable);
    }
    /**
     * 根据id获取支付配置
     *
     * @param id 支付配置id
     * @returns 支付配置
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "获取支付配置详情",
        description: "根据id获取支付配置",
    })
    @BuildFileUrl(["**.logo"])
    async getPayconfig(@Param("id", UUIDValidationPipe) id: string) {
        const result = await this.payconfigService.findOneById(id);
        if (!result) {
            throw HttpExceptionFactory.notFound("支付配置不存在");
        }
        return result;
    }
    /**
     * 根据id更改支付配置
     *
     * @param id 支付配置id
     * @param isEnable
     * @returns 更新后的支付配置
     */
    @Post()
    @Permissions({
        code: "update",
        name: "更新支付配置",
        description: "根据id更改支付配置",
    })
    @BuildFileUrl(["**.logo"])
    async updatePayconfig(@Body() dto: UpdatePayconfigDto) {
        return await this.payconfigService.updatePayconfig(dto.id, dto);
    }
}
