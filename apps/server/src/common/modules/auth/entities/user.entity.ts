import { FileService } from "@common/base/services/file.service";
import {
    BooleanNumber,
    BooleanNumberType,
    UserCreateSource,
    UserCreateSourceType,
} from "@common/constants/status-codes.constant";
import { AppEntity } from "@common/decorators/app-entity.decorator";
import { getGlobalContainer } from "@common/utils/global-container.util";
import { getTablePrefix } from "@common/utils/table-name.util";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

/**
 * 用户实体
 *
 * 定义系统中的用户用户及其关联的角色和直接权限
 */
@AppEntity({ name: "user", comment: "用户信息" })
export class User {
    /**
     * 用户ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;
    /**
     * 用户openid
     */
    @Column({ nullable: true })
    openid: string;

    @Column({ nullable: true })
    userNo: string;
    /**
     * 用户名
     */
    @Column({ unique: true })
    username: string;

    /**
     * 密码
     *
     * 加密后的密码哈希
     */
    @Column()
    password: string;

    /**
     * 用户昵称
     */
    @Column({ nullable: true })
    nickname: string;

    /**
     * 用户邮箱
     */
    @Column({ nullable: true })
    email: string;

    /**
     * 用户手机号
     */
    @Column({ nullable: true })
    phone: string;

    /**
     * 手机号区号
     *
     * 国际区号，如：86, 1, 81, 44等
     */
    @Column({ nullable: true })
    phoneAreaCode: string;

    /**
     * 用户头像
     */
    @Column({ nullable: true })
    avatar: string;

    /**
     * 真实姓名
     */
    @Column({ nullable: true, length: 32, comment: "真实姓名" })
    realName: string;

    /**
     * 累计消费金额
     */
    @Column({
        type: "integer",
        default: 0,
        comment: "累计充值消费金额",
    })
    totalRechargeAmount: number;

    /**
     * 用户状态
     *
     * 0: 禁用, 1: 启用
     */
    @Column({ default: 1 })
    status: number;

    /**
     * 是否为超级管理员
     *
     * 0: 否, 1: 是
     */
    @Column({
        type: "enum",
        enum: BooleanNumber,
        default: BooleanNumber.NO,
        enumName: "boolean_number_enum",
    })
    isRoot: BooleanNumberType;

    /**
     * 用户关联的角色
     *
     * 多对一关系，一个用户只能有一个角色，一个角色可以属于多个用户
     */
    @ManyToOne(() => Role, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "role_id" })
    role: Role;

    /**
     * 用户直接关联的权限
     *
     * 多对多关系，一个用户可以直接拥有多个权限，一个权限可以直接属于多个用户
     * 这些权限是直接分配给用户的，与角色无关
     */
    @ManyToMany(() => Permission)
    @JoinTable({
        name: getTablePrefix("user_permissions"),
        joinColumn: { name: "user_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
    })
    permissions: Permission[];

    /**
     * 最后一次登录时间
     */
    @Column({ type: "timestamp with time zone", nullable: true })
    lastLoginAt: Date | null;

    @Column({ default: 0, comment: "算力" })
    power: number;
    /**
     * 注册来源
     */
    @Column({
        type: "enum",
        enum: UserCreateSource,
        enumName: "user_create_source_enum",
    })
    source: UserCreateSourceType;

    /**
     * 创建时间
     */
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt: Date;

    /**
     * 删除/注销时间
     *
     * 软删除
     */
    @DeleteDateColumn({ type: "timestamp with time zone" })
    deletedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    private async setAvatar() {
        if (this.avatar) {
            try {
                const fileService = getGlobalContainer().get(FileService);
                this.avatar = await fileService.set(this.avatar);
            } catch (error) {
                console.warn("获取FileService失败:", error);
            }
        }
    }
}
