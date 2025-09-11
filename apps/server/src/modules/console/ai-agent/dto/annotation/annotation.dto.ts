import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";

import { AnnotationReviewStatus } from "../../entities/agent-annotation.entity";

/**
 * 标注基础信息 DTO
 */
export class AnnotationBaseDto {
    /**
     * 标注问题
     */
    @IsNotEmpty({ message: "标注问题不能为空" })
    @IsString({ message: "标注问题必须是字符串" })
    question: string;

    /**
     * 标注答案
     */
    @IsNotEmpty({ message: "标注答案不能为空" })
    @IsString({ message: "标注答案必须是字符串" })
    answer: string;

    /**
     * 标注分类
     */
    @IsOptional()
    @IsString({ message: "标注分类必须是字符串" })
    category?: string;

    /**
     * 标注标签
     */
    @IsOptional()
    @IsArray({ message: "标注标签必须是数组" })
    @IsString({ each: true, message: "标签必须是字符串" })
    tags?: string[];

    /**
     * 优先级
     */
    @IsOptional()
    @IsNumber({}, { message: "优先级必须是数字" })
    priority?: number = 0;

    /**
     * 是否启用
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    enabled?: boolean = true;
}

/**
 * 创建标注 DTO
 */
export class CreateAnnotationDto extends AnnotationBaseDto {
    /**
     * 智能体ID
     */
    @IsNotEmpty({ message: "智能体ID不能为空" })
    @IsUUID(4, { message: "智能体ID必须是有效的UUID" })
    agentId: string;

    /**
     * 创建者ID
     */
    @IsOptional()
    @IsUUID(4, { message: "创建者ID必须是有效的UUID" })
    createBy?: string;
}

/**
 * 更新标注 DTO
 */
export class UpdateAnnotationDto extends AnnotationBaseDto {
    /**
     * 标注ID
     */
    @IsNotEmpty({ message: "标注ID不能为空" })
    @IsUUID(4, { message: "标注ID必须是有效的UUID" })
    id: string;
}

/**
 * 查询标注 DTO
 */
export class QueryAnnotationDto {
    /**
     * 页码
     */
    @IsOptional()
    page?: number = 1;

    /**
     * 每页数量
     */
    @IsOptional()
    limit?: number = 10;

    /**
     * 智能体ID
     */
    @IsOptional()
    @IsUUID(4, { message: "智能体ID必须是有效的UUID" })
    agentId?: string;

    /**
     * 搜索关键词
     */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;

    /**
     * 分类筛选
     */
    @IsOptional()
    @IsString({ message: "分类必须是字符串" })
    category?: string;

    /**
     * 标签筛选
     */
    @IsOptional()
    @IsString({ message: "标签必须是字符串" })
    tag?: string;

    /**
     * 是否启用筛选
     */
    @IsOptional()
    @IsBoolean({ message: "是否启用必须是布尔值" })
    enabled?: boolean;

    /**
     * 排序方式
     */
    @IsOptional()
    @IsString({ message: "排序方式必须是字符串" })
    sortBy?: "priority" | "createdAt" | "updatedAt";
}

/**
 * 标注响应 DTO
 */
export class AnnotationResponseDto {
    /**
     * 标注ID
     */
    id: string;

    /**
     * 智能体ID
     */
    agentId: string;

    /**
     * 标注问题
     */
    question: string;

    /**
     * 标注答案
     */
    answer: string;

    /**
     * 标注分类
     */
    category?: string;

    /**
     * 标注标签
     */
    tags?: string[];

    /**
     * 优先级
     */
    priority: number;

    /**
     * 是否启用
     */
    enabled: boolean;

    /**
     * 匹配次数
     */
    matchCount: number;

    /**
     * 最后匹配时间
     */
    lastMatchedAt?: Date;

    /**
     * 创建者ID
     */
    createBy: string;

    /**
     * 创建时间
     */
    createdAt: Date;

