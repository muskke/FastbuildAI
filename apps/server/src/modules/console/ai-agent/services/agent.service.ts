import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "crypto";
import { FindOptions, FindOptionsOrder, FindOptionsWhere, Like, Repository } from "typeorm";

import {
    CreateAgentDto,
    ImportAgentDto,
    PublicAgentInfoDto,
    PublishAgentDto,
    QueryAgentDto,
    QueryAgentStatisticsDto,
    UpdateAgentConfigDto,
} from "../dto/agent.dto";
import { CreateAgentFromTemplateDto } from "../dto/agent-template.dto";
import { Agent } from "../entities/agent.entity";
import { AgentAnnotation } from "../entities/agent-annotation.entity";
import { AgentChatMessage } from "../entities/agent-chat-message.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";

@Injectable()
export class AgentService extends BaseService<Agent> {
    private readonly defaultAvatar = "/static/images/agent.png";

    constructor(
        @InjectRepository(Agent) private readonly agentRepository: Repository<Agent>,
        @InjectRepository(AgentChatRecord)
        private readonly chatRecordRepository: Repository<AgentChatRecord>,
        @InjectRepository(AgentChatMessage)
        private readonly chatMessageRepository: Repository<AgentChatMessage>,
        @InjectRepository(AgentAnnotation)
        private readonly annotationRepository: Repository<AgentAnnotation>,
    ) {
        super(agentRepository);
    }

    // 创建新智能体
    async createAgent(dto: CreateAgentDto, user: UserPlayground): Promise<Agent> {
        const { name, description, avatar } = dto;

        await this.checkNameUniqueness(name);

        return this.withErrorHandling(async () => {
            const agent = await this.create({
                name,
                description,
                avatar: avatar || this.defaultAvatar,
                showContext: true,
                showReference: true,
                enableFeedback: false,
                enableWebSearch: false,
                userCount: 0,
                isPublic: false,
            });
            this.logger.log(`[+] 智能体创建成功: ${agent.id} - ${name}`);
            return agent as Agent;
        }, "智能体创建失败");
    }

    // 从模板创建智能体
    async createAgentFromTemplate(
        dto: CreateAgentFromTemplateDto | ImportAgentDto,
    ): Promise<Agent> {
        await this.checkNameUniqueness(dto.name);

        return this.withErrorHandling(async () => {
            const agent = await this.create({
                ...dto,
            });
            this.logger.log(`[+] 智能体创建成功: ${agent.id} - ${dto.name}`);
            return agent as Agent;
        }, "智能体创建失败");
    }

    // 获取智能体详情
    async getAgentDetail(id: string): Promise<Agent> {
        const agent = await this.findOneById(id);
        if (!agent) {
            throw HttpExceptionFactory.notFound("智能体不存在");
        }
        return agent as Agent;
    }

    // 更新智能体配置
    async updateAgentConfig(
        id: string,
        dto: UpdateAgentConfigDto,
        user: UserPlayground,
    ): Promise<Agent> {
        const agent = await this.getAgentDetail(id);

        if (dto.name && dto.name !== agent.name) {
            await this.checkNameUniqueness(dto.name);
        }

        return this.withErrorHandling(async () => {
            const updateData = { ...dto, avatar: dto.avatar || this.defaultAvatar };
            if (updateData.billingConfig.price < 0) {
                throw HttpExceptionFactory.business("算力消耗不能小于 0");
            }
            const updated = await this.updateById(id, updateData);
            this.logger.log(`[+] 智能体配置更新成功: ${id}`);
            return updated as Agent;
        }, "智能体配置更新失败");
    }

    // 获取智能体列表，支持关键字过滤、公开状态筛选和分页
    async getAgentList(dto: QueryAgentDto, user: UserPlayground) {
        const queryBuilder = this.agentRepository.createQueryBuilder("agent");

        if (dto.keyword) {
            queryBuilder.where("agent.name ILIKE :keyword OR agent.description ILIKE :keyword", {
                keyword: `%${dto.keyword}%`,
            });
        }

        // 添加公开状态筛选
        if (dto.isPublic !== undefined) {
            queryBuilder.andWhere("agent.isPublic = :isPublic", {
                isPublic: dto.isPublic,
            });
        }

        return this.paginateQueryBuilder(queryBuilder.orderBy("agent.createdAt", "DESC"), dto);
    }

