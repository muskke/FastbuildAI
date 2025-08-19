import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { BatchDeleteChatRecordDto, QueryAgentChatRecordDto } from "../dto/agent.dto";
import { AgentChatRecordService } from "../services/agent-chat-record.service";

/**
 * 智能体对话记录控制器
 * 提供对话记录管理功能
 */
@ConsoleController("ai-agent-chat-record", "智能体对话记录")
export class AgentChatRecordController {
    constructor(private readonly chatRecordService: AgentChatRecordService) {}

    /**
     * 获取智能体对话记录列表
     *
     * 支持按智能体ID、关键词、状态过滤
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 对话记录列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查询对话记录列表",
    })
    @BuildFileUrl(["**.avatar"])
    async list(@Query() dto: QueryAgentChatRecordDto, @Playground() user: UserPlayground) {
        return this.chatRecordService.getChatRecordList(dto, user);
    }

    /**
     * 获取对话记录详情
     *
     * @param id 对话记录ID
     * @param user 当前用户信息
     * @returns 对话记录详细信息
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看对话记录详情",
    })
    async detail(@Param("id") id: string, @Playground() user: UserPlayground) {
        return this.chatRecordService.getChatRecordDetail(id, user);
    }

    /**
     * 批量删除对话记录
     *
     * 执行软删除，将 isDeleted 字段设为 true
     *
     * @param dto 批量删除DTO
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete("batch")
    @Permissions({
        code: "batch-delete",
        name: "批量删除对话记录",
    })
    async batchDelete(@Body() dto: BatchDeleteChatRecordDto, @Playground() user: UserPlayground) {
        return this.chatRecordService.batchDeleteChatRecords(dto, user);
    }

    /**
     * 删除单个对话记录
     *
     * 执行软删除，将 isDeleted 字段设为 true
     *
     * @param id 对话记录ID
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除对话记录",
    })
    async delete(@Param("id") id: string, @Playground() user: UserPlayground) {
        await this.chatRecordService.deleteChatRecord(id, user);
        return {
            message: "对话记录已删除",
        };
    }

    /**
     * 创建对话记录
     *
     * @param body 创建参数
     * @param user 当前用户信息
     * @returns 创建的对话记录
     */
    @Post()
    @Permissions({
        code: "create",
        name: "创建对话记录",
    })
    async create(
        @Body() body: { agentId: string; title?: string },
        @Playground() user: UserPlayground,
    ) {
        return this.chatRecordService.createChatRecord(body.agentId, user.id, body.title);
    }
}
