import { AppEntity } from "@common/decorators/app-entity.decorator";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AiMcpServer } from "./ai-mcp-server.entity";

/**
 * 用户与MCP服务的关联实体
 *
 * 定义用户与MCP服务的多对多关系
 */
@AppEntity({ name: "ai_user_mcp_server", comment: "用户与MCP服务的关联" })
export class AiUserMcpServer {
    /**
     * 关联ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 用户ID
     */
    @Column({
        type: "uuid",
        comment: "用户ID",
    })
    userId: string;

    /**
     * 关联的用户
     */
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user: User;

    /**
     * MCP服务ID
     */
    @Column({
        type: "uuid",
        comment: "MCP服务ID",
    })
    mcpServerId: string;

    /**
     * 关联的MCP服务
     */
    @ManyToOne(() => AiMcpServer, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "mcp_server_id" })
    mcpServer: Awaited<AiMcpServer>;

    /**
     * 是否禁用该服务
     */
    @Column({
        type: "boolean",
        default: false,
        comment: "是否禁用该服务",
    })
    isDisabled: boolean;

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
}
