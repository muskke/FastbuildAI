import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChatConfigService } from "@/modules/console/ai/services/chat-config.service";

import { WebsiteService } from "../../console/system/services/website.service";
import { ConfigController } from "./controllers/config.controller";

/**
 * 前台配置模块
 *
 * 处理前台网站配置信息获取相关功能
 */
@Module({
    imports: [
        // 注册字典实体
        TypeOrmModule.forFeature([Dict]),
    ],
    controllers: [ConfigController],
    providers: [WebsiteService, DictService, ChatConfigService],
    exports: [WebsiteService, ChatConfigService],
})
export class ConfigModule {}
