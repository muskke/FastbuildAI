import { User } from "@common/modules/auth/entities/user.entity";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { DictCacheService } from "@common/modules/dict/services/dict-cache.service";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { RefundLog } from "@common/modules/refund/entities/refund-log.entity";
import { RefundService } from "@common/modules/refund/services/refund.service";
import { CacheService } from "@core/cache/cache.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiChatMessage } from "../ai/entities/ai-chat-message.entity";
import { AiChatRecord } from "../ai/entities/ai-chat-record.entity";
import { Recharge } from "../recharge/entities/recharge.entity";
import { RechargeOrder } from "../recharge/entities/recharge-order.entity";
import { Payconfig } from "../system/entities/payconfig.entity";
import { PayconfigService } from "../system/services/payconfig.service";
import { FinanceController } from "./controllers/finance.controller";
import { AccountLog } from "./entities/account-log.entity";
import { FinanceService } from "./services/finance.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Dict,
            AccountLog,
            User,
            Recharge,
            RechargeOrder,
            Payconfig,
            AiChatMessage,
            RefundLog,
        ]),
    ],
    controllers: [FinanceController],
    providers: [
        FinanceService,
        RefundService,
        WxPayService,
        PayfactoryService,
        DictCacheService,
        PayconfigService,
        CacheService,
        DictService,
    ],
    exports: [
        FinanceService,
        RefundService,
        WxPayService,
        PayfactoryService,
        DictCacheService,
        PayconfigService,
        CacheService,
        DictService,
    ],
})
export class FinanceModule {}
