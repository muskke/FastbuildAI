import { Playground } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";

import {
    CreateAgentAnnotationDto,
    QueryAgentAnnotationDto,
    ReviewAnnotationDto,
    UpdateAgentAnnotationDto,
} from "../dto/agent-annotation.dto";
import { AgentAnnotationService } from "../services/agent-annotation.service";

/**
 * 智能体标注控制器
 */
@WebController("agent-annotations")
export class AgentAnnotationController {
    constructor(private readonly annotationService: AgentAnnotationService) {}

    /**
     * 创建标注
     */
    @Post()
    async createAnnotation(
        @Body() dto: CreateAgentAnnotationDto,
        @Playground() user: UserPlayground,
    ) {
        return await this.annotationService.createAnnotation(dto.agentId, dto, user);
    }

    /**
     * 获取智能体的所有标注
     */
    @Get()
    @BuildFileUrl(["**.avatar"])
    async getAnnotations(@Query() query: QueryAgentAnnotationDto) {
        if (!query.agentId) {
            throw new Error("智能体ID是必需的");
        }
        return this.annotationService.getAgentAnnotations(query.agentId, query);
    }

    /**
     * 获取标注详情
     */
    @Get(":id")
    async getAnnotationDetail(@Param("id") id: string) {
        return await this.annotationService.getAnnotationById(id);
    }

    /**
     * 更新标注
     */
    @Put(":id")
    async updateAnnotation(
        @Param("id") id: string,
        @Body() dto: UpdateAgentAnnotationDto,
        @Playground() user: UserPlayground,
    ) {
        return await this.annotationService.updateAnnotation(id, dto, user);
    }

    /**
     * 审核标注
     */
    @Put(":id/review")
    async reviewAnnotation(
        @Param("id") id: string,
        @Body() dto: ReviewAnnotationDto,
        @Playground() user: UserPlayground,
    ) {
        return await this.annotationService.reviewAnnotation(id, dto, user);
    }

    /**
     * 删除标注
     */
    @Delete(":id")
    async deleteAnnotation(@Param("id") id: string) {
        return await this.annotationService.deleteAnnotation(id);
    }
}
