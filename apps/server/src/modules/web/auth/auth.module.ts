import { AuthService } from "@common/modules/auth/auth.service";
import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { UserToken } from "@common/modules/auth/entities/user-token.entity";
import { RolePermissionService } from "@common/modules/auth/services/role-permission.service";
import { UserTokenService } from "@common/modules/auth/services/user-token.service";
import { DictModule } from "@common/modules/dict/dict.module";
import { WechatOaService } from "@common/modules/wechat/services/wechatoa.service";
import { CacheModule } from "@core/cache/cache.module";
import { RedisModule } from "@core/redis/redis.module";
import { ChannelModule } from "@modules/console/channel/channel.module";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DiscoveryModule } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { StringValue } from "ms";

import { AuthController } from "./auth.controller";

/**
 * 认证模块
 *
 * 处理用户认证、授权相关功能
 */
@Module({
    imports: [
        // 注册实体
        TypeOrmModule.forFeature([User, Role, Permission, UserToken]),

        // 导入缓存模块
        CacheModule,

        // 导入Redis模块
        RedisModule,

        // 导入字典模块
        DictModule,

        // 导入频道模块
        ChannelModule,

        // 导入发现模块，用于扫描控制器
        DiscoveryModule,

        // 配置JWT模块
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: () => ({
                // 从环境变量获取JWT密钥，如果不存在则使用默认值
                secret: process.env.JWT_SECRET || "BuildingAI",
                signOptions: {
                    expiresIn: (process.env.JWT_EXPIRES_IN as StringValue) || "24h",
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, RolePermissionService, UserTokenService, WechatOaService],
    exports: [AuthService, JwtModule, RolePermissionService, UserTokenService],
})
export class AuthModule {}
