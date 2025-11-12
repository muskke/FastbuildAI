import { ExtensionSupportTerminal } from "@buildingai/constants";
import {
    ExtensionStatus,
    type ExtensionStatusType,
    type ExtensionSupportTerminalType,
    ExtensionType,
    type ExtensionTypeType,
} from "@buildingai/constants/shared/extension.constant";
import { NestContainer } from "@buildingai/di";

import { AppEntity } from "../decorators/app-entity.decorator";
import { BeforeInsert, BeforeUpdate, Column } from "../typeorm";
import { FileUrlService } from "./../utils/file-url.service";
import { BaseEntity } from "./base";

/**
 * 插件实体
 *
 * 管理系统中的各种插件，包括工具插件、服务插件、模型插件等
 */
@AppEntity({ name: "extension", comment: "插件管理" })
export class Extension extends BaseEntity {
    /**
     * 插件名称
     */
    @Column({ length: 100, comment: "插件名称" })
    name: string;

    /**
     * 插件标识符
     */
    @Column({ length: 100, unique: true, comment: "插件标识符" })
    identifier: string;

    /**
     * 插件版本
     */
    @Column({ length: 20, default: "1.0.0", comment: "插件版本" })
    version: string;

    /**
     * 插件描述
     */
    @Column({ type: "text", nullable: true, comment: "插件描述" })
    description?: string;

    /**
     * 插件图标
     */
    @Column({ type: "text", nullable: true, comment: "插件图标" })
    icon?: string;

    /**
     * 插件类型
     */
    @Column({
        type: "int",
        default: ExtensionType.APPLICATION,
        comment: "插件类型：1-应用插件，2-功能插件",
    })
    type: ExtensionTypeType;

    /**
     * 插件支持的终端类型
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "插件支持的终端类型数组：1-Web端，2-公众号，3-H5，4-小程序，5-API端",
    })
    supportTerminal?: ExtensionSupportTerminalType[];

    /**
     * 是否为开发插件
     */
    @Column({ type: "boolean", default: true, comment: "是否为本地开发插件" })
    isLocal: boolean;

    /**
     * 插件状态
     */
    @Column({
        type: "enum",
        enum: ExtensionStatus,
        default: ExtensionStatus.DISABLED,
        enumName: "plugin_status_enum",
        comment: "插件状态：0-禁用，1-启用",
    })
    status: ExtensionStatusType;

    /**
     * 插件作者
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "插件作者信息，包括头像、名称、主页",
    })
    author?: {
        avatar?: string;
        name?: string;
        homepage?: string;
    };

    /**
     * 插件官网或仓库地址
     */
    @Column({ type: "text", nullable: true, comment: "插件官网或仓库地址" })
    homepage?: string;

    /**
     * 插件文档地址
     */
    @Column({ type: "text", nullable: true, comment: "插件文档地址" })
    documentation?: string;

    /**
     * 插件配置参数
     *
     * JSON格式存储插件的配置信息
     */
    @Column({ type: "jsonb", nullable: true, comment: "插件配置参数" })
    config?: Record<string, any>;

    /**
     * 插件图标处理
     *
     * 在插入和更新前处理图标文件路径
     */
    @BeforeInsert()
    @BeforeUpdate()
    private async setIcon() {
        if (this.icon) {
            try {
                const fileService = NestContainer.get(FileUrlService);
                this.icon = await fileService.set(this.icon);
            } catch (error) {
                console.warn("获取FileService失败:", error);
            }
        }
    }

    /**
     * 设置默认的支持终端类型
     *
     * 在插入前设置默认值
     */
    @BeforeInsert()
    private setDefaultSupportTerminal() {
        if (!this.supportTerminal || this.supportTerminal.length === 0) {
            this.supportTerminal = [ExtensionSupportTerminal.WEB];
        }
    }

    /**
     * 检查是否已启用
     *
     * @returns 是否已启用
     */
    isEnabled(): boolean {
        return this.status === ExtensionStatus.ENABLED;
    }

    /**
     * 检查插件是否可用
     *
     * 插件可用的条件：已启用且审核通过
     *
     * @returns 插件是否可用
     */
    isAvailable(): boolean {
        return this.isEnabled();
    }
}
