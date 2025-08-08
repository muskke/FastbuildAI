import nicknameData from "@assets/nickname.json";
import { BaseService } from "@common/base/services/base.service";
import { BooleanNumberType, UserCreateSource } from "@common/constants";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Role } from "@common/modules/auth/entities/role.entity";
import { User } from "@common/modules/auth/entities/user.entity";
import { generateNo } from "@common/utils/helper.util";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Between, DeepPartial, Like, Repository } from "typeorm";

import { CreateUserDto } from "../dto/create-user.dto";
import { QueryUserDto } from "../dto/query-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

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
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {
        super(userRepository);
    }

    /**
     * 分页查询用户列表
     *
     * @param dto 查询条件
     * @returns 用户列表和分页信息
     */
    async list(dto: QueryUserDto): Promise<any> {
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
        if (where.length === 0) {
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
}
