import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { AiMcpServer, McpServerType } from "@modules/console/ai/entities/ai-mcp-server.entity";
import { AiUserMcpServer } from "@modules/console/ai/entities/ai-user-mcp-server.entity";
import { AiMcpToolService } from "@modules/console/ai/services/ai-mcp-tool.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { McpServer } from "@sdk/ai/utils/mcp/sse";
import { Not, Repository } from "typeorm";

import {
    CreateWebAiMcpServerDto,
    ImportWebAiMcpServerDto,
    UpdateWebAiMcpServerDto,
} from "../dto/ai-mcp-server.dto";

/**
 * 前台MCP服务配置服务
 *
 * 提供用户管理自己的MCP服务的功能
 */
@Injectable()
export class WebAiMcpServerService extends BaseService<AiMcpServer> {
    constructor(
        @InjectRepository(AiMcpServer)
        private readonly aiMcpServerRepository: Repository<AiMcpServer>,
        @InjectRepository(AiUserMcpServer)
        private readonly aiUserMcpServerRepository: Repository<AiUserMcpServer>,
        private readonly aiMcpToolService: AiMcpToolService,
    ) {
        super(aiMcpServerRepository);
    }

    /**
     * 创建用户的MCP服务
     *
     * @param createDto 创建DTO
     * @param creatorId 创建者ID
     * @returns 创建的MCP服务
     */
    async createMcpServer(createDto: CreateWebAiMcpServerDto, creatorId: string) {
        // 检查同名服务是否已存在
        const existServer = await this.findOne({
            where: {
                name: createDto.name,
                creatorId,
            },
        });

        if (existServer) {
            throw HttpExceptionFactory.badRequest(`名为 ${createDto.name} 的MCP服务已存在`);
        }

        const dto = {
            ...createDto,
            creatorId,
            type: McpServerType.USER,
        };

        // 创建MCP服务
        return await this.create(dto);
    }

    /**
     * 更新用户的MCP服务
     *
     * @param id 关联记录ID
     * @param updateDto 更新DTO
     * @param userId 用户ID
     * @returns 更新后的MCP服务
     */
    async updateMcpServer(id: string, updateDto: UpdateWebAiMcpServerDto, userId: string) {
        // 查询用户与MCP服务的关联记录
        const mcpServer = await this.findOne({
            where: {
                id,
                creatorId: userId,
            },
            relations: ["userMcpServer"],
        });

        if (!mcpServer) {
            throw HttpExceptionFactory.notFound("MCP服务不存在");
        }

        // 如果更新了名称，检查同名服务是否已存在
        if (updateDto.name) {
            const existServer = await this.findOne({
                where: {
                    name: updateDto.name,
                    creatorId: userId,
                    id: Not(mcpServer.id), // 排除自己
                },
            });

            if (existServer) {
                throw HttpExceptionFactory.badRequest(`名为 ${updateDto.name} 的MCP服务已存在`);
            }
        }

        // 更新MCP服务
        return await this.updateById(mcpServer.id, updateDto);
    }

    /**
     * 切换用户MCP服务的显示状态
     *
     * @param id MCP服务ID
     * @param status 显示状态值
     * @param userId 用户ID
     * @returns 更新后的MCP服务
     */
    async toggleMcpServerStatus(id: string, status: boolean, userId: string) {
        // 查找用户与MCP服务的关联记录
        const userMcpServer = await this.aiUserMcpServerRepository.findOne({
            where: {
                userId,
                id,
            },
        });

        if (userMcpServer) {
            return await this.aiUserMcpServerRepository.update(id, {
                isDisabled: status,
            });
        } else {
            return await this.updateById(id, {
                isDisabled: status,
            });
        }
    }

