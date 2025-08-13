import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { PayModule } from "@common/modules/pay/pay.module";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PayconfigController } from "./controllers/payconfig.controller";
import { SystemController } from "./controllers/system.controller";
import { WebsiteController } from "./controllers/website.controller";
import { PayconfigService } from "./services/payconfig.service";
import { SystemService } from "./services/system.service";
import { WebsiteService } from "./services/website.service";

/**
 * 系统模块
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Dict]),
        DictModule,
        TypeOrmModule.forFeature([Payconfig]),
        forwardRef(() => PayModule),
    ],
    controllers: [WebsiteController, SystemController, PayconfigController],
    providers: [WebsiteService, SystemService, PayconfigService],
    exports: [WebsiteService, SystemService, PayconfigService],
})
export class SystemModule {}
