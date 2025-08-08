import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { DictCacheService } from "@common/modules/dict/services/dict-cache.service";
import { CacheModule } from "@core/cache/cache.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WxOaConfigController } from "./controller/wxoaconfig.controller";
import { WxOaConfigService } from "./services/wxoaconfig.service";
@Module({
    imports: [TypeOrmModule.forFeature([Dict]), DictModule, CacheModule],
    controllers: [WxOaConfigController],
    providers: [WxOaConfigService, DictService, DictCacheService],
    exports: [WxOaConfigService],
})
export class ChannelModule {}
