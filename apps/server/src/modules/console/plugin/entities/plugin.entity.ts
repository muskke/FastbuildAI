import { FileService } from "@common/base/services/file.service";
import { AppEntity } from "@common/decorators/app-entity.decorator";
import { getGlobalContainer } from "@common/utils/global-container.util";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * 插件实体
 *
 * 用于存储插件的基本信息
 */
@AppEntity({ name: "plugin", comment: "插件管理" })
export class PlugEntity {
    /**
     * ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 插件名称
     */
    @Column({ length: 50 })
    name: string;

    /**
     * 插件唯一标识符
     */
    @Column({ length: 50 })
    packName: string;

    /**
     * 是否为开发版插件
     */
    @Column({ default: false })
    isDeveloper: boolean;

    /**
     * 插件描述
     */
    @Column({ length: 500, nullable: true })
    description: string;

    /**
     * 插件图标
     */
    @Column({ length: 255, nullable: true })
    icon: string;

    /**
     * 插件版本
     */
    @Column({ length: 20 })
    version: string;

    /**
     * 插件状态
     *
     * true: 已启用
     * false: 未启用
     */
    @Column({ default: false })
    isEnabled: boolean;

    /**
     * 错误信息
     */
    @Column({ length: 500, nullable: true })
    error: string;

    /**
     * 插件状态
     *
     * true: 已安装
     * false: 未安装
     */
    @Column({ default: false })
    isInstalled: boolean;

    /**
     * 插件包下载状态
     *
     * true: 已下载
     * false: 未下载
     */
    @Column({ default: false })
    isDownloaded: boolean;

    /**
     * 是否需要重启
     *
     * 当插件安装、更新、卸载等操作后，需要重启系统才能生效
     */
    @Column({ default: false })
    needRestart: boolean;

    /**
     * 重启原因
     *
     * 记录需要重启的原因，如：安装、更新、卸载等
     */
    @Column({ length: 100, nullable: true })
    restartReason: string;

    /**
     * 最后一次操作时间
     *
     * 记录最后一次需要重启的操作时间
     */
    @Column({ type: "timestamp", nullable: true })
    lastOperationAt: Date;

    /**
     * 插件安装时间
     */
    @Column({ type: "timestamp", nullable: true, default: () => "CURRENT_TIMESTAMP" })
    installedAt: Date;

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
    private async setIcon() {
        if (this.icon) {
            try {
                const fileService = getGlobalContainer().get(FileService);
                this.icon = await fileService.set(this.icon);
            } catch (error) {
                console.warn("获取FileService失败:", error);
            }
        }
    }
}
