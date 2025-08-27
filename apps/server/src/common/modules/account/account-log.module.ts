import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { UserModule } from "@modules/console/user/user.module";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AccountLogService } from "./services/account-log.service";

@Module({
    imports: [TypeOrmModule.forFeature([AccountLog]), forwardRef(() => UserModule)],
    controllers: [],
    providers: [AccountLogService],
    exports: [AccountLogService],
})
export class AccountLogModule {}
