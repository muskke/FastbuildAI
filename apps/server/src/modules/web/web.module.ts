import { Module } from "@nestjs/common";

import { AgentModule } from "./agent/agent.module";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config/config.module";
import { DatasetsModule } from "./datasets/datasets.module";
import { DecorateModule } from "./decorate/decorate.module";
import { PayModule } from "./pay/pay.module";
import { RechargeModule } from "./recharge/recharge.modeule";
import { UploadModule } from "./upload/upload.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        AgentModule,
        AuthModule,
        UploadModule,
        AiModule,
        DecorateModule,
        UserModule,
        ConfigModule,
        DatasetsModule,
        RechargeModule,
        PayModule,
    ],
    exports: [
        AgentModule,
        AuthModule,
        UploadModule,
        AiModule,
        DecorateModule,
        UserModule,
        ConfigModule,
        DatasetsModule,
        RechargeModule,
        PayModule,
    ],
})
export class WebModule {}
