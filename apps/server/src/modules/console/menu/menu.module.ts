import { Permission } from "@common/modules/auth/entities/permission.entity";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Menu } from "./entities/menu.entity";
import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";

/**
 * 菜单模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([Menu, Permission, User, Role])],
    controllers: [MenuController],
    providers: [MenuService],
    exports: [MenuService],
})
export class MenuModule {}