    // 删除指定智能体
    async deleteAgent(id: string, user: UserPlayground): Promise<void> {
        await this.getAgentDetail(id); // 验证智能体存在

        await this.withErrorHandling(async () => {
            await this.agentRepository.delete(id);
            this.logger.log(`[+] 智能体删除成功: ${id}`);
        }, "智能体删除失败");
    }

    // 增加智能体访问用户计数
    async incrementUserCount(id: string): Promise<void> {
        await this.withErrorHandling(async () => {
            await this.agentRepository.increment({ id }, "userCount", 1);
            this.logger.log(`[+] 智能体访问计数+1: ${id}`);
        }, "更新访问计数失败");
    }

    // 获取智能体统计数据，包括总览和趋势
    async getAgentStatistics(
        agentId: string,
        dto?: QueryAgentStatisticsDto,
    ): Promise<{
        overview: {
            totalConversations: number;
            totalMessages: number;
            totalTokens: number;
            totalAnnotations: number;
            activeAnnotations: number;
            annotationHitCount: number;
        };
        trends: {
            conversations: Array<{ date: string; count: number }>;
            messages: Array<{ date: string; count: number }>;
            tokens: Array<{ date: string; count: number }>;
            activeUsers: Array<{ date: string; count: number }>;
        };
    }> {
        await this.getAgentDetail(agentId); // 验证智能体存在

        const { startDate, endDate } = this.getDateRange(dto);

        const overview = await this.fetchOverview(agentId);
        const trends = await this.fetchTrends(agentId, startDate, endDate);

        this.logger.log(`[智能体统计] 数据获取成功: ${agentId}`);
        return { overview, trends };
    }

    // 检查智能体名称是否唯一
    private async checkNameUniqueness(name: string): Promise<void> {
        const existing = await this.findOne({ where: { name } });
        if (existing) {
            throw HttpExceptionFactory.badRequest("智能体名称已存在");
        }
    }

    // 统一错误处理和日志记录
    private async withErrorHandling<T>(
        operation: () => Promise<T>,
        errorMessage: string,
    ): Promise<T> {
        try {
            return await operation();
        } catch (err) {
            this.logger.error(`[!] ${errorMessage}: ${err.message}`, err.stack);
            throw HttpExceptionFactory.business(errorMessage);
        }
    }

    // 获取统计数据的时间范围
    private getDateRange(dto?: QueryAgentStatisticsDto): { startDate: Date; endDate: Date } {
        const endDate = dto?.endDate ? new Date(dto.endDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = dto?.startDate
            ? new Date(dto.startDate)
            : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);

        this.logger.log(
            `[统计] 查询时间范围: ${startDate.toISOString()} 至 ${endDate.toISOString()}`,
        );
        return { startDate, endDate };
    }

    // 获取统计总览数据
    private async fetchOverview(agentId: string) {
        const [
            totalConversations,
            totalMessages,
            { total: totalTokens },
            totalAnnotations,
            activeAnnotations,
            { total: annotationHitCount },
        ] = await Promise.all([
            this.chatRecordRepository.count({ where: { agentId, isDeleted: false } }),
            this.chatMessageRepository.count({ where: { agentId } }),
            this.chatRecordRepository
                .createQueryBuilder("record")
                .select("SUM(record.totalTokens)", "total")
                .where("record.agentId = :agentId AND record.isDeleted = false", { agentId })
                .getRawOne(),
            this.annotationRepository.count({ where: { agentId } }),
            this.annotationRepository.count({ where: { agentId, enabled: true } }),
            this.annotationRepository
                .createQueryBuilder("annotation")
                .select("SUM(annotation.hitCount)", "total")
                .where("annotation.agentId = :agentId", { agentId })
                .getRawOne(),
        ]);

        return {
            totalConversations,
            totalMessages,
            totalTokens: parseInt(totalTokens || "0"),
            totalAnnotations,
            activeAnnotations,
            annotationHitCount: parseInt(annotationHitCount || "0"),
        };
    }

