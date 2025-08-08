import { BaseController } from "@common/base/controllers/base.controller";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { PaginationDto } from "@common/dto/pagination.dto";
import { UserPlayground } from "@common/interfaces/context.interface";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { PayConfigType } from "@modules/console/system/inerface/payconfig.constant";
import { Body, Get, Post, Query } from "@nestjs/common";

import { RechargeService } from "../services/recharge.service";

@WebController("recharge")
export class RechargeController extends BaseController {
    constructor(private readonly rechargeService: RechargeService) {
        super();
    }

    /**
     * 充值记录
     * @param paginationDto
     * @param user
     * @returns
     */
    @Get("lists")
    async lists(@Query() paginationDto: PaginationDto, @Playground() user: UserPlayground) {
        return await this.rechargeService.lists(paginationDto, user.id);
    }

    /**
     * 充值中心
     * @param user
     * @returns
     */
    @BuildFileUrl(["**.avatar", "**.logo"])
    @Get("center")
    async center(@Playground() user: UserPlayground) {
        return await this.rechargeService.center(user.id);
    }

    /**
     * 充值提交订单
     * @param id
     * @param payType
     * @param user
     * @returns
     */
    @Post("submitRecharge")
    async submitRecharge(
        @Body("id", UUIDValidationPipe) id: string,
        @Body("payType") payType: PayConfigType,
        @Playground() user: UserPlayground,
    ) {
        return await this.rechargeService.submitRecharge(id, payType, user.id, user.terminal);
    }
}