    /**
     * 更新时间
     */
    updatedAt: Date;
}

/**
 * 批量操作标注 DTO
 */
export class BatchAnnotationDto {
    /**
     * 标注ID列表
     */
    @IsNotEmpty({ message: "标注ID列表不能为空" })
    @IsArray({ message: "标注ID列表必须是数组" })
    @IsUUID(4, { each: true, message: "标注ID必须是有效的UUID" })
    annotationIds: string[];

    /**
     * 操作类型
     */
    @IsNotEmpty({ message: "操作类型不能为空" })
    @IsString({ message: "操作类型必须是字符串" })
    action: "enable" | "disable" | "delete" | "updatePriority";

    /**
     * 优先级（仅当操作类型为 updatePriority 时使用）
     */
    @IsOptional()
    @IsNumber({}, { message: "优先级必须是数字" })
    priority?: number;
}

/**
 * 标注匹配结果 DTO
 */
export class AnnotationMatchDto {
    /**
     * 标注ID
     */
    annotationId: string;

    /**
     * 匹配问题
     */
    question: string;

    /**
     * 匹配答案
     */
    answer: string;

    /**
     * 相似度分数
     */
    similarity: number;

    /**
     * 匹配类型
     */
    matchType: "exact" | "fuzzy" | "semantic";

    /**
     * 匹配位置
     */
    matchPosition?: {
        start: number;
        end: number;
    };
}

/**
 * 标注统计 DTO
 */
export class AnnotationStatisticsDto {
    /**
     * 总标注数量
     */
    totalCount: number;

    /**
     * 启用标注数量
     */
    enabledCount: number;

    /**
     * 禁用标注数量
     */
    disabledCount: number;

    /**
     * 按分类统计
     */
    categoryStats: Array<{
        category: string;
        count: number;
    }>;

    /**
     * 按标签统计
     */
    tagStats: Array<{
        tag: string;
        count: number;
    }>;

    /**
     * 最近匹配的标注
     */
    recentMatches: Array<{
        annotationId: string;
        question: string;
        matchCount: number;
        lastMatchedAt: Date;
    }>;
}

/**
 * 创建智能体标注 DTO（别名）
 */
export class CreateAgentAnnotationDto extends CreateAnnotationDto {
    /**
     * 消息ID（可选，用于关联特定消息）
     */
    @IsOptional()
    @IsUUID(4, { message: "消息ID必须是有效的UUID" })
    messageId?: string;
}

/**
 * 查询智能体标注 DTO（别名）
 */
export class QueryAgentAnnotationDto extends QueryAnnotationDto {
    /**
     * 审核状态筛选
     */
    @IsOptional()
    @IsEnum(AnnotationReviewStatus, {
        message: "审核状态必须是 pending、approved 或 rejected",
    })
    reviewStatus?: AnnotationReviewStatus;
}

/**
 * 更新智能体标注 DTO（别名）
 */
export class UpdateAgentAnnotationDto extends UpdateAnnotationDto {
    /**
     * 消息ID（可选，用于关联特定消息）
     */
    @IsOptional()
    @IsUUID(4, { message: "消息ID必须是有效的UUID" })
    messageId?: string;
}

/**
 * 审核标注 DTO
 */
export class ReviewAnnotationDto {
    /**
     * 标注ID
     */
    @IsNotEmpty({ message: "标注ID不能为空" })
    @IsUUID(4, { message: "标注ID必须是有效的UUID" })
    id: string;

    /**
     * 审核状态
     */
    @IsNotEmpty({ message: "审核状态不能为空" })
    @IsEnum(AnnotationReviewStatus, {
        message: "审核状态必须是 pending、approved 或 rejected",
    })
    status: AnnotationReviewStatus;

    /**
     * 审核状态（别名，兼容旧代码）
     */
    @IsOptional()
    @IsEnum(AnnotationReviewStatus, {
        message: "审核状态必须是 pending、approved 或 rejected",
    })
    reviewStatus?: AnnotationReviewStatus;

    /**
     * 审核备注
     */
    @IsOptional()
    @IsString({ message: "审核备注必须是字符串" })
    reviewNote?: string;

    /**
     * 审核者ID
     */
    @IsOptional()
    @IsUUID(4, { message: "审核者ID必须是有效的UUID" })
    reviewerId?: string;
}