    // 获取趋势数据
    private async fetchTrends(agentId: string, startDate: Date, endDate: Date) {
        const [conversations, messages, tokens, activeUsers] = await Promise.all([
            this.chatRecordRepository
                .createQueryBuilder("record")
                .select("DATE(record.createdAt) as date, COUNT(*) as count")
                .where(
                    "record.agentId = :agentId AND record.createdAt BETWEEN :startDate AND :endDate AND record.isDeleted = false",
                    { agentId, startDate, endDate },
                )
                .groupBy("DATE(record.createdAt)")
                .orderBy("date", "ASC")
                .getRawMany(),
            this.chatMessageRepository
                .createQueryBuilder("message")
                .select("DATE(message.createdAt) as date, COUNT(*) as count")
                .where(
                    "message.agentId = :agentId AND message.createdAt BETWEEN :startDate AND :endDate",
                    { agentId, startDate, endDate },
                )
                .groupBy("DATE(message.createdAt)")
                .orderBy("date", "ASC")
                .getRawMany(),
            this.chatRecordRepository
                .createQueryBuilder("record")
                .select("DATE(record.createdAt) as date, SUM(record.totalTokens) as count")
                .where(
                    "record.agentId = :agentId AND record.createdAt BETWEEN :startDate AND :endDate AND record.isDeleted = false",
                    { agentId, startDate, endDate },
                )
                .groupBy("DATE(record.createdAt)")
                .orderBy("date", "ASC")
                .getRawMany(),
            this.chatRecordRepository
                .createQueryBuilder("record")
                .select("DATE(record.createdAt) as date, COUNT(DISTINCT record.userId) as count")
                .where(
                    "record.agentId = :agentId AND record.createdAt BETWEEN :startDate AND :endDate AND record.isDeleted = false",
                    { agentId, startDate, endDate },
                )
                .groupBy("DATE(record.createdAt)")
                .orderBy("date", "ASC")
                .getRawMany(),
        ]);

        return {
            conversations: this.formatTrendData(conversations, startDate, endDate),
            messages: this.formatTrendData(messages, startDate, endDate),
            tokens: this.formatTrendData(tokens, startDate, endDate),
            activeUsers: this.formatTrendData(activeUsers, startDate, endDate),
        };
    }

