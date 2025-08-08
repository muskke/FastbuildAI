import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { AiMcpServer, McpServerType } from "@modules/console/ai/entities/ai-mcp-server.entity";
import { AiUserMcpServer } from "@modules/console/ai/entities/ai-user-mcp-server.entity";
import { AiMcpToolService } from "@modules/console/ai/services/ai-mcp-tool.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AddUserMcpServerDto } from "../dto/user-mcp-server.dto";

/**
 * 用户MCP服务关联服务
 *
 * 提供用户添加、移除、更新MCP服务关联的功能
 */
@Injectable()
export class UserMcpServerService extends BaseService<AiUserMcpServer> {
    constructor(
        @InjectRepository(AiUserMcpServer)
        private readonly userMcpServerRepository: Repository<AiUserMcpServer>,
        @InjectRepository(AiMcpServer)
        private readonly aiMcpServerRepository: Repository<AiMcpServer>,
        private readonly aiMcpToolService: AiMcpToolService,
    ) {
        super(userMcpServerRepository);
    }

    /**
     * 获取用户关联的所有MCP服务
     *
     * @param userId 用户ID
     * @returns 用户关联的MCP服务列表
     */
    async getUserMcpServers(userId: string) {
        return await this.findAll({
            where: { userId },
            relations: ["mcpServer"],
            order: {
                createdAt: "DESC",
            },
        });
    }

    /**
     * 获取用户关联的单个MCP服务
     *
     * @param id 关联ID
     * @param userId 用户ID
     * @returns 用户关联的MCP服务
     */
    async getUserMcpServer(id: string, userId: string) {
        const userMcpServer = await this.findOne({
            where: { id, userId },
            relations: ["mcpServer"],
        });

        if (!userMcpServer) {
            throw HttpExceptionFactory.notFound("MCP服务关联不存在或您没有权限访问");
        }

        return userMcpServer;
    }

    /**
     * 用户移除MCP服务
     *
     * 如果MCP服务是用户自己创建的（type为USER且creatorId为当前用户），则删除MCP服务记录和关联记录
     * 如果是系统创建的（type为SYSTEM）或其他用户创建的，则只删除关联记录
     *
     * @param id 关联ID
     * @param userId 用户ID
     */
    async removeUserMcpServer(id: string, userId: string) {
        // 检查关联是否存在
        const userMcpServer = await this.findOne({
            where: { id, userId },
            relations: ["mcpServer"],
        });

        if (!userMcpServer) {
            throw HttpExceptionFactory.notFound("MCP服务关联不存在或您没有权限访问");
        }

        // 获取MCP服务详情
        const mcpServer = userMcpServer.mcpServer;
        if (mcpServer.creatorId !== userId || mcpServer.type === McpServerType.SYSTEM) {
            // 如果关联的MCP服务不存在，只删除关联记录
            await this.delete(userMcpServer.id);
            return;
        }

        // 判断是否是用户自己创建的MCP服务（type为USER且creatorId为当前用户）
        const isUserCreated =
            mcpServer.type === McpServerType.USER && mcpServer.creatorId === userId;

        // 先删除关联记录
        await this.delete(userMcpServer.id);

        // 如果是用户自己创建的，则同时删除MCP服务记录
        if (isUserCreated) {
            // 删除该MCP服务关联的所有工具记录
            const deletedToolsCount = await this.aiMcpToolService.deleteToolsForMcpServer(
                mcpServer.id,
            );
            if (deletedToolsCount > 0) {
                console.log(`🗑️  已删除 ${deletedToolsCount} 个关联的MCP工具记录`);
            }

            // 删除MCP服务记录
            await this.aiMcpServerRepository.delete(mcpServer.id);
        }
    }
}
