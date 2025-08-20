import { Public } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { PublicAccessTokenGuard } from "@common/guards/public-access-token.guard";
import { Body, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { PublicAgentChatDto } from "../dto/agent.dto";
import { CreateAgentAnnotationDto, UpdateAgentAnnotationDto } from "../dto/agent-annotation.dto";
import { AgentService } from "../services/agent.service";
import { AgentAnnotationService } from "../services/agent-annotation.service";
import { PublicAgentChatService } from "../services/public-agent-chat.service";

/**
 * 公开访问智能体控制器
 * 提供无需认证的智能体访问功能
 */
@ConsoleController("public-agent", "公开访问智能体")
export class PublicAgentController {
    constructor(
        private readonly agentService: AgentService,
        private readonly publicAgentChatService: PublicAgentChatService,
        private readonly annotationService: AgentAnnotationService,
    ) {}

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
     * 获取智能体信息
     *
     * @param publishToken 发布令牌
     * @returns 智能体基本信息
     */
    @Get(":publishToken/info")
    @BuildFileUrl(["**.avatar", "**.chatAvatar"])
    @Public()
    async getPublicAgentInfo(@Param("publishToken") publishToken: string) {
        return this.agentService.getPublicAgentByToken(publishToken);
    }

    /**
     * 游客创建标注
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
     * 获取公开智能体标注详情
     *
     * @param publishToken 发布令牌
     * @param annotationId 标注ID
     * @returns 标注详情
     */
    @Get(":publishToken/annotations/:annotationId")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getPublicAnnotationDetail(
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
     * 游客更新标注
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

    /**
     * 获取公开智能体对话记录列表
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
     * 获取公开智能体对话消息
     *
     * @param publishToken 发布令牌
     * @param conversationId 对话ID
     * @param query 查询参数
     * @param req 请求对象
     * @returns 对话消息列表
     */
    @Get(":publishToken/conversations/:conversationId/messages")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async getPublicAgentMessages(
        @Param("publishToken") publishToken: string,
        @Param("conversationId") conversationId: string,
        @Query() query: { page?: number; pageSize?: number },
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.getMessagesByAccessToken(
            publishToken,
            req.accessToken!,
            conversationId,
            query,
            req.user,
        );
    }

    /**
     * 删除公开智能体对话记录
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
     * 更新公开智能体对话记录
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
     * 公开智能体流式对话
     *
     * @param publishToken 发布令牌
     * @param dto 对话DTO
     * @param res 响应对象
     * @param req 请求对象
     */
    @Post(":publishToken/chat/stream")
    @Public()
    @UseGuards(PublicAccessTokenGuard)
    async chatStream(
        @Param("publishToken") publishToken: string,
        @Body() dto: PublicAgentChatDto,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        return this.publicAgentChatService.chatStreamByAccessToken(
            publishToken,
            req.accessToken!,
            dto,
            res,
            req.user,
        );
    }

    /**
     * API认证方式对话
     *
     * @param apiKey API密钥
     * @param dto 对话DTO
     * @returns 对话响应结果
     */
    @Post("chat")
    async apiChat(@Query("apiKey") apiKey: string, @Body() dto: PublicAgentChatDto) {
        return this.publicAgentChatService.chatWithApiKey(apiKey, dto);
    }

    /**
     * API认证方式流式对话
     *
     * @param apiKey API密钥
     * @param dto 对话DTO
     * @param res 响应对象
     */
    @Post("chat/stream")
    async apiChatStream(
        @Query("apiKey") apiKey: string,
        @Body() dto: PublicAgentChatDto,
        @Res() res: Response,
    ) {
        return this.publicAgentChatService.chatStreamWithApiKey(apiKey, dto, res);
    }
}