    // 格式化趋势数据，填充缺失日期
    private formatTrendData(
        data: any[],
        startDate: Date,
        endDate: Date,
    ): Array<{ date: string; count: number }> {
        const result: Array<{ date: string; count: number }> = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const found = data.find(
                (item) => new Date(item.date).toISOString().split("T")[0] === dateStr,
            );
            result.push({ date: dateStr, count: found ? parseInt(found.count) : 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        this.logger.log(`[趋势数据] 格式化结果: ${JSON.stringify(result)}`);
        return result;
    }

    /**
     * 发布智能体
     * 生成访问令牌和API密钥，启用公开访问
     */
    async publishAgent(
        id: string,
        dto: PublishAgentDto,
    ): Promise<{
        publishToken: string;
        apiKey: string;
        publishUrl: string;
        embedCode: string;
    }> {
        const agent = await this.getAgentDetail(id);

        return this.withErrorHandling(async () => {
            // 生成唯一的访问令牌和API密钥
            const publishToken = this.generateToken("pub");
            const apiKey = this.generateToken("ak");

            // 更新智能体发布状态
            await this.updateById(id, {
                isPublished: true,
                publishToken,
                apiKey,
                publishConfig: dto.publishConfig || {},
            });

            const publishUrl = `${process.env.VITE_APP_BASE_URL || "http://localhost:4090"}/public/agent/${publishToken}`;
            const embedCode = this.generateEmbedCode(publishToken, publishUrl);

            this.logger.log(`[+] 智能体发布成功: ${id} - ${agent.name}`);

            return {
                publishToken,
                apiKey,
                publishUrl,
                embedCode,
            };
        }, "智能体发布失败");
    }

    /**
     * 取消发布智能体
     * 清除访问令牌和API密钥，禁用公开访问
     */
    async unpublishAgent(id: string, user: UserPlayground): Promise<void> {
        const agent = await this.getAgentDetail(id);

        await this.withErrorHandling(async () => {
            await this.updateById(id, {
                isPublished: false,
                publishToken: null,
                apiKey: null,
                publishConfig: null,
            });

            this.logger.log(`[+] 智能体取消发布成功: ${id} - ${agent.name}`);
        }, "智能体取消发布失败");
    }

    /**
     * 重新生成API密钥
     */
    async regenerateApiKey(id: string, user: UserPlayground): Promise<{ apiKey: string }> {
        const agent = await this.getAgentDetail(id);

        if (!agent.isPublished) {
            throw HttpExceptionFactory.badRequest("智能体未发布，无法重新生成API密钥");
        }

        return this.withErrorHandling(async () => {
            const apiKey = this.generateToken("ak");

            await this.updateById(id, { apiKey });

            this.logger.log(`[+] API密钥重新生成成功: ${id} - ${agent.name}`);

            return { apiKey };
        }, "API密钥重新生成失败");
    }

    /**
     * 获取嵌入代码
     */
    async getEmbedCode(
        id: string,
        user: UserPlayground,
    ): Promise<{ embedCode: string; publishUrl: string }> {
        const agent = await this.getAgentDetail(id);

        if (!agent.isPublished || !agent.publishToken) {
            throw HttpExceptionFactory.badRequest("智能体未发布，无法获取嵌入代码");
        }

        const publishUrl = `${process.env.VITE_APP_BASE_URL || "http://localhost:4090"}/public/agent/${agent.publishToken}`;
        const embedCode = this.generateEmbedCode(agent.publishToken, publishUrl);

        return { embedCode, publishUrl };
    }

    /**
     * 获取公开智能体列表
     */
    async getPublicAgentList(dto: QueryAgentDto) {
        const where: FindOptionsWhere<Agent> = {
            isPublic: true,
            isPublished: true,
        };

        const order: FindOptionsOrder<Agent> = {
            createdAt: dto.sortBy === "popular" ? "DESC" : "ASC",
        };

        // 添加关键词搜索
        if (dto.keyword) {
            where.name = Like(`%${dto.keyword}%`);
        }

        // 添加排序
        if (dto.sortBy === "popular") {
            order.userCount = "DESC";
            order.createdAt = "DESC";
        } else {
            order.createdAt = "DESC";
        }

        return this.paginate(dto, {
            where,
            order,
        });
    }

    /**
     * 通过发布令牌获取公开智能体信息
     */
    async getPublicAgentByToken(publishToken: string): Promise<Agent> {
        const agent = await this.findOne({
            where: { publishToken, isPublished: true },
        });

        if (!agent) {
            throw HttpExceptionFactory.notFound("智能体不存在或未发布");
        }

        // 只返回公开需要的字段
        return agent as Agent;
    }

    /**
     * 验证API密钥并获取智能体
     */
    async getAgentByApiKey(apiKey: string): Promise<Agent> {
        const agent = await this.findOne({
            where: { apiKey, isPublished: true },
        });

        if (!agent) {
            throw HttpExceptionFactory.unauthorized("API密钥无效或智能体未发布");
        }

        return agent as Agent;
    }

    /**
     * 生成唯一令牌
     */
    private generateToken(prefix: string = ""): string {
        const token = randomBytes(16).toString("hex");
        return prefix ? `${prefix}_${token}` : token;
    }

    /**
     * 生成嵌入代码
     */
    private generateEmbedCode(publishToken: string, publishUrl: string): string {
        return `<!-- FastbuildAI 智能体嵌入代码 -->
<iframe 
  src="${publishUrl}?embed=true"
  width="400" 
  height="600"
  frameborder="0"
  style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
</iframe>

<!-- 或使用 JavaScript SDK -->
<div id="chatbot-container"></div>
<script>
  window.FastbuildAI = {
    init: function(options) {
      const iframe = document.createElement('iframe');
      iframe.src = '${publishUrl}?embed=true&sdk=true';
      iframe.width = options.width || '400px';
      iframe.height = options.height || '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '10px';
      iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      
      const container = document.querySelector(options.container);
      if (container) {
        container.appendChild(iframe);
      }
    }
  };
  
  // 使用示例
  // FastbuildAI.init({
  //   container: '#chatbot-container',
  //   width: '400px',
  //   height: '600px'
  // });
</script>`;
    }
}
