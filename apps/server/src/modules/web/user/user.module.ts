import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { FinanceService } from "@modules/console/finance/services/finance.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

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
        // 注册用户、角色和权限实体
        TypeOrmModule.forFeature([User, Role, Permission, AccountLog]),
        // 导入AuthModule以获取RolePermissionService
        AuthModule,
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
