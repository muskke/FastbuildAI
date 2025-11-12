import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { Dict } from "@buildingai/db/entities/dict.entity";
import { Payconfig } from "@buildingai/db/entities/payconfig.entity";
import { Recharge } from "@buildingai/db/entities/recharge.entity";
import { RechargeOrder } from "@buildingai/db/entities/recharge-order.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { PayModule as CommonPayModule } from "@common/modules/pay/pay.module";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { PayconfigService } from "@modules/system/services/payconfig.service";
import { Module } from "@nestjs/common";

import { PayWebController } from "./controllers/web/pay.controller";
import { PayService } from "./services/pay.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Dict, RechargeOrder, Recharge, User, Payconfig, AccountLog]),
        CommonPayModule,
    ],
    controllers: [PayWebController],
    providers: [PayService, PayconfigService, WxPayService],
    exports: [PayService, PayconfigService, WxPayService],
})
export class PayModule {}
