import { AppEntity } from "@common/decorators/app-entity.decorator";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { AIRawResponse, MessageMetadata, TokenUsage } from "../interfaces/agent-config.interface";
import { Agent } from "./agent.entity";
import { AgentChatRecord } from "./agent-chat-record.entity";

/**
 * 智能体对话消息实体
 * 记录智能体对话中的每条消息
 */
@AppEntity({ name: "agent_chat_message", comment: "智能体对话消息" })
@Index(["conversationId", "createdAt"])
export class AgentChatMessage {
    /**
     * 主键ID (UUID)
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 对话记录ID
     */
    @Column({
        type: "uuid",
        comment: "对话记录ID",
    })
    @Index()
    conversationId: string;

    /**
     * 智能体ID
     */
    @Column({
        type: "uuid",
        comment: "智能体ID",
    })
    @Index()
    agentId: string;

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
     * 消息角色
     */
    @Column({
        type: "enum",
        enum: ["user", "assistant", "system"],
        comment: "消息角色",
    })
    role: "user" | "assistant" | "system";

    /**
     * 消息内容
     */
    @Column({
        type: "text",
        comment: "消息内容",
    })
    content: string;

    /**
     * 消息类型
     */
    @Column({
        type: "varchar",
        length: 20,
        default: "text",
        comment: "消息类型",
    })
    messageType: string;

    /**
     * Token使用统计
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "Token使用统计",
    })
    tokens?: TokenUsage;

    /**
     * 原始AI响应
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "原始AI响应数据",
    })
    rawResponse?: AIRawResponse;

    /**
     * 表单变量
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "用于角色设定的表单变量",
    })
    formVariables?: Record<string, string>;

    /**
     * 表单字段输入值
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "表单字段输入值",
    })
    formFieldsInputs?: Record<string, any>;

    /**
     * 扩展数据
     * 包含引用来源、上下文、建议等信息
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "扩展数据，包含引用来源、上下文、建议等信息",
    })
    metadata?: MessageMetadata;

    /**
     * 创建时间
     */
    @CreateDateColumn({
        type: "timestamp with time zone",
        comment: "创建时间",
    })
    createdAt: Date;

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
     * 关联的对话记录
     */
    @ManyToOne(() => AgentChatRecord, "messages", {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "conversation_id" })
    conversation: AgentChatRecord;
}
