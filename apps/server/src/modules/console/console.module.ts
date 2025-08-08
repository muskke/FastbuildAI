import { Module } from "@nestjs/common";

import { AiConsoleModule } from "./ai/ai.module";
import { DatasetsConsoleModule } from "./datasets/datasets.module";
import { DecorateModule } from "./decorate/decorate.module";
import { FinanceModule } from "./finance/finance.module";
import { HealthModule } from "./health/health.module";
import { MenuModule } from "./menu/menu.module";
import { PermissionModule } from "./permission/permission.module";
import { PluginModule } from "./plugin/plugin.module";
import { RechargeModule } from "./recharge/recharge.module";
import { RoleModule } from "./role/role.module";
import { SystemModule } from "./system/system.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        HealthModule,
        UserModule,
        RoleModule,
        PermissionModule,
        PluginModule,
        MenuModule,
        DecorateModule,
        SystemModule,
        AiConsoleModule,
        RechargeModule,
        DatasetsConsoleModule,
        FinanceModule,
    ],
    exports: [
        HealthModule,
        UserModule,
        RoleModule,
        PermissionModule,
        PluginModule,
        MenuModule,
        SystemModule,
        AiConsoleModule,
        RechargeModule,
        DatasetsConsoleModule,
        FinanceModule,
    ],
})
export class ConsoleModule {}
