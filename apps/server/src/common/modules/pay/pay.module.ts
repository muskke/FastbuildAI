import { DictModule } from "@common/modules/dict/dict.module";
import { CacheModule } from "@core/cache/cache.module";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { PayconfigService } from "@modules/console/system/services/payconfig.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PayfactoryService } from "./services/payfactory.service";
import { WxPayService } from "./services/wxpay.service";

@Module({
    imports: [TypeOrmModule.forFeature([Payconfig]), CacheModule, DictModule],
    controllers: [],
    providers: [PayconfigService, WxPayService, PayfactoryService],
    exports: [PayconfigService, WxPayService, PayfactoryService],
})
export class PayModule {}