    /**
     * 从JSON导入MCP服务配置
     *
     * @param importDto 导入MCP服务的DTO
     * @returns 导入结果
     */
    async importMcpServers(importDto: ImportWebAiMcpServerDto) {
        const { mcpServers, creatorId } = importDto;
        const results = [];
        const errors = [];
        let createdCount = 0;
        let updatedCount = 0;

        // 遍历所有MCP服务配置
        for (const [name, config] of Object.entries(mcpServers)) {
            try {
                // 直接使用完整的URL
                const url = config.url;

                // 检查同名服务是否已存在
                const existServer = await this.findOne({
                    where: { name },
                });

                let mcpServer;
                if (existServer) {
                    // 如果存在，则更新
                    mcpServer = await this.updateById(existServer.id, {
                        url,
                        creatorId,
                    });
                    results.push({
                        ...mcpServer,
                        status: "updated",
                    });
                    updatedCount++;
                } else {
                    // 如果不存在，则创建
                    mcpServer = await this.create({
                        name,
                        type: McpServerType.USER, // 使用系统类型，便于共享
                        url,
                        creatorId,
                        description: `从JSON导入的MCP服务: ${name}`,
                        icon: "",
                        sortOrder: 0,
                        isDisabled: false,
                    });
                    results.push({
                        ...mcpServer,
                        status: "created",
                    });
                    createdCount++;
                }
            } catch (error) {
                errors.push({
                    name,
                    error: error.message,
                });
            }
        }

        return {
            success: errors.length === 0,
            total: Object.keys(mcpServers).length,
            created: createdCount,
            updated: updatedCount,
            results,
            errors,
        };
    }

    /**
     * 检测MCP服务连接状态并更新工具列表
     *
     * @param id MCP服务ID
     * @param userId 用户ID（用于权限验证）
     * @returns 连接检测结果
     */
    async checkConnectionAndUpdateTools(
        id: string,
        userId: string,
    ): Promise<{
        success: boolean;
        connectable: boolean;
        message: string;
        toolsInfo?: {
            created: number;
            updated: number;
            deleted: number;
            total: number;
        };
        error?: string;
    }> {
        // 检查服务是否存在
        const mcpServer = await this.findOneById(id);
        if (!mcpServer) {
            throw HttpExceptionFactory.notFound(`ID为 ${id} 的MCP服务不存在`);
        }

        if (mcpServer.creatorId !== userId) {
            throw HttpExceptionFactory.forbidden("您没有权限操作该MCP服务");
        }

        let mcpClient: McpServer | null = null;
        let connectable = false;
        let toolsInfo = undefined;
        let errorMessage = "";

        try {
            // 创建MCP客户端实例
            mcpClient = new McpServer({
                url: mcpServer.url,
                name: mcpServer.name,
                description: mcpServer.description,
                customHeaders: mcpServer.customHeaders,
            });

            // 尝试连接
            await mcpClient.connect();
            connectable = true;

            // 连接成功，获取工具列表
            const tools = await mcpClient.getToolsList();

            // 更新工具列表
            toolsInfo = await this.aiMcpToolService.updateToolsForMcpServer(id, tools);

            console.log(`✅ MCP服务 ${mcpServer.name} 连接成功，更新了 ${toolsInfo.total} 个工具`);
        } catch (error) {
            connectable = false;
            errorMessage = error.message || "连接失败";
            console.error(`❌ MCP服务 ${mcpServer.name} 连接失败:`, error);

            // 连接失败时清空工具列表
            const deletedCount = await this.aiMcpToolService.deleteToolsForMcpServer(id);
            if (deletedCount > 0) {
                console.log(`🗑️  已清空 ${deletedCount} 个失效的工具`);
            }
        } finally {
            // 确保断开连接
            if (mcpClient) {
                try {
                    await mcpClient.disconnect();
                } catch (disconnectError) {
                    console.warn("断开MCP连接时出现警告:", disconnectError);
                }
            }
        }

        // 更新连接状态和错误信息
        await this.updateById(id, {
            connectable,
            connectError: connectable ? "" : errorMessage,
        });

        return {
            success: true,
            connectable,
            message: connectable
                ? `MCP服务连接成功，${toolsInfo ? `更新了 ${toolsInfo.total} 个工具` : "无工具更新"}`
                : `MCP服务连接失败: ${errorMessage}`,
            toolsInfo,
            error: connectable ? undefined : errorMessage,
        };
    }
}
