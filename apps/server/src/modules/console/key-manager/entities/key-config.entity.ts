import { BooleanNumber, BooleanNumberType } from "@common/constants";
import { AppEntity } from "@common/decorators/app-entity.decorator";
import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { KeyTemplate } from "./key-template.entity";

/**
 * 密钥字段值接口
 */
export interface KeyFieldValue {
    /** 字段名称 */
    name: string;
    /** 字段值 */
    value?: string;
    /** 是否加密存储 */
    encrypted?: boolean;
}

/**
 * 密钥配置实体
 */
@AppEntity("key_configs")
export class KeyConfig {
    /**
     * 主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 密钥名称
     */
    @Column({ length: 100, comment: "密钥配置名称" })
    name: string;

    /**
     * 所属模板ID
     */
    @Column({ comment: "所属密钥模板ID" })
    templateId: string;

    /**
     * 密钥字段配置
     */
    @Column({
        type: "json",
        comment: "密钥字段配置，JSON格式存储具体的字段值",
    })
    fieldValues: KeyFieldValue[];

    /**
     * 备注信息
     */
    @Column({ type: "text", nullable: true, comment: "备注信息" })
    remark?: string;

    /**
     * 配置状态
     */
    @Column({
        type: "integer",
        default: BooleanNumber.YES,
        comment: "配置状态：1-激活，0-停用",
    })
    status: BooleanNumberType;

    /**
     * 最后使用时间
     */
    @Column({ nullable: true, comment: "最后使用时间" })
    lastUsedAt?: Date;

    /**
     * 使用次数
     */
    @Column({ default: 0, comment: "使用次数统计" })
    usageCount: number;

    /**
     * 排序权重
     */
    @Column({ default: 0, comment: "排序权重，数值越大越靠前" })
    sortOrder: number;

    /**
     * 创建时间
     */
    @CreateDateColumn({ comment: "创建时间" })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ comment: "更新时间" })
    updatedAt: Date;

    /**
     * 关联的密钥模板
     */
    @ManyToOne(() => KeyTemplate, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "template_id" })
    template: Relation<KeyTemplate>;
}
