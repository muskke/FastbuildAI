import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiDatasetsModule } from "../../console/ai-datasets/datasets.module";
import { UserService } from "../../console/user/services/user.service";
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./user.controller";

/**
 * 前台用户模块
 *
 * 处理前台用户信息管理相关功能
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, Permission, AccountLog]),
        AuthModule,
        AiDatasetsModule,
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
