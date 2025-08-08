import { AppEntity } from "@common/decorators/app-entity.decorator";
import { MCPTool } from "@sdk/ai/utils/mcp/sse";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AiChatRecord } from "./ai-chat-record.entity";
import { AiMcpServer } from "./ai-mcp-server.entity";
import { AiMcpTool } from "./ai-mcp-tool.entity";
import { AiModel } from "./ai-model.entity";

/**
 * MCP工具调用记录接口
 */
export interface McpToolCall {
    id?: string;
    mcpServer?: AiMcpServer;
    tool?: MCPTool;
    /** 工具输入参数 */
    input?: Record<string, any>;
    /** 工具输出结果 */
    output?: Record<string, any>;
    /** 调用时间戳 */
    timestamp?: number;
    /** 执行状态 */
    status?: "success" | "error";
    /** 错误信息（如果有） */
    error?: string;
    /** 执行耗时（毫秒） */
    duration?: number;
}

/**
 * AI对话消息实体
 * 存储对话中的具体消息内容
 */
@AppEntity({ name: "ai_chat_message", comment: "AI对话消息记录" })
@Index(["conversationId", "createdAt"])
@Index(["role", "createdAt"])
export class AiChatMessage {
    /**
     * 主键ID (UUID)
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 对话ID
     */
    @Column({
        type: "uuid",
        comment: "所属对话ID",
    })
    conversationId: string;

    /**
     * 使用的AI模型ID
     */
    @Column({
        type: "uuid",
        comment: "消息使用的AI模型ID",
    })
    @Index()
    modelId: string;

    /**
     * 消息角色
     */
    @Column({
        type: "varchar",
        length: 20,
        comment: "消息角色: user-用户, assistant-AI助手, system-系统",
    })
    @Index()
    role: "user" | "assistant" | "system";

    /**
     * 消息内容
     */
    @Column({
        type: "text",
        comment: "消息文本内容",
    })
    content: string;

    /**
     * 消息类型
     */
    @Column({
        type: "varchar",
        length: 20,
        default: "text",
        comment: "消息类型: text-文本, image-图片, file-文件",
    })
    messageType: "text" | "image" | "file";

    /**
     * 附件信息
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "附件信息，包含文件URL、类型等",
    })
    attachments?: Array<{
        type: string;
        url: string;
        name?: string;
        size?: number;
    }>;

    /**
     * Token消耗
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "Token使用情况",
    })
    tokens?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };

    /**
     * 消息状态
     */
    @Column({
        type: "varchar",
        length: 20,
        default: "completed",
        comment: "消息状态: sending-发送中, completed-已完成, failed-失败",
    })
    status: "sending" | "completed" | "failed";

    /**
     * 错误信息
     */
    @Column({
        type: "text",
        nullable: true,
        comment: "错误信息（当状态为failed时）",
    })
    errorMessage?: string;

    /**
     * 消息序号
     */
    @Column({
        type: "int",
        comment: "在对话中的消息序号",
    })
    @Index()
    sequence: number;

    /**
     * 处理时长（毫秒）
     */
    @Column({
        type: "int",
        nullable: true,
        comment: "AI处理该消息的时长（毫秒）",
    })
    processingTime?: number;

    /**
     * 模型响应的原始数据
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "模型响应的原始数据",
    })
    rawResponse?: Record<string, any>;

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
     * MCP工具调用记录
     * 记录该消息使用的MCP工具调用情况
     */
    @Column({
        type: "jsonb",
        nullable: true,
        comment: "MCP工具调用记录",
    })
    mcpToolCalls?: McpToolCall[];

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
     * 所属对话
     */
    @ManyToOne(() => AiChatRecord, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "conversation_id" })
    conversation: Awaited<AiChatRecord>;

    /**
     * 使用的AI模型
     */
    @ManyToOne(() => AiModel, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "model_id" })
    model: Awaited<AiModel>;
}
