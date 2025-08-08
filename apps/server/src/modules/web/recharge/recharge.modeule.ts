import { User } from "@common/modules/auth/entities/user.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { Recharge } from "@modules/console/recharge/entities/recharge.entity";
import { RechargeOrder } from "@modules/console/recharge/entities/recharge-order.entity";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RechargeController } from "./controllers/recharge.controller";
import { RechargeService } from "./services/recharge.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Dict, RechargeOrder, Recharge, User, Payconfig]),
        DictModule,
    ],
    controllers: [RechargeController],
    providers: [RechargeService],
    exports: [RechargeService],
})
export class RechargeModule {}
