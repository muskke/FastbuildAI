import { getTablePrefix } from "@common/utils/table-name.util";
import {
    Column,
    CreateDateColumn,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AppEntity } from "../../../decorators/app-entity.decorator";
import { Permission } from "./permission.entity";

/**
 * 角色实体
 *
 * 定义系统中的角色及其关联的权限
 */
@AppEntity({ name: "roles", comment: "角色管理" })
export class Role {
    /**
     * 角色ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 角色名称
     *
     * 例如: "admin", "editor", "user"
     */
    @Column({ unique: true })
    name: string;

    /**
     * 角色描述
     */
    @Column({ nullable: true })
    description: string;

    /**
     * 角色关联的权限
     *
     * 多对多关系，一个角色可以有多个权限，一个权限可以属于多个角色
     */
    @ManyToMany(() => Permission)
    @JoinTable({
        name: getTablePrefix("role_permissions"),
        joinColumn: { name: "role_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
    })
    permissions: Permission[];

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
     * 是否禁用
     *
     * 禁用的角色将不能被分配给用户，已分配该角色的用户将无法使用该角色的权限
     */
    @Column({ default: false })
    isDisabled: boolean;
}
