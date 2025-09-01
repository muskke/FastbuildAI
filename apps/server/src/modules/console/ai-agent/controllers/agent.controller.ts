import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Logger, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";

import {
    AgentChatDto,
    CreateAgentDto,
    ImportAgentDto,
    PublishAgentDto,
    QueryAgentDto,
    QueryAgentStatisticsDto,
    UpdateAgentConfigDto,
} from "../dto/agent.dto";
import {
    AgentTemplateDto,
    CreateAgentFromTemplateDto,
    QueryTemplateDto,
} from "../dto/agent-template.dto";
import { NoBillingStrategy } from "../interfaces/billing-strategy.interface";
import { AgentService } from "../services/agent.service";
import { AgentChatService } from "../services/agent-chat.service";
import { AgentTemplateService } from "../services/agent-template.service";

/**
 * 智能体控制器
 * 提供智能体创建、管理功能
 */
@ConsoleController("ai-agent", "智能体")
export class AgentController {
    private readonly logger = new Logger(AgentController.name);

    constructor(
        private readonly agentService: AgentService,
        private readonly agentChatService: AgentChatService,
        private readonly agentTemplateService: AgentTemplateService,
    ) {}

    // ========== 智能体导入导出相关接口 ==========

    /**
     * 导出智能体配置
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 智能体配置JSON数据
     */
    @Get("export")
    @Permissions({
        code: "export",
        name: "导出智能体配置",
    })
    async exportAgent(@Query("id") id: string, @Playground() user: UserPlayground) {
        if (!id) {
            throw new Error("智能体ID不能为空");
        }
        return this.agentService.getAgentDetail(id);
    }

    /**
     * 导入智能体配置
     *
     * @param dto 导入智能体配置DTO
     * @param user 当前用户信息
     * @returns 导入结果
     */
    @Post("import")
    @Permissions({
        code: "import",
        name: "导入智能体配置",
    })
    async importAgent(@Body() dto: ImportAgentDto, @Playground() user: UserPlayground) {
        dto.avatar = dto.avatar || "/static/images/agent.png";
        // 添加创建者ID
        dto.createBy = user.id;
        const agent = await this.agentService.createAgentFromTemplate(dto as ImportAgentDto);

        // 自动发布智能体
        await this.agentService.publishAgent(agent.id, {
            publishConfig: {
                allowOrigins: [],
                rateLimitPerMinute: 60,
                showBranding: true,
                allowDownloadHistory: false,
            },
        });

        return agent;
    }

    // ========== 模板管理相关接口 ==========

    /**
     * 获取智能体模板列表
     */
    @Get("templates")
    @BuildFileUrl(["**.avatar"])
    @Permissions({
        code: "list-templates",
        name: "查询智能体模板",
    })
    async getTemplates(@Query() query: QueryTemplateDto): Promise<AgentTemplateDto[]> {
        return this.agentTemplateService.getTemplateList(query);
    }

    /**
     * 获取模板分类列表
     */
    @Get("templates/categories")
    @Permissions({
        code: "list-template-categories",
        name: "查询模板分类",
    })
    async getTemplateCategories(): Promise<string[]> {
        return this.agentTemplateService.getTemplateCategories();
    }

    /**
     * 获取推荐模板
     */
    @Get("templates/recommended")
    @BuildFileUrl(["**.avatar"])
    @Permissions({
        code: "list-recommended-templates",
        name: "查询推荐模板",
    })
    async getRecommendedTemplates(): Promise<AgentTemplateDto[]> {
        return this.agentTemplateService.getRecommendedTemplates();
    }

    /**
     * 从模板创建智能体
     */
    @Post("templates/create")
    @Permissions({
        code: "create-from-template",
        name: "从模板创建智能体",
    })
    async createFromTemplate(
        @Body() dto: CreateAgentFromTemplateDto,
        @Playground() user: UserPlayground,
    ) {
        const createAgentDto = await this.agentTemplateService.createAgentFromTemplate(dto);

        // 添加创建者ID
        createAgentDto.createBy = user.id;

        const agent = await this.agentService.createAgentFromTemplate(
            createAgentDto as CreateAgentFromTemplateDto,
        );

        // 自动发布智能体
        await this.agentService.publishAgent(agent.id, {
            publishConfig: {
                allowOrigins: [],
                rateLimitPerMinute: 60,
                showBranding: true,
                allowDownloadHistory: false,
            },
        });

        return agent;
    }

    // ========== 智能体管理相关接口 ==========

    /**
     * 创建智能体
     *
     * @param dto 创建智能体DTO
     * @param user 当前用户信息
     * @returns 创建的智能体信息
     */
    @Post()
    @Permissions({
        code: "create",
        name: "创建智能体",
    })
    async create(@Body() dto: CreateAgentDto, @Playground() user: UserPlayground) {
        // 添加创建者ID
        dto.createBy = user.id;

        // 创建智能体
        const agent = await this.agentService.createAgent(dto, user);

        await this.agentService.publishAgent(agent.id, {
            publishConfig: {
                allowOrigins: [],
                rateLimitPerMinute: 60,
                showBranding: true,
                allowDownloadHistory: false,
            },
        });

        return agent;
    }

