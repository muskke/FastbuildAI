import { Public } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { PaginationDto } from "@common/dto/pagination.dto";
import { PublicAccessTokenGuard } from "@common/guards/public-access-token.guard";
import { Body, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { V1ChatDto } from "../dto/agent.dto";
import { CreateAgentAnnotationDto, UpdateAgentAnnotationDto } from "../dto/agent-annotation.dto";
import { AgentService } from "../services/agent.service";
import { AgentAnnotationService } from "../services/agent-annotation.service";
import { PublicAgentChatService } from "../services/v1-agent-chat.service";

/**
 * V1 API 控制器
 * 提供标准化的 AI Agent API 接口
 */
@ConsoleController("v1", "V1 API")
export class V1Controller {
    constructor(
        private readonly agentService: AgentService,
        private readonly publicAgentChatService: PublicAgentChatService,
        private readonly annotationService: AgentAnnotationService,
    ) {}

    /**
     * 获取智能体信息
     *
     * @param publishToken 发布令牌
     * @returns 智能体基本信息
     */
    @Get(":publishToken/info")
    @BuildFileUrl(["**.avatar", "**.chatAvatar"])
    @Public()
    async getAgentInfo(@Param("publishToken") publishToken: string) {
        return this.agentService.getPublicAgentByToken(publishToken);
    }

    /**
     * 生成访问令牌
     *
     * @param publishToken 发布令牌
     * @returns 访问令牌信息
     */
    @Post(":publishToken/generate-access-token")
    @Public()
    async generateAccessToken(@Param("publishToken") publishToken: string) {
        return this.publicAgentChatService.generateAccessToken(publishToken);
    }

    /**
     * 统一对话接口
     * 支持流式和阻塞两种模式
     *
     * @param publishToken 发布令牌
     * @param dto 对话DTO
     * @param res 响应对象
     * @param req 请求对象
     */
    @Post(":publishToken/chat")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async chat(
        @Param("publishToken") publishToken: string,
        @Body() dto: V1ChatDto,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        const { responseMode = "streaming", ...chatDto } = dto;

        if (responseMode === "streaming") {
            // 流式响应
            return this.publicAgentChatService.chatStreamByAccessToken(
                publishToken,
                req.accessToken!,
                chatDto,
                res,
                req.user,
            );
        } else {
            // 阻塞响应
            const result = await this.publicAgentChatService.chatByAccessToken(
                publishToken,
                req.accessToken!,
                chatDto,
                req.user,
            );
            return res.json(result);
        }
    }

    /**
     * API认证方式对话
     *
     * @param dto 对话DTO
     * @param res 响应对象
     * @param req 请求对象
     */
    @Post("chat")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async apiChat(@Body() dto: V1ChatDto, @Res() res: Response, @Req() req: Request) {
        const { responseMode = "streaming", ...chatData } = dto;

        if (responseMode === "streaming") {
            // 流式响应
            return this.publicAgentChatService.chatStreamWithApiKey(
                req.accessToken!,
                chatData,
                res,
            );
        } else {
            // 阻塞响应
            const result = await this.publicAgentChatService.chatWithApiKey(
                req.accessToken!,
                chatData,
            );
            return res.json(result);
        }
    }

    /**
     * 获取对话记录列表 (使用 API Key)
     *
     * @param query 查询参数
     * @param req 请求对象
     * @returns 对话记录列表
     */
    @Get("conversations")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getApiConversations(@Query() query: PaginationDto, @Req() req: Request) {
        return this.publicAgentChatService.getConversationsByApiKey(req.accessToken!, query);
    }

    /**
     * 获取对话消息 (使用 API Key)
     *
     * @param conversationId 对话ID
     * @param query 查询参数
     * @param req 请求对象
     * @returns 对话消息列表
     */
    @Get("conversations/:conversationId/messages")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getApiMessages(
        @Param("conversationId") conversationId: string,
        @Query() query: PaginationDto,
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.getMessagesByApiKey(
            req.accessToken!,
            conversationId,
            query,
        );
    }

    /**
     * 删除对话记录 (使用 API Key)
     *
     * @param conversationId 对话ID
     * @param req 请求对象
     * @returns 删除结果
     */
    @Delete("conversations/:conversationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async deleteApiConversation(
        @Param("conversationId") conversationId: string,
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.deleteConversationByApiKey(
            req.accessToken!,
            conversationId,
        );
    }

    /**
     * 更新对话记录 (使用 API Key)
     *
     * @param conversationId 对话ID
     * @param body 更新数据
     * @param req 请求对象
     * @returns 更新结果
     */
    @Put("conversations/:conversationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async updateApiConversation(
        @Param("conversationId") conversationId: string,
        @Body() body: { title?: string },
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.updateConversationByApiKey(
            req.accessToken!,
            conversationId,
            body,
        );
    }

    /**
     * 获取对话记录列表 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param query 查询参数
     * @param req 请求对象
     * @returns 对话记录列表
     */
    @Get(":publishToken/conversations")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getPublicAgentConversations(
        @Param("publishToken") publishToken: string,
        @Query() query: { page?: number; pageSize?: number },
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.getConversationsByAccessToken(
            publishToken,
            req.accessToken!,
            query,
            req.user,
        );
    }

    /**
     * 获取对话消息 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param conversationId 对话ID
     * @param query 查询参数
     * @returns 对话消息列表
     */
    @Get(":publishToken/conversations/:conversationId/messages")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getPublicAgentMessages(
        @Param("publishToken") publishToken: string,
        @Param("conversationId") conversationId: string,
        @Query() query: PaginationDto,
    ) {
        return this.publicAgentChatService.getMessagesByAccessToken(
            publishToken,
            conversationId,
            query,
        );
    }

    /**
     * 删除对话记录 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param conversationId 对话ID
     * @param req 请求对象
     * @returns 删除结果
     */
    @Delete(":publishToken/conversations/:conversationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async deletePublicAgentConversation(
        @Param("publishToken") publishToken: string,
        @Param("conversationId") conversationId: string,
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.deleteConversationByAccessToken(
            publishToken,
            req.accessToken!,
            conversationId,
            req.user,
        );
    }

    /**
     * 更新对话记录 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param conversationId 对话ID
     * @param body 更新数据
     * @param req 请求对象
     * @returns 更新结果
     */
    @Put(":publishToken/conversations/:conversationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async updatePublicAgentConversation(
        @Param("publishToken") publishToken: string,
        @Param("conversationId") conversationId: string,
        @Body() body: { title?: string },
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.updateConversationByAccessToken(
            publishToken,
            req.accessToken!,
            conversationId,
            body,
            req.user,
        );
    }

    /**
     * 创建标注 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param dto 创建标注DTO
     * @param req 请求对象
     * @returns 创建的标注
     */
    @Post(":publishToken/annotations")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async createAnnotation(
        @Param("publishToken") publishToken: string,
        @Body() dto: CreateAgentAnnotationDto,
        @Req() req: Request,
    ) {
        // 获取智能体信息
        const agent = await this.agentService.getPublicAgentByToken(publishToken);

        // 创建匿名用户上下文
        const anonymousUser = {
            id: req.accessToken!,
            username: `anonymous_${Date.now()}`,
            isRoot: 0 as const,
            role: {} as any,
            permissions: [],
        };

        return await this.annotationService.createAnnotation(agent.id, dto, anonymousUser);
    }

    /**
     * 获取标注详情 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param annotationId 标注ID
     * @returns 标注详情
     */
    @Get(":publishToken/annotations/:annotationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getAnnotationDetail(
        @Param("publishToken") publishToken: string,
        @Param("annotationId") annotationId: string,
    ) {
        // 获取智能体信息
        const agent = await this.agentService.getPublicAgentByToken(publishToken);

        // 验证标注是否属于该智能体
        const annotation = await this.annotationService.getAnnotationById(annotationId);
        if (annotation.agentId !== agent.id) {
            throw new Error("标注不存在或无权访问");
        }

        return annotation;
    }

    /**
     * 更新标注 (使用访问令牌)
     *
     * @param publishToken 发布令牌
     * @param annotationId 标注ID
     * @param dto 更新标注DTO
     * @param req 请求对象
     * @returns 更新后的标注
     */
    @Put(":publishToken/annotations/:annotationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async updateAnnotation(
        @Param("publishToken") publishToken: string,
        @Param("annotationId") annotationId: string,
        @Body() dto: UpdateAgentAnnotationDto,
        @Req() req: Request,
    ) {
        // 获取智能体信息
        const agent = await this.agentService.getPublicAgentByToken(publishToken);

        // 创建匿名用户上下文
        const anonymousUser = {
            id: req.accessToken!,
            username: `anonymous_${Date.now()}`,
            isRoot: 0 as const,
            role: {} as any,
            permissions: [],
        };

        return await this.annotationService.updateAnnotation(annotationId, dto, anonymousUser);
    }
}
