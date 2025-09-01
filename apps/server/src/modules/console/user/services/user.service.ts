import nicknameData from "@assets/nickname.json";
import { BaseService } from "@common/base/services/base.service";
import { BooleanNumberType, UserCreateSource } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import {
    ACCOUNT_LOG_SOURCE,
    ACCOUNT_LOG_TYPE,
    ACTION,
} from "@common/modules/account/constants/account-log.constants";
import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { RolePermissionService } from "@common/modules/auth/services/role-permission.service";
import { generateNo } from "@common/utils/helper.util";
import { isEnabled } from "@common/utils/is.util";
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Between, DeepPartial, In, Like, Repository } from "typeorm";

import { BatchUpdateUserDto } from "../dto/batch-update-user.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { QueryUserDto } from "../dto/query-user.dto";
import { UpdateUserBalanceDto, UpdateUserDto } from "../dto/update-user.dto";

/**
 * 用户服务
 */
@Injectable()
export class UserService extends BaseService<User> {
    /**
     * 构造函数
     *
     * @param userRepository 用户仓库
     */
    constructor(
        private readonly accountLogService: AccountLogService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @Inject(RolePermissionService)
        private readonly rolePermissionService: RolePermissionService,
    ) {
        super(userRepository);
    }

    /**
     * 分页查询用户列表
     *
     * @param dto 查询条件
     * @returns 用户列表和分页信息
     */
    async list(dto: QueryUserDto, user: UserPlayground): Promise<any> {
        const where: any[] = [];

        // 关键词模糊查询 - 搜索用户名、昵称、邮箱、手机号
        if (dto.keyword) {
            where.push([
                { username: Like(`%${dto.keyword}%`), isRoot: 0 },
                { nickname: Like(`%${dto.keyword}%`), isRoot: 0 },
                { email: Like(`%${dto.keyword}%`), isRoot: 0 },
                { phone: Like(`%${dto.keyword}%`), isRoot: 0 },
            ]);
        }

        // 状态筛选
        if (dto.status !== undefined && dto.status !== null) {
            if (where.length > 0) {
                // 如果已有关键词查询条件，需要与状态条件组合
                where.forEach((conditions) => {
                    if (Array.isArray(conditions)) {
                        conditions.forEach((condition) => {
                            condition.status = dto.status;
                        });
                    } else {
                        conditions.status = dto.status;
                    }
                });
            } else {
                where.push({ status: dto.status, isRoot: 0 });
            }
        }

        // 日期范围筛选
        if (dto.startTime && dto.endTime) {
            const dateCondition = { createdAt: Between(dto.startTime, dto.endTime), isRoot: 0 };
            if (where.length > 0) {
                // 如果已有其他查询条件，需要与日期条件组合
                where.forEach((conditions) => {
                    if (Array.isArray(conditions)) {
                        conditions.forEach((condition) => {
                            Object.assign(condition, dateCondition);
                        });
                    } else {
                        Object.assign(conditions, dateCondition);
                    }
                });
            } else {
                where.push(dateCondition);
            }
        }

        // 如果没有任何查询条件，添加默认的排除超级管理员条件
        if (!isEnabled(user.isRoot)) {
            where.push({ isRoot: 0 });
        }

        const result = await this.paginate(dto, {
            where: where.length > 0 ? where : undefined,
            relations: ["role"],
            order: { createdAt: "DESC" },
            excludeFields: ["password", "openid"],
        });

        return result;
    }

