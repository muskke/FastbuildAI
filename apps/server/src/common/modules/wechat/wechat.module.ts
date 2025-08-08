import { AuthService } from "@common/modules/auth/auth.service";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { RedisModule } from "@core/redis/redis.module";
import { ChannelModule } from "@modules/console/channel/channel.module";
import { WxOaConfigService } from "@modules/console/channel/services/wxoaconfig.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WechatOaService } from "./services/wechatoa.service";

@Module({
    imports: [ChannelModule, RedisModule],
    providers: [WechatOaService, WxOaConfigService, AuthService],
    exports: [WechatOaService],
})
export class WechatModule {}
