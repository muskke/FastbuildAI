import { CacheService } from "@buildingai/cache";
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { Agent } from "@buildingai/db/entities/ai-agent.entity";
import { AiChatMessage } from "@buildingai/db/entities/ai-chat-message.entity";
import { Dict } from "@buildingai/db/entities/dict.entity";
import { Payconfig } from "@buildingai/db/entities/payconfig.entity";
import { Recharge } from "@buildingai/db/entities/recharge.entity";
import { RechargeOrder } from "@buildingai/db/entities/recharge-order.entity";
import { RefundLog } from "@buildingai/db/entities/refund-log.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { DictCacheService } from "@buildingai/dict";
import { DictService } from "@buildingai/dict";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { RefundService } from "@common/modules/refund/services/refund.service";
import { FinanceController } from "@modules/finance/controllers/finance.controller";
import { FinanceService } from "@modules/finance/services/finance.service";
import { PayconfigService } from "@modules/system/services/payconfig.service";
import { Module } from "@nestjs/common";

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
            Agent,
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
