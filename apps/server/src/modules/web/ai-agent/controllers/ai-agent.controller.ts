import { BaseController } from "@common/base/controllers/base.controller";
import { Public } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { AgentService } from "@modules/console/ai-agent/services/agent.service";
import { Get, Query } from "@nestjs/common";

import { QueryPublicAgentDto } from "../dto/ai-agent.dto";

/**
 * 智能体控制器（前台）
 *
 * 提供公开智能体列表查询功能
 */
@WebController("ai-agents")
export class AiAgentController extends BaseController {
    constructor(private readonly agentService: AgentService) {
        super();
    }

    /**
     * 获取所有公开的智能体列表
     */
    @Get()
    @Public()
    @BuildFileUrl(["**.avatar", "**.chatAvatar"])
    async getPublicAgents(@Query() queryDto: QueryPublicAgentDto) {
        try {
            // 使用AgentService已有的getPublicAgentList方法
            return this.agentService.getPublicAgentList(queryDto);
        } catch (error) {
            this.logger.error(`获取公开智能体列表失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}
