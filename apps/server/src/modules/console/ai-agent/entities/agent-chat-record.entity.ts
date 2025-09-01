import { AppEntity } from "@common/decorators/app-entity.decorator";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Agent } from "./agent.entity";

/**
 * 智能体对话记录实体
 * 记录用户与智能体的对话会话信息
 */
@AppEntity({ name: "agent_chat_record", comment: "智能体对话记录" })
@Index(["userId", "createdAt"])
@Index(["isDeleted", "createdAt"])
@Index(["agentId", "createdAt"])
export class AgentChatRecord {
    /**
     * 主键ID (UUID)
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 对话标题
     */
    @Column({
        type: "varchar",
        length: 200,
        comment: "对话标题",
        nullable: true,
    })
    title: string;

    /**
     * 用户ID (注册用户时使用)
     */
    @Column({
        type: "uuid",
        comment: "用户ID，匿名用户时为空",
        nullable: true,
    })
    @Index()
    userId?: string;

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
     * 智能体ID
     */
    @Column({
        type: "uuid",
        comment: "关联的智能体ID",
    })
    @Index()
    agentId: string;

    /**
     * 对话摘要
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "对话摘要",
    })
    summary?: string;

    /**
     * 消息总数
     */
    @Column({
        type: "int",
        default: 0,
        comment: "对话中的消息总数",
    })
    messageCount: number;

    /**
     * 总Token消耗
     */
    @Column({
        type: "int",
        default: 0,
        comment: "本次对话消耗的总Token数",
    })
    totalTokens: number;

    /**
     * 累计消耗算力
     */
    @Column({
        type: "int",
        default: 0,
        comment: "本次对话累计消耗的算力",
    })
    consumedPower: number;

    /**
     * 对话配置
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "对话相关配置，如温度、最大令牌数等",
    })
    config?: Record<string, any>;

    /**
     * 是否删除（软删除）
     */
    @Column({
        type: "boolean",
        default: false,
        comment: "是否已删除",
    })
    @Index()
    isDeleted: boolean;

    /**
     * 扩展数据
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "扩展数据字段",
    })
    metadata?: Record<string, any>;

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
     * 关联的用户 (注册用户时使用)
     */
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn({ name: "user_id" })
    user?: User;

    /**
     * 关联的智能体
     */
    @ManyToOne(() => Agent, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "agent_id" })
    agent: Agent;

    /**
     * 对话中的消息列表
     */
    @OneToMany("AgentChatMessage", "conversation", {
        cascade: true,
    })
    messages?: import("./agent-chat-message.entity").AgentChatMessage[];
}
