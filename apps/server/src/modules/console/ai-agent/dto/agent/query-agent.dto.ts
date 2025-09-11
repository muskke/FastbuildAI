import { PaginationDto } from "@common/dto/pagination.dto";
import { Transform } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";

/**
 * 查询智能体DTO
 */
export class QueryAgentDto extends PaginationDto {
    /**
     * 搜索关键词（名称、描述）
     */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;

    /**
     * 是否公开筛选
     */
    @IsOptional()
    @Transform(({ value }) => value === "true")
    @IsBoolean({ message: "是否公开必须是布尔值" })
    isPublic?: boolean;

    /**
     * 排序方式
     */
    @IsOptional()
    @IsEnum(["popular", "latest"], { message: "排序方式必须是 popular 或 latest" })
    sortBy?: "popular" | "latest";
}

/**
 * 查询智能体对话记录DTO
 */
export class QueryAgentChatRecordDto extends PaginationDto {
    /**
     * 智能体ID
     */
    @IsNotEmpty({ message: "智能体ID不能为空" })
    @IsUUID(4, { message: "智能体ID必须是有效的UUID" })
    agentId: string;

    /**
     * 搜索关键词（标题、摘要）
     */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;
}

/**
 * 查询智能体统计数据DTO
 */
export class QueryAgentStatisticsDto {
    /**
     * 开始时间（可选，ISO 8601格式）
     */
    @IsOptional()
    @IsString({ message: "开始时间必须是字符串" })
    startDate?: string;

    /**
     * 结束时间（可选，ISO 8601格式）
     */
    @IsOptional()
    @IsString({ message: "结束时间必须是字符串" })
    endDate?: string;
}
