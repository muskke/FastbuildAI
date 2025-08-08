import { AppEntity } from "@common/decorators/app-entity.decorator";
import { Permission } from "@common/modules/auth/entities/permission.entity";
import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * 菜单类型枚举
 */
export enum MenuType {
    /**
     * 目录
     */
    DIRECTORY = 1,

    /**
     * 菜单
     */
    MENU = 2,

    /**
     * 按钮
     */
    BUTTON = 3,
}

/**
 * 菜单来源类型枚举
 */
export enum MenuSourceType {
    /**
     * 系统菜单
     */
    SYSTEM = 1,

    /**
     * 插件菜单
     */
    PLUGIN = 2,
}

/**
 * 菜单实体
 */
@AppEntity({ name: "menus", comment: "菜单管理" })
export class Menu {
    /**
     * 用户ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 菜单名称
     */
    @Column({ length: 50 })
    name: string;

    /**
     * 唯一标识
     */
    @Column({ length: 50, unique: true, nullable: true })
    code: string;

    /**
     * 菜单路径
     */
    @Column({ length: 100, nullable: true })
    path: string;

    /**
     * 菜单图标
     */
    @Column({ length: 50, nullable: true })
    icon: string;

    /**
     * 组件路径
     */
    @Column({ length: 100, nullable: true })
    component: string;

    /**
     * 权限ID
     */
    @Column({ name: "permissionCode", nullable: true })
    permissionCode: string;

    /**
     * 父级菜单ID
     */
    @Column({ name: "parentId", nullable: true })
    parentId: string;

    /**
     * 排序
     */
    @Column({ default: 0 })
    sort: number;

    /**
     * 是否隐藏
     * 0: 显示
     * 1: 隐藏
     */
    @Column({ name: "isHidden", default: 0 })
    isHidden: number;

    /**
     * 菜单类型
     * 1: 目录
     * 2: 菜单
     * 3: 按钮
     */
    @Column({ default: MenuType.MENU })
    type: MenuType;

    /**
     * 菜单来源类型
     * 1: 系统菜单
     * 2: 插件菜单
     */
    @Column({ name: "sourceType", default: MenuSourceType.SYSTEM })
    sourceType: MenuSourceType;

    /**
     * 插件标识
     * 当 sourceType 为 PLUGIN 时，此字段必填
     */
    @Column({ name: "pluginPackName", nullable: true, length: 50 })
    pluginPackName: string;

    /**
     * 父级菜单
     */
    @ManyToOne(() => Menu, (menu) => menu.children, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "parentId" })
    parent: Menu;

    /**
     * 子菜单
     */
    @OneToMany(() => Menu, (menu) => menu.parent)
    children: Menu[];

    /**
     * 权限
     */
    @ManyToOne(() => Permission, { nullable: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinColumn({ name: "permissionCode", referencedColumnName: "code" })
    permission: Permission;

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
}
