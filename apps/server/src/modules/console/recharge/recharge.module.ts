import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { RefundLog } from "@common/modules/refund/entities/refund-log.entity";
import { RefundService } from "@common/modules/refund/services/refund.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AccountLog } from "../finance/entities/account-log.entity";
import { Payconfig } from "../system/entities/payconfig.entity";
import { PayconfigService } from "../system/services/payconfig.service";
import { RechargeConfigController } from "./controllers/recharge-config.controller";
import { RechargeOrderController } from "./controllers/recharge-order.controller";
import { Recharge } from "./entities/recharge.entity";
import { RechargeOrder } from "./entities/recharge-order.entity";
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
        DictModule,
    ],
    controllers: [RechargeConfigController, RechargeOrderController],
    providers: [
        RechargeConfigService,
        RechargeOrderService,
        PayfactoryService,
        WxPayService,
        RefundService,
        PayconfigService,
        AccountLogService,
    ],
    exports: [
        RechargeConfigService,
        RechargeOrderService,
        PayfactoryService,
        WxPayService,
        RefundService,
        PayconfigService,
        AccountLogService,
    ],
})
export class RechargeModule {}
