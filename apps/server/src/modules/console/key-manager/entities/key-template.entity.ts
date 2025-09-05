import { FileService } from "@common/base/services/file.service";
import { BooleanNumber, BooleanNumberType } from "@common/constants";
import { AppEntity } from "@common/decorators/app-entity.decorator";
import { getGlobalContainer } from "@common/utils/global-container.util";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { KeyConfig } from "./key-config.entity";

/**
 * 密钥模板类型枚举
 */
export enum KeyTemplateType {
    SYSTEM = "system", // 系统模板
    CUSTOM = "custom", // 自定义模板
}

/**
 * 字段类型枚举
 */
export enum FieldType {
    TEXT = "text", // 文本
    TEXTAREA = "textarea", // 文本域
    NUMBER = "number", // 数字
}

/**
 * 模板字段配置接口
 */
export interface TemplateField {
    /** 字段名称 */
    name: string;
    /** 字段类型 */
    type: FieldType;
    /** 是否必填 */
    required: boolean;
    /** 占位符 */
    placeholder?: string;
}

/**
 * 密钥模板实体
 */
@AppEntity("key_templates")
export class KeyTemplate {
    /**
     * 主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 模板名称
     */
    @Column({ length: 100, comment: "模板名称" })
    name: string;

    /**
     * 模板图标
     */
    @Column({ length: 200, nullable: true, comment: "模板图标" })
    icon?: string;

    /**
     * 字段配置
     */
    @Column({
        type: "json",
        comment: "模板字段配置，JSON格式存储字段定义",
    })
    fieldConfig: TemplateField[];

    /**
     * 启用状态
     */
    @Column({ type: "integer", default: BooleanNumber.YES, comment: "是否启用，1-启用，0-禁用" })
    isEnabled: BooleanNumberType;

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
     * 关联的密钥配置
     */
    @OneToMany(() => KeyConfig, (keyConfig) => keyConfig.template)
    keyConfigs: Awaited<KeyConfig[]>;

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
