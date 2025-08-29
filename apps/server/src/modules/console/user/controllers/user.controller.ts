import { BaseController } from "@common/base/controllers/base.controller";
import { FileService } from "@common/base/services/file.service";
import { BooleanNumberType } from "@common/constants";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { RolePermissionService } from "@common/modules/auth/services/role-permission.service";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { isEnabled } from "@common/utils/is.util";
import { Body, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { In } from "typeorm";

import { MenuService } from "../../menu/menu.service";
import { RoleService } from "../../role/role.service";
import { BatchUpdateUserDto } from "../dto/batch-update-user.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { BatchDeleteUserDto, DeleteUserDto } from "../dto/delete-user.dto";
import { QueryUserDto } from "../dto/query-user.dto";
import { UpdateUserBalanceDto, UpdateUserDto } from "../dto/update-user.dto";
import { UserService } from "../services/user.service";

/**
 * 用户管理控制器
 */
@ConsoleController("users", "用户管理")
export class UserController extends BaseController {
    /**
     * 构造函数
     *
     * @param userService 用户服务
     * @param menuService 菜单服务
     * @param rolePermissionService 角色权限服务
     */
    constructor(
        private readonly userService: UserService,
        @Inject(MenuService)
        private readonly menuService: MenuService,
        @Inject(RolePermissionService)
        private readonly rolePermissionService: RolePermissionService,
        private readonly roleService: RoleService,
    ) {
        super();
    }

    /**
     * 获取当前用户信息、权限和菜单树
     *
     * @param user 当前登录用户
     * @returns 用户信息、权限码和菜单树
     */
    @Get("info")
    @BuildFileUrl(["**.avatar"])
    async getUserInfo(@Playground() user: UserPlayground) {
        // 获取用户信息（排除敏感字段）
        const userInfo = await this.userService.findOneById(user.id, {
            excludeFields: ["password"],
            relations: ["role"],
        });

        if (!userInfo) {
            throw HttpExceptionFactory.notFound("用户不存在");
        }

        // 获取用户的所有权限码
        const permissionCodes = await this.rolePermissionService.getUserPermissions(user.id);

        // 获取菜单树（根据用户权限筛选）
        const menuTree = await this.menuService.getMenuTreeByPermissions(
            userInfo.isRoot ? [] : permissionCodes,
        );

        return {
            user: {
                ...userInfo,
                permissions: userInfo.isRoot || permissionCodes.length > 0 ? 1 : 0,
            },
            permissions: permissionCodes,
            menus: menuTree,
        };
    }

    /**
     * 查询全部角色列表（不分页）
     *
     * @returns 全部角色列表
     */
    @Get("roles")
    @Permissions({
        code: "list",
        name: "查看角色",
        description: "查询全部角色列表",
    })
    async findAllRoles() {
        return this.roleService.findAll();
    }

    /**
     * 查询用户列表
     *
     * @param queryUserDto 查询用户DTO
     * @returns 用户列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查看用户列表",
        description: "分页查询用户列表",
    })
    @BuildFileUrl(["**.avatar"])
    async findAll(@Query() queryUserDto: QueryUserDto, @Playground() user: UserPlayground) {
        return await this.userService.list(queryUserDto, user);
    }

    /**
     * 查询单个用户
     *
     * @param id 用户ID
     * @returns 用户信息
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看用户详情",
        description: "根据ID查询用户信息",
    })
    @BuildFileUrl(["**.avatar"])
    async findOneById(@Param("id", UUIDValidationPipe) id: string) {
        const result = await this.userService.findOneById(id, {
            excludeFields: ["password", "openid"],
            relations: ["role"],
        });

        if (!result) {
            throw HttpExceptionFactory.notFound("用户不存在");
        }
        return result;
    }

    /**
     * 更新用户
     *
     * @param id 用户ID
     * @param updateUserDto 更新用户DTO
     * @param currentUser 当前登录用户
     * @returns 更新后的用户
     *
     * 注意：更新成功后会清理该用户的角色与权限缓存，确保后续权限读取为最新。
     */
    @Patch(":id")
    @Permissions({
        code: "update",
        name: "更新用户",
        description: "更新用户信息",
    })
    @BuildFileUrl(["**.avatar"])
    async update(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @Playground() currentUser: UserPlayground,
    ) {
        const user = await this.userService.findOne({
            where: {
                id,
            },
        });

        if (!user) {
            throw HttpExceptionFactory.notFound("用户不存在");
        }

        let result;
        // 如果要修改的是超级管理员
        if (isEnabled(user.isRoot)) {
            // 只有超级管理员本人可以修改自己的信息
            if (currentUser.id !== id) {
                throw HttpExceptionFactory.unauthorized("暂无权限");
            }
            // 超级管理员可以修改自己的基本信息
            result = await this.userService.updateById(id, updateUserDto, {
                excludeFields: ["password"],
            });
        } else {
            result = await this.userService.updateById(id, updateUserDto, {
                excludeFields: ["password"],
            });
        }

        // 更新成功后清理该用户的权限相关缓存（忽略清理失败，不影响主流程）
        this.rolePermissionService
            .clearUserCache(id)
            .catch((e) => this.logger?.warn?.(`清理用户缓存失败: ${e.message}`));

        return result;
    }

    /**
     * 删除用户
     *
     * @param id 用户ID
     * @returns 是否成功
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除用户",
        description: "删除指定用户",
    })
    async remove(@Param() dto: DeleteUserDto) {
        const user = await this.userService.findOne({
            where: {
                id: dto.id,
            },
        });

        if (user) {
            if (isEnabled(user.isRoot)) {
                throw HttpExceptionFactory.unauthorized("暂无权限");
            } else {
                return {
                    success: await this.userService.delete(dto.id),
                };
            }
        } else {
            throw HttpExceptionFactory.notFound("用户不存在");
        }
    }

    /**
     * 批量删除用户
     *
     * @param ids 用户ID数组（UUID格式）
     * @returns 是否成功
     */
    @Post("batch-delete")
    @Permissions({
        code: "batch-delete",
        name: "删除用户",
        description: "批量删除用户",
    })
    async batchRemove(@Body() dto: BatchDeleteUserDto) {
        // 查询所有要删除的用户
        const users = await this.userService.findAll({
            where: {
                id: In(dto.ids),
            },
        });

        // 检查是否有超级管理员
        const rootUsers = users.filter((user) => isEnabled(user.isRoot));

        if (rootUsers.length > 0) {
            const rootUserIds = rootUsers.map((user) => user.id);
            throw HttpExceptionFactory.unauthorized(
                `超级管理员不可删除: ${rootUserIds.join(", ")}`,
            );
        }

        return {
            success: await this.userService.deleteMany(dto.ids),
        };
    }

    /**
     * 重置用户密码
     *
     * @param id 用户ID
     * @param password 新密码
     * @returns 是否成功
     */
    @Post("/reset-password/:id")
    @Permissions({
        code: "reset-password",
        name: "重置密码",
        description: "重置用户密码",
    })
    async resetPassword(
        @Param("id", UUIDValidationPipe) id: string,
        @Body("password") password: string,
    ) {
        return await this.userService.resetPassword(id, password);
    }

    /**
     * 设置用户状态
     *
     * @param id 用户ID
     * @param status 状态（0: 禁用, 1: 启用）
     * @returns 更新后的用户
     */
    @Post("/status/:id")
    @Permissions({
        code: "update-status",
        name: "更新用户状态",
        description: "设置用户启用状态",
    })
    async setStatus(
        @Param("id", UUIDValidationPipe) id: string,
        @Body("status") status: BooleanNumberType,
    ) {
        return await this.userService.setUserStatus(id, status);
    }

    @Post("/change-balance/:id")
    @Permissions({
        code: "change-balance",
        name: "更新用户余额",
        description: "设置用户余额",
    })
    async changeBalance(
        @Param("id", UUIDValidationPipe) userId: string,
        @Body() dto: UpdateUserBalanceDto,
    ) {
        return await this.userService.updateBalance(userId, dto);
    }

    /**
     * 批量更新用户
     *
     * @param dto 批量更新用户DTO
     * @param currentUser 当前登录用户
     * @returns 更新结果
     */
    @Post("batch-update")
    @Permissions({
        code: "batch-update",
        name: "批量更新用户",
        description: "批量更新多个用户信息",
    })
    async batchUpdate(@Body() dto: BatchUpdateUserDto, @Playground() currentUser: UserPlayground) {
        return await this.userService.batchUpdate(dto, currentUser.id);
    }

    /**
     * 创建用户
     *
     * @param createUserDto 创建用户DTO
     * @returns 创建的用户
     */
    @Post()
    @Permissions({
        code: "create",
        name: "创建用户",
        description: "创建新的用户账号",
    })
    @BuildFileUrl(["**.avatar"])
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.userService.createUser(createUserDto);
    }
}
