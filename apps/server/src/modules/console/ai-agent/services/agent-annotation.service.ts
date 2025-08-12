import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
    CreateAgentAnnotationDto,
    QueryAgentAnnotationDto,
    ReviewAnnotationDto,
    UpdateAgentAnnotationDto,
} from "../dto/agent-annotation.dto";
import { AgentAnnotation, AnnotationReviewStatus } from "../entities/agent-annotation.entity";
import { AgentChatMessage } from "../entities/agent-chat-message.entity";

export interface AnnotationMatchResult {
    matched: boolean;
    annotation?: AgentAnnotation;
    similarity?: number;
}

@Injectable()
export class AgentAnnotationService extends BaseService<AgentAnnotation> {
    protected readonly logger = new Logger(AgentAnnotationService.name);

    constructor(
        @InjectRepository(AgentAnnotation)
        private readonly annotationRepository: Repository<AgentAnnotation>,
        @InjectRepository(AgentChatMessage)
        private readonly chatMessageRepository: Repository<AgentChatMessage>,
    ) {
        super(annotationRepository);
    }

    /**
     * 判断是否是匿名用户
     */
    private isAnonymousUser(user: UserPlayground): boolean {
        return (
            // 1. 固定的anonymous标识
            user.id === "anonymous" ||
            // 2. 新的匿名用户格式（anonymous_timestamp_random）
            user.id?.startsWith("anonymous_") ||
            // 3. 基于访问令牌的用户名
            user.username?.startsWith("anonymous") ||
            user.username?.startsWith("access_") ||
            // 4. UUID格式的匿名用户（来自访问令牌生成）
            (user.id?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/) !==
                null &&
                !user.username?.match(/^[a-zA-Z0-9_]+$/)) // 排除真实注册用户
        );
    }

    /**
     * 创建标注
     */
    async createAnnotation(
        agentId: string,
        dto: CreateAgentAnnotationDto,
        user: UserPlayground,
    ): Promise<AgentAnnotation> {
        // 检查是否已存在相同的问题
        const existing = await this.annotationRepository.findOne({
            where: {
                agentId,
                question: dto.question,
                enabled: true,
                reviewStatus: AnnotationReviewStatus.APPROVED, // 只检查已通过审核的标注
            },
        });

        if (existing) {
            throw HttpExceptionFactory.badRequest("该问题已存在标注");
        }

        // 判断用户类型，设置不同的初始审核状态
        const isAnonymous = this.isAnonymousUser(user);
        const initialReviewStatus = isAnonymous
            ? AnnotationReviewStatus.PENDING
            : AnnotationReviewStatus.APPROVED;

        const annotation = this.annotationRepository.create({
            agentId,
            question: dto.question.trim(),
            answer: dto.answer.trim(),
            enabled: dto.enabled ?? true,
            reviewStatus: initialReviewStatus,
            createdBy: isAnonymous ? null : user.id,
            anonymousIdentifier: isAnonymous ? user.id : null,
        });

        const saved = await this.annotationRepository.save(annotation);

        this.logger.log(
            `[标注] 创建成功: ${dto.question} - 状态: ${initialReviewStatus} - 用户类型: ${isAnonymous ? "匿名" : "注册"}`,
        );

        // 如果有 messageId，更新对话消息的metadata
        if (dto.messageId) {
            await this.updateMessageAnnotation(dto.messageId, saved.id, user);
        }

        return saved;
    }

    /**
     * 更新标注
     */
    async updateAnnotation(
        id: string,
        dto: UpdateAgentAnnotationDto,
        user: UserPlayground,
    ): Promise<AgentAnnotation> {
        const annotation = await this.annotationRepository.findOne({
            where: { id },
        });

        if (!annotation) {
            throw HttpExceptionFactory.notFound("标注不存在");
        }

        // 判断用户类型，设置不同的审核状态
        const isAnonymous = this.isAnonymousUser(user);

        // 如果是匿名用户编辑，需要重新审核
        if (isAnonymous) {
            annotation.reviewStatus = AnnotationReviewStatus.PENDING;
            annotation.reviewedBy = null;
            annotation.reviewedAt = null;
        }
        // 注册用户编辑：如果当前是已通过状态，保持已通过；如果是未审核状态，保持未审核
        else if (annotation.reviewStatus === AnnotationReviewStatus.REJECTED) {
            // 如果当前是已拒绝状态，注册用户编辑后设为已通过
            annotation.reviewStatus = AnnotationReviewStatus.APPROVED;
        }

        // 更新字段
        if (dto.question !== undefined) {
            annotation.question = dto.question.trim();
        }
        if (dto.answer !== undefined) {
            annotation.answer = dto.answer.trim();
        }
        if (dto.enabled !== undefined) {
            annotation.enabled = dto.enabled;
        }

        const saved = await this.annotationRepository.save(annotation);

        this.logger.log(
            `[标注] 更新成功: ${id} - 状态: ${annotation.reviewStatus} - 用户类型: ${isAnonymous ? "匿名" : "注册"}`,
        );

        // 如果有 messageId，更新对话消息的metadata
        if (dto.messageId) {
            await this.updateMessageAnnotation(dto.messageId, saved.id, user);
        }

        return saved;
    }

    /**
     * 删除标注
     */
    async deleteAnnotation(id: string): Promise<void> {
        // 先获取标注信息，检查是否存在
        const annotation = await this.annotationRepository.findOne({ where: { id } });
        if (!annotation) {
            throw HttpExceptionFactory.notFound("标注不存在");
        }

        // 清理所有关联的对话消息的标注metadata
        await this.removeAnnotationFromMessages(id);

        // 删除标注
        const result = await this.annotationRepository.delete(id);
        this.logger.log(`[标注] 删除成功: ${id}`);
    }

    /**
     * 审核标注
     */
    async reviewAnnotation(
        id: string,
        dto: ReviewAnnotationDto,
        user: UserPlayground,
    ): Promise<AgentAnnotation> {
        const annotation = await this.annotationRepository.findOne({
            where: { id },
            relations: ["user"],
        });

        if (!annotation) {
            throw HttpExceptionFactory.notFound("标注不存在");
        }

        // 只有待审核状态的标注可以被审核
        if (annotation.reviewStatus !== AnnotationReviewStatus.PENDING) {
            throw HttpExceptionFactory.badRequest("只有待审核状态的标注可以被审核");
        }

        // 更新审核信息
        annotation.reviewStatus = dto.reviewStatus;
        annotation.reviewedBy = user.id;
        annotation.reviewedAt = new Date();

        const saved = await this.annotationRepository.save(annotation);

        this.logger.log(
            `[标注审核] 标注ID: ${id} - 状态: ${dto.reviewStatus} - 审核人: ${user.username || user.id}`,
        );

        return saved;
    }

    /**
     * 获取智能体标注列表（支持审核状态过滤）
     */
    async getAgentAnnotations(
        agentId: string,
        query?: QueryAgentAnnotationDto,
    ): Promise<{ items: AgentAnnotation[]; total: number; page: number; pageSize: number }> {
        const queryBuilder = this.annotationRepository.createQueryBuilder("annotation");

        // 关联用户信息
        queryBuilder.leftJoinAndSelect("annotation.user", "user");
        queryBuilder.leftJoinAndSelect("annotation.reviewer", "reviewer");

        // 基础条件
        queryBuilder.where("annotation.agentId = :agentId", { agentId });

        // 关键词搜索
        if (query?.keyword) {
            queryBuilder.andWhere(
                "(annotation.question ILIKE :keyword OR annotation.answer ILIKE :keyword)",
                { keyword: `%${query.keyword}%` },
            );
        }

        // 启用状态过滤
        if (query?.enabled !== undefined) {
            queryBuilder.andWhere("annotation.enabled = :enabled", { enabled: query.enabled });
        }

        // 审核状态过滤
        if (query?.reviewStatus) {
            queryBuilder.andWhere("annotation.reviewStatus = :reviewStatus", {
                reviewStatus: query.reviewStatus,
            });
        }

        // 排序
        queryBuilder.orderBy("annotation.createdAt", "DESC");

        const result = await this.paginateQueryBuilder(queryBuilder, query || {});

        return {
            items: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
        };
    }

    /**
     * 智能匹配用户问题
     * 1. 精确匹配（忽略大小写和空格）
     * 2. 包含匹配（用户问题包含标注问题或相反，相似度>0.6）
     */
    async matchUserQuestion(agentId: string, userQuestion: string): Promise<AnnotationMatchResult> {
        const cleanQuestion = userQuestion.trim().toLowerCase();

        // 获取该智能体的所有启用且已审核通过的标注，关联用户信息
        const annotations = await this.annotationRepository.find({
            where: {
                agentId,
                enabled: true,
                reviewStatus: AnnotationReviewStatus.APPROVED, // 只匹配已审核通过的标注
            },
            relations: ["user"], // 关联用户信息
            order: { hitCount: "DESC" }, // 按命中次数排序，优先匹配热门问题
        });

        if (annotations.length === 0) {
            return { matched: false };
        }

        // 1. 精确匹配（忽略大小写和空格）
        for (const annotation of annotations) {
            const cleanAnnotationQuestion = annotation.question.trim().toLowerCase();
            if (cleanQuestion === cleanAnnotationQuestion) {
                await this.incrementHitCount(annotation.id);
                this.logger.log(
                    `[标注匹配] 精确匹配: "${userQuestion}" -> "${annotation.question}"`,
                );
                return { matched: true, annotation, similarity: 1.0 };
            }
        }

        // 2. 包含匹配（用户问题包含标注问题或相反）
        for (const annotation of annotations) {
            const cleanAnnotationQuestion = annotation.question.trim().toLowerCase();
            if (
                cleanQuestion.includes(cleanAnnotationQuestion) ||
                cleanAnnotationQuestion.includes(cleanQuestion)
            ) {
                // 计算相似度（简单的字符串包含比例）
                const similarity =
                    Math.min(cleanQuestion.length, cleanAnnotationQuestion.length) /
                    Math.max(cleanQuestion.length, cleanAnnotationQuestion.length);

                if (similarity > 0.6) {
                    // 相似度阈值
                    await this.incrementHitCount(annotation.id);
                    this.logger.log(
                        `[标注匹配] 包含匹配: "${userQuestion}" -> "${annotation.question}", 相似度: ${similarity.toFixed(2)}`,
                    );
                    return { matched: true, annotation, similarity };
                }
            }
        }

        this.logger.debug(`[标注匹配] 无匹配结果: "${userQuestion}"`);
        return { matched: false };
    }

    /**
     * 增加命中次数
     */
    private async incrementHitCount(annotationId: string): Promise<void> {
        await this.annotationRepository.increment({ id: annotationId }, "hitCount", 1);
    }

    /**
     * 获取标注详情
     */
    async getAnnotationById(id: string): Promise<AgentAnnotation> {
        const annotation = await this.annotationRepository.findOne({ where: { id } });
        if (!annotation) {
            throw HttpExceptionFactory.notFound("标注不存在");
        }
        return annotation;
    }

    /**
     * 批量删除标注
     */
    async batchDeleteAnnotations(ids: string[]): Promise<void> {
        // 清理所有关联的对话消息的标注metadata
        for (const id of ids) {
            await this.removeAnnotationFromMessages(id);
        }

        // 批量删除标注
        const result = await this.annotationRepository.delete(ids);
        this.logger.log(`[标注] 批量删除成功: ${result.affected}条`);
    }

    /**
     * 更新对话消息的标注metadata
     */
    private async updateMessageAnnotation(
        messageId: string,
        annotationId: string,
        user: UserPlayground,
    ): Promise<void> {
        try {
            const message = await this.chatMessageRepository.findOne({
                where: { id: messageId },
            });

            if (!message) {
                this.logger.warn(`[标注] 消息不存在: ${messageId}`);
                return;
            }

            // 获取标注信息
            const annotation = await this.annotationRepository.findOne({
                where: { id: annotationId },
                relations: ["user"],
            });

            if (!annotation) {
                this.logger.warn(`[标注] 标注不存在: ${annotationId}`);
                return;
            }

            // 更新消息的metadata
            const metadata = message.metadata || {};
            metadata.annotations = {
                annotationId: annotation.id,
                question: annotation.question,
                similarity: 1.0, // 手动标注的相似度为1
                createdBy: annotation.user?.nickname || annotation.user?.username || "未知用户",
            };

            await this.chatMessageRepository.update({ id: messageId }, { metadata });

            this.logger.log(
                `[标注] 更新消息标注成功: messageId=${messageId}, annotationId=${annotationId}`,
            );
        } catch (error) {
            this.logger.error(`[标注] 更新消息标注失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 从所有关联的对话消息中移除标注metadata
     */
    private async removeAnnotationFromMessages(annotationId: string): Promise<void> {
        try {
            // 查询所有可能包含该标注的消息（这里可以根据实际需要优化查询条件）
            const messages = await this.chatMessageRepository
                .createQueryBuilder("message")
                .where("message.metadata->'annotations'->>'annotationId' = :annotationId", {
                    annotationId,
                })
                .getMany();

            for (const message of messages) {
                const metadata = message.metadata || {};
                if (
                    metadata.annotations &&
                    (metadata.annotations as any).annotationId === annotationId
                ) {
                    delete metadata.annotations;
                    await this.chatMessageRepository.update({ id: message.id }, { metadata });
                    this.logger.log(
                        `[标注] 清理消息标注: messageId=${message.id}, annotationId=${annotationId}`,
                    );
                }
            }

            this.logger.log(`[标注] 清理完成，共处理 ${messages.length} 条消息`);
        } catch (error) {
            this.logger.error(`[标注] 清理消息标注失败: ${error.message}`, error.stack);
        }
    }
}
