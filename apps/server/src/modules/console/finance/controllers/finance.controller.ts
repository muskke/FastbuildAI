import { BaseController } from "@common/base/controllers/base.controller";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Body, Get, Param, Post, Query } from "@nestjs/common";

import { QueryAccountLogDto } from "../dto/query-account-log.dto";
import { FinanceService } from "../services/finance.service";

@ConsoleController("finance", "财务")
export class FinanceController extends BaseController {
    constructor(private readonly financeService: FinanceService) {
        super();
    }
    @Get("center")
    @Permissions({
        code: "center",
        name: "财务中心",
        description: "财务中心",
    })
    async center() {
        return this.financeService.center();
    }

    @Get("account-log")
    @Permissions({
        code: "account-log",
        name: "用户账户日志列表",
        description: "用户账户日志列表",
    })
    @BuildFileUrl(["**.avatar"])
    async lists(@Query() queryAccountLogDto: QueryAccountLogDto) {
        return this.financeService.accountLogLists(queryAccountLogDto);
    }
}
