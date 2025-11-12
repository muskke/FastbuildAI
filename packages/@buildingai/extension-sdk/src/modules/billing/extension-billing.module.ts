import { BaseBillingService } from "@buildingai/core/modules/billing/base-billing.service";
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AccountLog } from "@buildingai/db/entities/account-log.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { Global, Module } from "@nestjs/common";

import { ExtensionBillingService } from "./extension-billing.service";

/**
 * Extension Billing Module (Global)
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, AccountLog])],
    providers: [BaseBillingService, ExtensionBillingService],
    exports: [
        BaseBillingService,
        ExtensionBillingService,
        TypeOrmModule.forFeature([User, AccountLog]),
    ],
})
export class ExtensionBillingModule {}
