import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../auth/entities/user.entity";
import { AccountLogService } from "./services/account-log.service";

@Module({
    imports: [TypeOrmModule.forFeature([AccountLog, User])],
    controllers: [],
    providers: [AccountLogService],
    exports: [AccountLogService],
})
export class AccountModule {}
