import { AppEntity } from "@common/decorators/app-entity.decorator";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { TERMINAL_TYPES, type TerminalType } from "../constants/terminal.constants";

@AppEntity({ name: "decorate_micropage", comment: "装修微页面配置" })
export class DecorateMicropageEntity {
    /**
     * 页面id
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 页面名称
     */
    @Column({ type: "varchar" })
    name: string;

    /**
     * 终端类型 web/mobile
     */
    @Column({
        type: "varchar",
        length: 10,
        default: TERMINAL_TYPES.WEB,
        comment: "终端类型：web(网页端) 或 mobile(移动端)",
    })
    terminal: TerminalType;

    /**
     * 内容
     */
    @Column({ type: "jsonb", nullable: true }) // 存储 JSON 数据，允许为空
    content: any[];

    /**
     * 页面配置
     */
    @Column({ type: "jsonb", nullable: true }) // 存储 JSON 数据，允许为空
    configs: any;

    /**
     * 创建时间
     */
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ type: "timestamp with time zone", select: false })
    updatedAt: Date;

    /**
     * 删除/注销时间
     *
     * 软删除
     */
    @DeleteDateColumn({ type: "timestamp with time zone", select: false })
    deletedAt: Date;
}
