import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { RolePermissionService } from "@common/modules/auth/services/role-permission.service";
import { CacheModule } from "@core/cache/cache.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";

/**
 * 角色管理模块
 *
 * 提供角色的增删改查等管理功能
 */
@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission, User]), CacheModule],
    controllers: [RoleController],
    providers: [RoleService, RolePermissionService],
    exports: [RoleService, RolePermissionService],
})
export class RoleModule {}
