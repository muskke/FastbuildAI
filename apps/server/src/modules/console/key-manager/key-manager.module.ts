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
 *
 * 提供密钥模板和密钥配置的管理功能，包括：
 * - 密钥模板的创建、查询、更新、删除
 * - 密钥配置的创建、查询、更新、删除
 * - 密钥配置的状态管理和使用统计
 * - 敏感字段的加密存储和掩码显示
 */
@Module({
    imports: [TypeOrmModule.forFeature([KeyConfig, KeyTemplate, AiProvider])],
    controllers: [KeyTemplateController, KeyConfigController],
    providers: [KeyTemplateService, KeyConfigService, AiProviderService],
    exports: [KeyTemplateService, KeyConfigService],
})
export class KeyManagerModule {}
