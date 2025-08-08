import { DictModule } from "@common/modules/dict/dict.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MenuModule } from "../menu/menu.module";
import { PlugController } from "./controllers/plugin.controller";
import { PlugEntity } from "./entities/plugin.entity";
import { pluginService } from "./services/plugin.service";

/**
 * 插件模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([PlugEntity]), HttpModule, DictModule, MenuModule],
    controllers: [PlugController],
    providers: [pluginService],
    exports: [pluginService],
})
export class PluginModule {}
