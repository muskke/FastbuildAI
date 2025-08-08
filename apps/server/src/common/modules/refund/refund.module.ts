import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RefundLog } from "./entities/refund-log.entity";
import { RefundService } from "./services/refund.service";

@Module({
    imports: [TypeOrmModule.forFeature([RefundLog])],
    providers: [RefundService],
    exports: [RefundService],
})
export class RefundModule {}
