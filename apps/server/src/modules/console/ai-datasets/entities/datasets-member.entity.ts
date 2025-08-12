import { AppEntity } from "@common/decorators";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { TEAM_ROLE, type TeamRoleType } from "../constants/team-role.constants";
import { Datasets } from "../entities/datasets.entity";

/**
 * 知识库团队成员实体
 */
@AppEntity({ name: "dataset_members", comment: "知识库团队成员管理" })
@Index(["datasetId", "userId"], { unique: true }) // 确保用户在同一知识库中只能有一个角色
export class DatasetMember {
    /**
     * 成员记录主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 知识库ID
     */
    @Column({ type: "uuid", comment: "知识库ID" })
    datasetId: string;

    /**
     * 用户ID
     */
    @Column({ type: "uuid", comment: "用户ID" })
    userId: string;

    /**
     * 团队角色
     */
    @Column({
        type: "enum",
        enum: Object.values(TEAM_ROLE),
        comment: "团队角色：owner-所有者, manager-管理者, editor-编辑者, viewer-查看者",
    })
    role: TeamRoleType;

    /**
     * 加入时间
     */
    @CreateDateColumn({ comment: "加入时间" })
    joinedAt: Date;

    /**
     * 邀请者ID
     */
    @Column({ type: "uuid", nullable: true, comment: "邀请者ID" })
    invitedBy?: string;

    /**
     * 最后活跃时间
     */
    @Column({ type: "timestamp", nullable: true, comment: "最后活跃时间" })
    lastActiveAt?: Date;

    /**
     * 是否启用
     */
    @Column({ type: "boolean", default: true, comment: "是否启用" })
    isActive: boolean;

    /**
     * 备注信息
     */
    @Column({ type: "text", nullable: true, comment: "备注信息" })
    note?: string;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ comment: "更新时间" })
    updatedAt: Date;

    // 关联实体

    /**
     * 关联的知识库
     */
    @ManyToOne("Datasets", "members", {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: "dataset_id" })
    dataset?: Awaited<Datasets>;

    /**
     * 关联的用户
     */
    @ManyToOne(() => User, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: "user_id" })
    user?: User;

    /**
     * 邀请者用户
     */
    @ManyToOne(() => User, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: "invited_by" })
    inviter?: User;
}
