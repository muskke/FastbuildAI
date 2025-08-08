import { AppEntity } from "@common/decorators/app-entity.decorator";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@AppEntity({ name: "decorate_page", comment: "布局配置" })
export class DecoratePageEntity {
    /**
     * 页面id
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 页面名称/类型标识
     */
    @Column({ type: "varchar" })
    name: string;

    /**
     * 布局数据
     */
    @Column({ type: "jsonb", nullable: true })
    data: any;

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
