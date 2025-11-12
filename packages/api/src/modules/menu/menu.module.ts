import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { Menu } from "@buildingai/db/entities/menu.entity";
import { Permission } from "@buildingai/db/entities/permission.entity";
import { Role } from "@buildingai/db/entities/role.entity";
import { User } from "@buildingai/db/entities/user.entity";
import { MenuConsoleController } from "@modules/menu/controllers/console/menu.controller";
import { MenuService } from "@modules/menu/services/menu.service";
import { Module } from "@nestjs/common";

/**
 * 菜单模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([Menu, Permission, User, Role])],
    controllers: [MenuConsoleController],
    providers: [MenuService],
    exports: [MenuService],
})
export class MenuModule {}