    /**
     * 获取智能体列表
     *
     * 支持关键词搜索智能体名称和描述
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 智能体列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查询智能体列表",
    })
    @BuildFileUrl(["**.avatar"])
    async list(@Query() dto: QueryAgentDto, @Playground() user: UserPlayground) {
        return this.agentService.getAgentList(dto, user);
    }

    /**
     * 获取智能体详情
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 智能体详细信息
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看智能体详情",
    })
    @BuildFileUrl(["**.avatar"])
    async detail(@Param("id") id: string, @Playground() user: UserPlayground) {
        // 增加访问计数
        await this.agentService.incrementUserCount(id);
        return this.agentService.getAgentDetail(id);
    }

    /**
     * 更新智能体配置
     *
     * @param id 智能体ID
     * @param dto 更新配置DTO
     * @param user 当前用户信息
     * @returns 更新后的智能体信息
     */
    @Patch(":id")
    @Permissions({
        code: "update",
        name: "更新智能体",
    })
    async updateConfig(
        @Param("id") id: string,
        @Body() dto: UpdateAgentConfigDto,
        @Playground() user: UserPlayground,
    ) {
        return this.agentService.updateAgentConfig(id, dto, user);
    }

    /**
     * 智能体对话
     *
     * 支持表单变量、模型配置、知识库检索等完整功能
     *
     * @param id 智能体ID
     * @param dto 对话DTO
     * @param user 当前用户信息
     * @returns 对话响应结果
     */
    @Post(":id/chat")
    @Permissions({
        code: "chat",
        name: "智能体对话",
    })
    async chat(
        @Param("id") id: string,
        @Body() dto: AgentChatDto,
        @Playground() user: UserPlayground,
    ) {
        return this.agentChatService.handleChat(id, dto, user, "blocking", new NoBillingStrategy());
    }

    /**
     * 智能体流式对话
     *
     * 支持SSE流式响应，表单变量、模型配置、知识库检索等完整功能
     *
     * @param id 智能体ID
     * @param dto 对话DTO
     * @param user 当前用户信息
     * @param res 响应对象
     */
    @Post(":id/chat/stream")
    @Permissions({
        code: "chat-stream",
        name: "智能体流式对话",
    })
    async chatStream(
        @Param("id") id: string,
        @Body() dto: AgentChatDto,
        @Playground() user: UserPlayground,
        @Res() res: Response,
    ) {
        return this.agentChatService.handleChat(
            id,
            dto,
            user,
            "streaming",
            new NoBillingStrategy(),
            res,
        );
    }

    /**
     * 获取智能体统计信息
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 智能体统计数据
     */
    @Get(":id/statistics")
    @Permissions({
        code: "statistics",
        name: "查看智能体统计",
    })
    async getStatistics(
        @Param("id") id: string,
        @Query() dto: QueryAgentStatisticsDto,
        @Playground() user: UserPlayground,
    ) {
        return this.agentService.getAgentStatistics(id, dto);
    }

    /**
     * 删除智能体
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除智能体",
    })
    async delete(@Param("id") id: string, @Playground() user: UserPlayground) {
        await this.agentService.deleteAgent(id, user);
        return { message: "智能体删除成功" };
    }

    // ========== 发布管理相关接口 ==========

    /**
     * 发布智能体
     *
     * @param id 智能体ID
     * @param dto 发布配置DTO
     * @param user 当前用户信息
     * @returns 发布结果，包含访问令牌和嵌入代码
     */
    @Post(":id/publish")
    @Permissions({
        code: "publish",
        name: "发布智能体",
    })
    async publish(@Param("id") id: string, @Body() dto: PublishAgentDto) {
        return this.agentService.publishAgent(id, dto);
    }

    /**
     * 取消发布智能体
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 取消发布结果
     */
    @Post(":id/unpublish")
    @Permissions({
        code: "unpublish",
        name: "取消发布智能体",
    })
    async unpublish(@Param("id") id: string, @Playground() user: UserPlayground) {
        await this.agentService.unpublishAgent(id, user);
        return { message: "智能体取消发布成功" };
    }

    /**
     * 重新生成API密钥
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 新的API密钥
     */
    @Post(":id/regenerate-api-key")
    @Permissions({
        code: "regenerate-api-key",
        name: "重新生成API密钥",
    })
    async regenerateApiKey(@Param("id") id: string, @Playground() user: UserPlayground) {
        return this.agentService.regenerateApiKey(id, user);
    }

    /**
     * 获取嵌入代码
     *
     * @param id 智能体ID
     * @param user 当前用户信息
     * @returns 嵌入代码和发布链接
     */
    @Get(":id/embed-code")
    @Permissions({
        code: "embed-code",
        name: "获取嵌入代码",
    })
    async getEmbedCode(@Param("id") id: string, @Playground() user: UserPlayground) {
        return this.agentService.getEmbedCode(id, user);
    }
}
