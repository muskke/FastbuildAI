import { PaginationDto } from "@common/dto/pagination.dto";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { AnnotationReviewStatus } from "../entities/agent-annotation.entity";

/**
 * 创建标注DTO
 */
export class CreateAgentAnnotationDto {
    /**
     * 智能体ID
     */
    @IsNotEmpty({ message: "智能体ID不能为空" })
    @IsUUID("4", { message: "智能体ID格式不正确" })
    agentId: string;

    /**
     * 提问内容
     */
    @IsNotEmpty({ message: "提问内容不能为空" })
    @IsString({ message: "提问内容必须是字符串" })
    question: string;

    /**
     * 答案内容
     */
    @IsNotEmpty({ message: "答案内容不能为空" })
    @IsString({ message: "答案内容必须是字符串" })
    answer: string;

    /**
     * 是否启用
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
    enabled?: boolean = true;

    /**
     * 关联的对话消息ID
     */
    @IsOptional()
    @IsUUID("4", { message: "消息ID格式不正确" })
    messageId?: string;
}

/**
 * 更新标注DTO
 */
export class UpdateAgentAnnotationDto {
    /**
     * 提问内容
     */
    @IsOptional()
    @IsString({ message: "提问内容必须是字符串" })
    question?: string;

    /**
     * 答案内容
     */
    @IsOptional()
    @IsString({ message: "答案内容必须是字符串" })
    answer?: string;

    /**
     * 是否启用
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
    enabled?: boolean;

    /**
     * 关联的对话消息ID
     */
    @IsOptional()
    @IsUUID("4", { message: "消息ID格式不正确" })
    messageId?: string;
}

/**
 * 标注查询DTO
 */
export class QueryAgentAnnotationDto extends PaginationDto {
    /**
     * 智能体ID
     */
    @IsOptional()
    @IsUUID(4, { message: "智能体ID必须是有效的UUID" })
    agentId?: string;

    /**
     * 提问内容关键词
     */
    @IsOptional()
    @IsString({ message: "关键词必须是字符串" })
    keyword?: string;

    /**
     * 是否启用
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    @Transform(({ value }) => value === true || value === "true" || value === 1 || value === "1")
    enabled?: boolean;

    /**
     * 审核状态
     */
    @IsOptional()
    @IsEnum(AnnotationReviewStatus, { message: "审核状态必须是有效的枚举值" })
    reviewStatus?: AnnotationReviewStatus;
}

/**
 * 标注响应DTO
 */
export class AgentAnnotationResponseDto {
    /**
     * 标注ID
     */
    id: string;

    /**
     * 智能体ID
     */
    agentId: string;

    /**
     * 提问内容
     */
    question: string;

    /**
     * 答案内容
     */
    answer: string;

    /**
     * 命中次数
     */
    hitCount: number;

    /**
     * 是否启用
     */
    enabled: boolean;

    /**
     * 审核状态
     */
    reviewStatus: AnnotationReviewStatus;

    /**
     * 审核人ID
     */
    reviewedBy?: string;

    /**
     * 审核时间
     */
    reviewedAt?: Date;

    /**
     * 创建时间
     */
    createdAt: Date;

    /**
     * 更新时间
     */
    updatedAt: Date;

    /**
     * 创建者ID
     */
    createdBy: string;
}

/**
 * 审核标注DTO
 */
export class ReviewAnnotationDto {
    /**
     * 审核状态
     */
    @IsNotEmpty({ message: "审核状态不能为空" })
    @IsEnum(AnnotationReviewStatus, { message: "审核状态必须是有效的枚举值" })
    reviewStatus: AnnotationReviewStatus;
}
