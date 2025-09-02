import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiProvider } from "../ai/entities/ai-provider.entity";
import { AiProviderService } from "../ai/services/ai-provider.service";
import { KeyConfigController } from "./controllers/key-config.controller";
import { KeyTemplateController } from "./controllers/key-template.controller";
import { KeyConfig } from "./entities/key-config.entity";
import { KeyTemplate } from "./entities/key-template.entity";
import { KeyConfigService } from "./services/key-config.service";
import { KeyTemplateService } from "./services/key-template.service";

/**
 * 密钥管理模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([KeyConfig, KeyTemplate, AiProvider])],
    controllers: [KeyTemplateController, KeyConfigController],
    providers: [KeyTemplateService, KeyConfigService, AiProviderService],
    exports: [KeyTemplateService, KeyConfigService],
})
export class KeyManagerModule {}
