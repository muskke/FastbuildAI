import { PaginationDto } from "@common/dto/pagination.dto";
import { isEnabled } from "@common/utils/is.util";
import { PartialType } from "@nestjs/mapped-types";
import { ModelType } from "@sdk/ai";
import { ModelFeatureType } from "@sdk/ai/interfaces/model-features";
import { Transform, Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator";

class BillingRuleDto {
    @IsInt({ message: "power 必须是整数" })
    @Min(0, { message: "power 不能小于 0" })
    power: number;

    @IsInt({ message: "tokens 必须是整数" })
    @Min(0, { message: "tokens 不能小于 0" })
    tokens: number;
}

/**
 * 创建AI模型DTO
 */
export class CreateAiModelDto {
    /**
     * 模型显示名称
     */
    @IsString({ message: "模型名称必须是字符串" })
    @IsNotEmpty({ message: "模型名称不能为空" })
    @MaxLength(100, { message: "模型名称长度不能超过100个字符" })
    name: string;

    /**
     * 供应商ID
     */
    @IsString({ message: "供应商ID必须是字符串" })
    @IsNotEmpty({ message: "供应商ID不能为空" })
    providerId: string;

    /**
     * 模型标识符
     */
    @IsString({ message: "模型标识符必须是字符串" })
    @IsNotEmpty({ message: "模型标识符不能为空" })
    @MaxLength(100, { message: "模型标识符长度不能超过100个字符" })
    model: string;

    /**
     * 最大上下文条数
     */
    @IsOptional()
    @Type(() => Number) // 确保转换为 Number
    @IsInt({ message: "最大上下文条数必须是整数" })
    @Min(1, { message: "最大上下文条数不能小于 1" })
    @Transform(({ value }) => (value === undefined ? 3 : value))
    maxContext?: number;

    /**
     * 模型能力
     */
    @IsArray({ message: "模型能力必须是数组" })
    @IsOptional()
    @Type(() => String)
    @IsString({ each: true, message: "模型能力必须是字符串数组" })
    features?: ModelFeatureType[];

    /**
     * 模型类型
     */
    @IsString({ message: "模型类型必须是字符串" })
    @IsOptional()
    modelType?: ModelType;

    /**
     * 模型特定配置
     */
    @IsObject({ message: "模型配置必须是对象" })
    @IsOptional()
    @Transform(({ value }) => value || {})
    modelConfig?: Record<string, any>;

    /**
     * 模型定价信息
     */
    @ValidateNested()
    @Type(() => BillingRuleDto)
    billingRule: BillingRuleDto;

    /**
     * 是否启用该模型
     */
    @IsBoolean({ message: "启用状态必须是布尔值" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? isEnabled(value) : true))
    isActive?: boolean;

    /**
     * 是否为默认模型
     */
    @IsBoolean({ message: "默认模型标识必须是布尔值" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? value : false))
    isDefault?: boolean;

    /**
     * 模型描述
     */
    @IsString({ message: "模型描述必须是字符串" })
    @IsOptional()
    @MaxLength(500, { message: "模型描述长度不能超过500个字符" })
    description?: string;

    /**
     * 排序权重
     */
    @IsInt({ message: "排序权重必须是整数" })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value !== undefined ? value : 0))
    sortOrder?: number;
}

/**
 * 更新AI模型DTO
 */
export class UpdateAiModelDto extends PartialType(CreateAiModelDto) {}

/**
 * AI模型查询DTO
 */
export class QueryAiModelDto extends PaginationDto {
    /**
     * 供应商ID筛选
     */
    @IsString({ message: "供应商ID必须是字符串" })
    @IsOptional()
    providerId?: string;

    /**
     * 是否启用
     */
    @IsBoolean({ message: "启用状态必须是布尔值" })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return value;
        return isEnabled(value);
    })
    isActive?: boolean;

    /**
     * 模型类型筛选
     */
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @IsArray({ message: "模型类型必须是数组" })
    @Type(() => String)
    @IsString({ each: true, message: "模型类型必须是字符串数组" })
    modelType?: ModelType[];

    /**
     * 搜索关键词（名称或描述）
     */
    @IsString({ message: "搜索关键词必须是字符串" })
    @IsOptional()
    keyword?: string;
}
