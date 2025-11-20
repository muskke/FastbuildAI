import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { Dict } from "@buildingai/db/entities/dict.entity";
import { Payconfig } from "@buildingai/db/entities/payconfig.entity";
import { Recharge } from "@buildingai/db/entities/recharge.entity";
import { RechargeOrder } from "@buildingai/db/entities/recharge-order.entity";
import { RefundLog } from "@buildingai/db/entities/refund-log.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { RefundService } from "@common/modules/refund/services/refund.service";
import { Module } from "@nestjs/common";

import { PayconfigService } from "../system/services/payconfig.service";
import { RechargeConfigController } from "./controllers/console/recharge-config.controller";
import { RechargeOrderController } from "./controllers/console/recharge-order.controller";
import { RechargeWebController } from "./controllers/web/recharge.controller";
import { RechargeService } from "./services/recharge.service";
import { RechargeConfigService } from "./services/recharge-config.service";
import { RechargeOrderService } from "./services/recharge-order.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Dict,
            Recharge,
            RechargeOrder,
            Payconfig,
            User,
            RefundLog,
            AccountLog,
        ]),
    ],
    controllers: [RechargeConfigController, RechargeOrderController, RechargeWebController],
    providers: [
        RechargeConfigService,
        RechargeOrderService,
        PayfactoryService,
        WxPayService,
        RefundService,
        PayconfigService,
        RechargeService,
    ],
    exports: [
        RechargeConfigService,
        RechargeOrderService,
        PayfactoryService,
        WxPayService,
        RefundService,
        PayconfigService,
        RechargeService,
    ],
})
export class RechargeModule {}
