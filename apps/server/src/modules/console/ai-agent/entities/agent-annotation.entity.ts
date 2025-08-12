import { AppEntity } from "@common/decorators/app-entity.decorator";
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

/**
 * 智能体标注审核状态枚举
 */
export enum AnnotationReviewStatus {
    /** 待审核 - 匿名用户提交的标注默认状态 */
    PENDING = "pending",
    /** 已通过 - 注册用户提交的标注默认状态，或管理员审核通过 */
    APPROVED = "approved",
    /** 已拒绝 - 管理员审核拒绝 */
    REJECTED = "rejected",
}

/**
 * 智能体标注实体
 * 用于存储预设的问答对，优先匹配用户问题
 */
@AppEntity({ name: "agent_annotation", comment: "智能体标注管理" })
export class AgentAnnotation {
    /**
     * 标注主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 关联的智能体ID
     */
    @Column({ type: "uuid", comment: "智能体ID" })
    @Index()
    agentId: string;

    /**
     * 提问内容
     */
    @Column({ type: "text", comment: "提问内容" })
    question: string;

    /**
     * 答案内容
     */
    @Column({ type: "text", comment: "答案内容" })
    answer: string;

    /**
     * 命中次数
     */
    @Column({ type: "int", default: 0, comment: "命中次数" })
    hitCount: number;

    /**
     * 是否启用
     */
    @Column({ type: "boolean", default: true, comment: "是否启用" })
    enabled: boolean;

    /**
     * 审核状态
     */
    @Column({
        type: "enum",
        enum: AnnotationReviewStatus,
        default: AnnotationReviewStatus.APPROVED,
        comment: "审核状态：pending-待审核，approved-已通过，rejected-已拒绝",
    })
    @Index()
    reviewStatus: AnnotationReviewStatus;

    /**
     * 审核人ID
     */
    @Column({
        type: "uuid",
        nullable: true,
        comment: "审核人ID",
    })
    reviewedBy?: string;

    /**
     * 审核时间
     */
    @Column({
        type: "timestamp",
        nullable: true,
        comment: "审核时间",
    })
    reviewedAt?: Date;

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
     * 创建者ID (注册用户时使用)
     */
    @Column({ type: "uuid", comment: "创建者ID，匿名用户时为空", nullable: true })
    createdBy?: string;

    /**
     * 匿名用户标识 (匿名用户时使用)
     */
    @Column({
        type: "varchar",
        length: 128,
        comment: "匿名用户标识，如设备ID或访问令牌的hash",
        nullable: true,
    })
    @Index()
    anonymousIdentifier?: string;
    /**
     * 创建者用户信息
     */
    @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
    @JoinColumn({ name: "created_by" })
    user?: User;

    /**
     * 审核人用户信息
     */
    @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "reviewed_by" })
    reviewer?: User;
}
