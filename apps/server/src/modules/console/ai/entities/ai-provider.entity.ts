import { FileService } from "@common/base/services/file.service";
import { AppEntity } from "@common/decorators/app-entity.decorator";
import { getGlobalContainer } from "@common/utils/global-container.util";
import { ModelType } from "@sdk/ai";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AiModel } from "./ai-model.entity";

/**
 * AI供应商配置实体
 *
 * 管理AI供应商的认证信息和基础配置
 * 一个供应商可以有多个模型
 */
@AppEntity({ name: "ai_providers", comment: "AI供应商配置" })
@Index(["provider"], { unique: true })
export class AiProvider {
    /**
     * 主键ID，自动生成UUID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 供应商标识
     * 例如：openai, deepseek, doubao, qwen, anthropic
     */
    @Column({
        type: "varchar",
        length: 50,
        unique: true,
        comment: "供应商唯一标识",
    })
    provider: string;

    /**
     * 供应商显示名称
     * 例如：OpenAI, DeepSeek, 字节豆包, 阿里通义千问
     */
    @Column({
        type: "varchar",
        length: 100,
        comment: "供应商显示名称",
    })
    name: string;

    /**
     * 供应商描述
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "供应商描述",
    })
    description?: string;

    /**
     * API密钥
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "供应商API密钥",
    })
    apiKey?: string;

    /**
     * 绑定的密钥配置
     */
    @Column({
        type: "varchar",
        length: 500,
        nullable: true,
        comment: "绑定的密钥配置",
    })
    bindKeyConfig?: string;

    /**
     * API基础URL
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "API代理URL地址",
    })
    baseUrl?: string;

    /**
     * 供应商图标URL
     */
    @Column({
        type: "varchar",
        length: 500,
        nullable: true,
        comment: "供应商图标URL",
    })
    iconUrl?: string;

    /**
     * 供应商官网URL
     */
    @Column({
        type: "varchar",
        length: 500,
        nullable: true,
        comment: "供应商官网URL",
    })
    websiteUrl?: string;

    /**
     * 支持的模型分类
     */
    @Column({
        type: "text",
        array: true,
        default: () => "'{}'",
        comment: "支持的模型分类",
    })
    supportedModelTypes: ModelType[];

    /**
     * 是否启用该供应商
     */
    @Column({
        type: "boolean",
        default: true,
        comment: "是否启用该供应商",
    })
    isActive: boolean;

    /**
     * 是否系统内置
     */
    @Column({
        type: "boolean",
        default: false,
        comment: "是否系统内置",
    })
    isBuiltIn: boolean;

    /**
     * 排序权重
     */
    @Column({
        type: "integer",
        default: 0,
        comment: "排序权重，数字越小越靠前",
    })
    sortOrder: number;

    /**
     * 创建时间
     */
    @CreateDateColumn({
        type: "timestamp with time zone",
        comment: "创建时间",
    })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({
        type: "timestamp with time zone",
        comment: "更新时间",
    })
    updatedAt: Date;

    /**
     * 关联的模型列表
     */
    @OneToMany(() => AiModel, (model) => model.provider)
    models: Awaited<AiModel[]>;

    @BeforeInsert()
    @BeforeUpdate()
    private async setIconUrl() {
        if (this.iconUrl) {
            try {
                const fileService = getGlobalContainer().get(FileService);
                this.iconUrl = await fileService.set(this.iconUrl);
            } catch (error) {
                console.warn("获取FileService失败:", error);
            }
        }
    }
}