    /**
     * 创建用户
     *
     * @param createUserDto 创建用户DTO
     * @returns 创建的用户
     */
    async createUser(createUserDto: CreateUserDto): Promise<Partial<User>> {
        // 检查用户名是否已存在
        const existUser = await this.userRepository.findOne({
            where: { username: createUserDto.username },
        });

        if (existUser) {
            throw HttpExceptionFactory.business(
                `用户名 ${createUserDto.username} 已存在`,
                BusinessCode.DATA_ALREADY_EXISTS,
            );
        }

        // 密码加密
        const hashedPassword = await this.hashPassword(createUserDto.password);

        // 生成随机昵称
        let nickname = createUserDto.nickname;
        if (!nickname) {
            // 从昵称列表中随机选择一个
            const randomNickname = nicknameData[Math.floor(Math.random() * nicknameData.length)];
            // 生成4位随机字符（数字和字母）
            const randomChars = Math.random().toString(36).substring(2, 6);
            // 组合成最终的昵称
            nickname = `${randomNickname}_${randomChars}`;
        }

        // 创建用户实例
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            nickname,
            source: UserCreateSource.CONSOLE,
            userNo: await generateNo(this.userRepository, "userNo"),
            avatar: createUserDto.avatar
                ? createUserDto.avatar
                : `/static/avatars/${Math.floor(Math.random() * 36) + 1}.png`,
        });

        // 如果有角色ID，添加角色关联
        if (createUserDto.roleId) {
            const role = await this.roleRepository.findOne({
                where: {
                    id: createUserDto.roleId,
                },
            });

            if (!role) {
                throw HttpExceptionFactory.notFound("角色不存在");
            }

            user.role = role;
        }

        // 保存用户
        const result = await this.userRepository.save(user);

        // 查询完整的用户信息，包含角色
        const userWithRole = await this.findOneById(result.id, {
            relations: ["role"],
            excludeFields: ["password", "openid"],
        });

        return userWithRole;
    }

    /**
     * 修改用户密码
     *
     * @param id 用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @returns 是否成功
     */
    async changePassword(
        id: string,
        oldPassword: string,
        newPassword: string,
    ): Promise<Partial<User>> {
        // 检查用户是否存在
        const user = await this.findOneById(id);

        // 验证旧密码
        const isPasswordValid = await this.comparePassword(oldPassword, user.password);

        if (!isPasswordValid) {
            throw HttpExceptionFactory.business("旧密码不正确", BusinessCode.PARAM_INVALID);
        }

        // 加密新密码
        const hashedPassword = await this.hashPassword(newPassword);

        return this.updateById(
            id,
            { password: hashedPassword },
            { excludeFields: ["password", "openid"] },
        );
    }

    /**
     * 重置用户密码
     *
     * @param id 用户ID
     * @param newPassword 新密码
     * @returns 是否成功
     */
    async resetPassword(id: string, newPassword: string): Promise<Partial<User>> {
        // 检查用户是否存在
        const user = await this.findOneById(id);

        if (!user) {
            throw HttpExceptionFactory.notFound(`ID为 ${id} 的用户不存在`);
        }

        // 加密新密码
        const hashedPassword = await this.hashPassword(newPassword);

        return this.updateById(
            id,
            { password: hashedPassword },
            { excludeFields: ["password", "openid"] },
        );
    }

    /**
     * 启用/禁用用户
     *
     * @param id 用户ID
     * @param status 状态（0: 禁用, 1: 启用）
     * @returns 更新后的用户
     */
    async setUserStatus(id: string, status: BooleanNumberType): Promise<Partial<User>> {
        // 检查用户是否存在
        const user = await this.findOneById(id);

        if (!user) {
            throw HttpExceptionFactory.notFound(`ID为 ${id} 的用户不存在`);
        }

        return this.updateById(id, { status }, { excludeFields: ["password"] });
    }

    /**
     * 密码加密
     *
     * @param password 明文密码
     * @returns 加密后的密码
     */
    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * 密码比较
     *
     * @param password 明文密码
     * @param hashedPassword 加密后的密码
     * @returns 是否匹配
     */
    private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    /**
     * 更新用户
     *
     * @param id 用户ID
     * @param updateData 更新数据
     * @param options 查询选项
     * @returns 更新后的用户
     */
    async updateById(
        id: string,
        updateData: UpdateUserDto | DeepPartial<User>,
        options?: { excludeFields?: string[] },
    ): Promise<Partial<User>> {
        // 检查用户是否存在
        const user = await this.findOneById(id);
        if (!user) {
            throw HttpExceptionFactory.notFound(`ID为 ${id} 的用户不存在`);
        }

        // 处理角色关联
        let role = null;

        // 如果传入了 roleId 字段且有值，查找对应角色
        if ("roleId" in updateData && updateData.roleId && updateData.roleId.trim() !== "") {
            role = await this.roleRepository.findOne({
                where: { id: updateData.roleId },
            });
            if (!role) {
                throw HttpExceptionFactory.notFound("角色不存在");
            }
        }

        // 移除 roleId，因为我们要单独处理角色关联
        const { roleId, ...restUpdateData } = updateData as UpdateUserDto;

        // 更新用户基本数据（使用 save 方法触发生命周期钩子）
        Object.assign(user, restUpdateData);
        await this.userRepository.save(user);

        // 更新角色关联（总是执行）
        await this.userRepository
            .createQueryBuilder()
            .relation(User, "role")
            .of(id)
            .set(role ? role.id : null);

        // 查询更新后的完整用户信息
        const result = await this.findOneById(id, {
            relations: ["role"],
            excludeFields: options?.excludeFields || ["password", "openid"],
        });

        return result;
    }

    /**
     * 更新用户余额
     * @param userId 用户ID
     * @param dto 更新数据
     * @returns 更新后的用户
     */
    async updateBalance(userId: string, dto: UpdateUserBalanceDto, currentUser: UserPlayground) {
        try {
            const user = await this.findOneById(userId);

            if (!user) {
                throw HttpExceptionFactory.notFound(`ID为 ${userId} 的用户不存在`);
            }

            // 计算变动后的余额
            let newBalance: number;
            let actualChangeAmount: number;

            if (dto.action === ACTION.INC) {
                // 增加余额
                newBalance = user.power + dto.amount;
                actualChangeAmount = dto.amount;
            } else {
                // 减少余额，确保不会低于0
                newBalance = Math.max(0, user.power - dto.amount);
                actualChangeAmount = user.power - newBalance; // 实际减少的金额
            }

            await this.userRepository.manager.transaction(async (entityManager) => {
                // 先更新用户余额
                await entityManager.update(User, { id: userId }, { power: newBalance });

                // 再记录账户变动，此时查询到的就是最新余额
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    userId,
                    dto.action === ACTION.INC
                        ? ACCOUNT_LOG_TYPE.SYSTEM_MANUAL_INC
                        : ACCOUNT_LOG_TYPE.SYSTEM_MANUAL_DEC,
                    dto.action,
                    actualChangeAmount,
                    "", // 关联单号
                    currentUser.id, // 关联用户ID
                    "系统调整用户算力",
                    {
                        type: ACCOUNT_LOG_SOURCE.SYSTEM,
                        source: "系统操作",
                    },
                );
            });

            // 返回更新后的用户信息
            return this.findOneById(userId, { excludeFields: ["password", "openid"] });
        } catch (error) {
            throw HttpExceptionFactory.badRequest(error.message);
        }
    }

    /**
     * 批量更新用户
     *
     * @param dto 批量更新用户DTO
     * @param currentUserId 当前操作用户ID
     * @returns 更新结果
     */
    async batchUpdate(
        dto: BatchUpdateUserDto,
        currentUserId: string,
    ): Promise<{
        success: boolean;
        total: number;
        succeeded: number;
        failed: number;
        errors: Array<{ id: string; message: string }>;
    }> {
        const { users, skipErrors = false } = dto;
        const result = {
            success: true,
            total: users.length,
            succeeded: 0,
            failed: 0,
            errors: [] as Array<{ id: string; message: string }>,
        };

        // 查询所有要更新的用户
        const userIds = users.map((user) => user.id);
        const existingUsers = await this.findAll({
            where: {
                id: In(userIds),
            },
        });

        // 创建ID到用户的映射，方便后续查找
        const userMap = new Map<string, User>();
        existingUsers.forEach((user) => userMap.set(user.id, user));

        // 查询当前操作用户
        const currentUser = await this.findOneById(currentUserId);
        const isCurrentUserRoot = isEnabled(currentUser?.isRoot);

        // 逐个处理用户更新
        for (const userItem of users) {
            try {
                const existingUser = userMap.get(userItem.id);

                // 检查用户是否存在
                if (!existingUser) {
                    throw new Error(`ID为 ${userItem.id} 的用户不存在`);
                }

                // 检查权限：如果要修改的是超级管理员
                if (isEnabled(existingUser.isRoot)) {
                    // 只有超级管理员本人可以修改自己的信息
                    if (currentUserId !== userItem.id) {
                        throw new Error(`无权修改超级管理员(${userItem.id})的信息`);
                    }
                }

                // 检查是否有算力变动
                if (userItem.power !== undefined) {
                    const user = await this.findOneById(userItem.id);
                    if (user) {
                        // 计算变动值
                        const powerDiff = userItem.power - user.power;

                        if (powerDiff !== 0) {
                            // 确定是增加还是减少
                            const action = powerDiff > 0 ? ACTION.INC : ACTION.DEC;
                            const amount = Math.abs(powerDiff);

                            await this.userRepository.manager.transaction(async (entityManager) => {
                                // 更新用户算力
                                await entityManager.update(
                                    User,
                                    { id: userItem.id },
                                    { power: userItem.power },
                                );

                                // 记录账户变动
                                await this.accountLogService.recordWithTransaction(
                                    entityManager,
                                    userItem.id,
                                    action === ACTION.INC
                                        ? ACCOUNT_LOG_TYPE.SYSTEM_MANUAL_INC
                                        : ACCOUNT_LOG_TYPE.SYSTEM_MANUAL_DEC,
                                    action,
                                    amount,
                                    "", // 关联单号
                                    currentUserId, // 关联用户ID
                                    `批量更新操作，算力变动：${powerDiff > 0 ? "+" : ""}${powerDiff}`,
                                    {
                                        type: ACCOUNT_LOG_SOURCE.SYSTEM,
                                        source: "批量更新",
                                    },
                                );
                            });

                            // 从更新对象中移除power字段，因为已单独处理
                            delete userItem.power;
                        }
                    }
                }

                // 执行其他字段的更新
                if (Object.keys(userItem).length > 1) {
                    // 至少有id和其他字段
                    await this.updateById(userItem.id, userItem, {
                        excludeFields: ["password"],
                    });
                }

                // 更新成功后清理该用户的权限相关缓存（忽略清理失败，不影响主流程）
                this.rolePermissionService
                    .clearUserCache(userItem.id)
                    .catch((e) => this.logger?.warn?.(`清理用户缓存失败: ${e.message}`));

                result.succeeded++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    id: userItem.id,
                    message: error.message,
                });

                // 如果不跳过错误，则立即返回
                if (!skipErrors) {
                    result.success = false;
                    return result;
                }
            }
        }

        // 如果有失败的更新，设置整体结果为失败
        if (result.failed > 0) {
            result.success = false;
        }

        return result;
    }
}
