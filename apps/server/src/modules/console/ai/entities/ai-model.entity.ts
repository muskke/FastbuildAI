import { AppEntity } from "@common/decorators/app-entity.decorator";
import { ModelType } from "@sdk/ai";
import { ModelFeatureType } from "@sdk/ai/interfaces/model-features";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AiProvider } from "./ai-provider.entity";

/**
 * AI模型配置实体
 *
 * 用于存储具体AI模型的配置信息
 * 认证信息由关联的AiProvider提供
 */
@AppEntity({ name: "ai_models", comment: "AI模型配置" })
@Index(["providerId", "model"])
export class AiModel {
    /**
     * 主键ID，自动生成UUID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 模型显示名称
     * 例如：ChatGPT-4, DeepSeek Chat, 豆包等
     */
    @Column({
        type: "varchar",
        length: 100,
        comment: "模型显示名称",
    })
    name: string;

    /**
     * 模型标识符
     * 例如：gpt-4, deepseek-chat, doubao-lite
     */
    @Column({
        type: "varchar",
        length: 100,
        comment: "模型在供应商API中的标识符",
    })
    model: string;

    /**
     * 模型类型
     */
    @Column({
        type: "varchar",
        length: 100,
        comment: "模型类型",
    })
    modelType: ModelType;

    /**
     * 供应商ID
     */
    @Column({
        type: "uuid",
        comment: "关联的供应商ID",
    })
    @Index()
    providerId: string;

    /**
     * 模型特性
     */
    @Column({
        type: "jsonb",
        default: () => "'[]'",
        comment: "模型特性",
    })
    features?: ModelFeatureType[];

    /**
     * 最大上下文条数
     */
    @Column({
        type: "integer",
        nullable: true,
        default: 5,
        comment: "上下文条数",
    })
    maxContext?: number;

    /**
     * 模型特定配置
     * 用于存储模型级别的特定配置参数
     */
    @Column({
        type: "jsonb",
        default: () => "'{}'",
        comment: "模型特定配置信息",
    })
    modelConfig: Record<string, any>;

    /**
     * 是否启用该模型
     */
    @Column({
        type: "boolean",
        default: true,
        comment: "是否启用该模型",
    })
    isActive: boolean;

    /**
     * 模型描述
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "模型描述",
    })
    description?: string;

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
     * 模型定价信息
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "模型定价信息",
    })
    pricing?: {
        input?: number; // 输入token价格（每1K token）
        output?: number; // 输出token价格（每1K token）
        currency?: string; // 货币单位，默认USD
    };

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
     * 关联的供应商
     */
    @ManyToOne(() => AiProvider, (provider) => provider.models, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "provider_id" })
    provider: Awaited<AiProvider>;
}
