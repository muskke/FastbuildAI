import { BaseController } from "@common/base/controllers/base.controller";
import { BaseService } from "@common/base/services/base.service";
import { FileService } from "@common/base/services/file.service";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { ACCOUNT_LOG_TYPE_DESCRIPTION } from "@common/modules/account/constants/account-log.constants";
import { RolePermissionService } from "@common/modules/auth/services/role-permission.service";
import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { Body, Get, Inject, Patch, Query } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Like, Not, Repository } from "typeorm";

import { UserService } from "../../console/user/services/user.service";
import { AccountLogDto } from "./dto/account-log-dto";
import { ALLOWED_USER_FIELDS, UpdateUserFieldDto } from "./dto/update-user-field.dto";

/**
 * 前台用户控制器
 *
 * 处理前台用户信息管理相关功能
 */
@WebController("user")
export class UserController extends BaseController {
    private readonly accountLogService: BaseService<AccountLog>;

    /**
     * 构造函数
     *
     * @param userService 用户服务
     * @param rolePermissionService 角色权限服务
     */
    constructor(
        private readonly userService: UserService,
        @Inject(RolePermissionService)
        private readonly rolePermissionService: RolePermissionService,
        private readonly fileService: FileService,
        @InjectRepository(AccountLog)
        private readonly accountLogRepository: Repository<AccountLog>,
    ) {
        super();
        this.accountLogService = new BaseService(accountLogRepository);
    }

    /**
     * 获取当前用户信息
     *
     * @param user 当前登录用户
     * @returns 用户信息
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

        // 判断用户是否有权限：有权限就是1，没有权限就是0
        const hasPermissions = user.isRoot === 1 || permissionCodes.length > 0 ? 1 : 0;

        return {
            ...userInfo,
            permissions: hasPermissions,
        };
    }

    /**
     * 搜索用户列表
     *
     * @param keyword 搜索关键词
     * @param limit 返回数量限制
     * @returns 用户列表（只返回有角色的用户）
     */
    @Get("search")
    @BuildFileUrl(["**.avatar"])
    async searchUsers(@Query("keyword") keyword?: string, @Query("limit") limit?: number) {
        const searchLimit = Math.min(limit || 20, 50); // 限制最大返回50条

        // 查询用户列表 - 只返回有角色的用户
        const users = await this.userService.findAll({
            where: keyword
                ? [
                      { username: Like(`%${keyword}%`), status: 1, role: Not(IsNull()) },
                      { nickname: Like(`%${keyword}%`), status: 1, role: Not(IsNull()) },
                      { email: Like(`%${keyword}%`), status: 1, role: Not(IsNull()) },
                  ]
                : { isRoot: 0, status: 1, role: Not(IsNull()) },
            take: searchLimit,
            order: { createdAt: "DESC" },
            excludeFields: ["password", "phone", "phoneAreaCode", "permissions"],
            relations: ["role"],
        });

        return users;
    }

    /**
     * 修改用户信息（单个字段）
     *
     * @param updateUserFieldDto 更新用户字段DTO
     * @param currentUser 当前登录用户
     * @returns 更新后的用户信息
     */
    @Patch("update-field")
    @BuildFileUrl(["**.avatar"])
    async updateUserField(
        @Body() updateUserFieldDto: UpdateUserFieldDto,
        @Playground() currentUser: UserPlayground,
    ) {
        const { field, value } = updateUserFieldDto;
        let newValue = value;

        // 检查用户是否存在
        const user = await this.userService.findOneById(currentUser.id);
        if (!user) {
            throw HttpExceptionFactory.notFound("用户不存在");
        }

        // 验证字段是否允许更新
        if (!ALLOWED_USER_FIELDS.includes(field)) {
            throw HttpExceptionFactory.badRequest(`不允许更新字段: ${field}`);
        }

        // 特殊字段验证
        if (field === "email" && newValue) {
            // 检查邮箱是否已被其他用户使用
            const existingUser = await this.userService.findOne({
                where: { email: newValue },
            });
            if (existingUser && existingUser.id !== currentUser.id) {
                throw HttpExceptionFactory.badRequest("该邮箱已被其他用户使用");
            }
        }

        if (field === "phone" && newValue) {
            // 检查手机号是否已被其他用户使用
            const existingUser = await this.userService.findOne({
                where: { phone: newValue },
            });
            if (existingUser && existingUser.id !== currentUser.id) {
                throw HttpExceptionFactory.badRequest("该手机号已被其他用户使用");
            }
        }

        // 构建更新数据
        const updateData: Record<string, any> = {};
        updateData[field] = newValue;

        // 更新用户信息
        const updatedUser = await this.userService.updateById(currentUser.id, updateData, {
            excludeFields: ["password"],
        });

        return {
            user: updatedUser,
            message: `更新成功`,
        };
    }

    /**
     * 账户记录
     * @param accountLogDto
     * @param user
     * @returns
     */
    @Get("account-log")
    async accountLog(@Query() accountLogDto: AccountLogDto, @Playground() user: UserPlayground) {
        const { action } = accountLogDto;
        const queryBuilder = this.accountLogRepository.createQueryBuilder("account-log");
        queryBuilder.where("account-log.userId = :userId", { userId: user.id });
        console.log(action);
        if ("" != action) {
            queryBuilder.andWhere("account-log.action = :action", { action });
        }
        const userInfo = await this.userService.findOne({
            where: { id: user.id },
            select: ["power"],
        });
        queryBuilder
            .orderBy("account-log.createdAt", "DESC")
            .addOrderBy("account-log.accountType", "DESC");
        const lists = await this.accountLogService.paginateQueryBuilder(
            queryBuilder,
            accountLogDto,
        );
        lists.items = lists.items.map((accountLog) => {
            const accountTypeDesc = ACCOUNT_LOG_TYPE_DESCRIPTION[accountLog.accountType];
            const consumeSourceDesc = "";
            return { ...accountLog, accountTypeDesc, consumeSourceDesc };
        });
        return { ...lists, userInfo };
    }
}
