import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MenuModule } from "../menu/menu.module";
import { RoleModule } from "../role/role.module";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";

/**
 * 用户管理模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([User, Role]), MenuModule, RoleModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
