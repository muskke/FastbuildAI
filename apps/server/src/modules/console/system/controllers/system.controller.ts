import { ConsoleController } from "@common/decorators";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { isProduction } from "@common/utils/is.util";
import { Controller, Logger, Post } from "@nestjs/common";
import { Permissions } from "src/common/decorators/permissions.decorator";

import { SystemService } from "../services/system.service";

/**
 * 系统控制器
 *
 * 提供系统级操作的接口，如重启应用
 */
@ConsoleController("system", "系统")
export class SystemController {
    private readonly logger = new Logger(SystemController.name);

    constructor(private readonly systemService: SystemService) {}

    /**
     * 重启应用
     *
     * 通过PM2自动重启机制实现可靠的应用重启
     */
    @Post("restart")
    @Permissions({
        code: "restart",
        name: "重启应用",
    })
    async restartApplication() {
        return this.systemService.restartApplication();
    }
}
