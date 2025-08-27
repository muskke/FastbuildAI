import { PaginationDto } from "@common/dto/pagination.dto";
import { Transform, Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";

import { ModelBillingConfig } from "../interfaces/agent-config.interface";

/**
 * 快捷指令配置DTO
 */
export class QuickCommandConfigDto {
    /**
     * 指令头像
     */
    @IsOptional()
    @IsString({ message: "指令头像必须是字符串" })
    avatar?: string;

    /**
     * 指令名称
     */
    @IsString({ message: "指令名称必须是字符串" })
    @IsNotEmpty({ message: "指令名称不能为空" })
    name: string;

    /**
     * 指令内容
     */
    @IsString({ message: "指令内容必须是字符串" })
    @IsNotEmpty({ message: "指令内容不能为空" })
    content: string;

    /**
     * 回复类型
     */
    @IsString({ message: "回复类型必须是字符串" })
    @IsNotEmpty({ message: "回复类型不能为空" })
    replyType: "custom" | "model";

    /**
     * 回复内容
     */
    @IsOptional()
    @IsString({ message: "回复内容必须是字符串" })
    replyContent?: string;
}

/**
 * 表单字段配置DTO
 */
export class FormFieldConfigDto {
    /**
     * 字段名
     */
    @IsString({ message: "字段名必须是字符串" })
    @IsNotEmpty({ message: "字段名不能为空" })
    name: string;

    /**
     * 字段标签
     */
    @IsString({ message: "字段标签必须是字符串" })
    @IsNotEmpty({ message: "字段标签不能为空" })
    label: string;

    /**
     * 字段类型
     */
    @IsString({ message: "字段类型必须是字符串" })
    @IsNotEmpty({ message: "字段类型不能为空" })
    type: "text" | "textarea" | "select";

    /**
     * 是否必填
     */
    @IsOptional()
    required?: boolean;

    /**
     * 选项列表（仅当type为select时使用）
     */
    @IsOptional()
    @IsArray({ message: "选项列表必须是数组" })
    options?:
        | string[]
        | Array<{
              label: string;
              value: string;
          }>;
}

/**
 * 智能体对话消息DTO
 */
export class AgentChatMessageDto {
    /**
     * 消息角色
     */
    @IsString({ message: "消息角色必须是字符串" })
    @IsNotEmpty({ message: "消息角色不能为空" })
    role: "user" | "assistant" | "system";

    /**
     * 消息内容
     */
    @IsString({ message: "消息内容必须是字符串" })
    content: string;
}

/**
 * 模型配置DTO
 */
export class ModelConfigDto {
    /**
     * 模型ID
     */
    @IsString({ message: "模型ID必须是字符串" })
    @IsNotEmpty({ message: "模型ID不能为空" })
    id: string;

    /**
     * 模型参数配置
     */
    @IsOptional()
    @IsObject({ message: "模型参数必须是对象" })
    options?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        stop?: string[];
        [key: string]: any;
    };
}

export class ModelBillingConfigDto {
    @IsOptional()
    @IsNumber()
    @IsNotEmpty({ message: "算力不能为空" })
    power: number;
}

/**
 * 自动追问配置DTO
 */
export class AutoQuestionsConfigDto {
    /**
     * 是否启用自动追问
     */
    @IsBoolean({ message: "启用状态必须是布尔值" })
    enabled: boolean;

    /**
     * 是否启用自定义规则
     */
    @IsBoolean({ message: "自定义规则启用状态必须是布尔值" })
    customRuleEnabled: boolean;

    /**
     * 自定义规则
     */
    @IsOptional()
    @IsString({ message: "自定义规则必须是字符串" })
    customRule?: string;
}

/**
 * 智能体配置基础DTO
 * 包含 UpdateAgentConfigDto 和 AgentChatDto 的共用字段
 */
export class AgentConfigBaseDto {
    /**
     * 角色设定
     */
    @IsOptional()
    @IsString({ message: "角色设定必须是字符串" })
    rolePrompt?: string;

    /**
     * 是否显示对话上下文
     */
    @IsOptional()
    @IsBoolean({ message: "显示对话上下文必须是布尔值" })
    showContext?: boolean;

    /**
     * 是否显示引用来源
     */
    @IsOptional()
    @IsBoolean({ message: "显示引用来源必须是布尔值" })
    showReference?: boolean;

    /**
     * 是否允许反馈
     */
    @IsOptional()
    @IsBoolean({ message: "允许反馈必须是布尔值" })
    enableFeedback?: boolean;

    /**
     * 是否开启联网搜索
     */
    @IsOptional()
    @IsBoolean({ message: "开启联网搜索必须是布尔值" })
    enableWebSearch?: boolean;

    /**
     * 模型配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelConfigDto)
    modelConfig?: ModelConfigDto;

    /**
     * 智能体计费配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelBillingConfigDto)
    billingConfig?: ModelBillingConfig;

    /**
     * 知识库ID列表
     */
    @IsOptional()
    @IsArray({ message: "知识库ID列表必须是数组" })
    @IsUUID(4, { each: true, message: "知识库ID必须是有效的UUID" })
    datasetIds?: string[];

    /**
     * 自动追问配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => AutoQuestionsConfigDto)
    autoQuestions?: AutoQuestionsConfigDto;

    /**
     * 快捷指令配置
     */
    @IsOptional()
    @IsArray({ message: "快捷指令必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => QuickCommandConfigDto)
    quickCommands?: QuickCommandConfigDto[];
}

/**
 * 创建智能体DTO
 * 只需要基本信息：名称、描述、头像
 */
export class CreateAgentDto {
    /**
     * 智能体名称
     */
    @IsNotEmpty({ message: "智能体名称不能为空" })
    @IsString({ message: "智能体名称必须是字符串" })
    name: string;

    /**
     * 智能体描述
     */
    @IsOptional()
    @IsString({ message: "智能体描述必须是字符串" })
    description?: string;

    /**
     * 智能体头像
     */
    @IsOptional()
    @IsString({ message: "智能体头像必须是字符串" })
    avatar?: string;
}

/**
 * 更新智能体配置DTO
 * 包含所有可配置的字段
 */
export class UpdateAgentConfigDto extends AgentConfigBaseDto {
    /**
     * 智能体名称
     */
    @IsOptional()
    @IsString({ message: "智能体名称必须是字符串" })
    name?: string;

    /**
     * 智能体描述
     */
    @IsOptional()
    @IsString({ message: "智能体描述必须是字符串" })
    description?: string;

    /**
     * 智能体头像
     */
    @IsOptional()
    @IsString({ message: "智能体头像必须是字符串" })
    avatar?: string;

    /**
     * 对话头像
     */
    @IsOptional()
    @IsString({ message: "对话头像必须是字符串" })
    chatAvatar?: string;

    /**
     * 开场白
     */
    @IsOptional()
    @IsString({ message: "开场白必须是字符串" })
    openingStatement?: string;

    /**
     * 开场问题配置
     */
    @IsOptional()
    @IsArray({ message: "开场问题必须是数组" })
    @IsString({ each: true, message: "开场问题必须是字符串" })
    openingQuestions?: string[];

    /**
     * 自动追问配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => AutoQuestionsConfigDto)
    autoQuestions?: AutoQuestionsConfigDto;

    /**
     * 表单字段配置
     */
    @IsOptional()
    @IsArray({ message: "表单字段配置必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => FormFieldConfigDto)
    formFields?: FormFieldConfigDto[];

    /**
     * 表单字段输入值（用于预览和测试）
     */
    @IsOptional()
    @IsObject({ message: "表单字段输入值必须是对象" })
    formFieldsInputs?: Record<string, any>;

    /**
     * 是否公开
     */
    @IsOptional()
    @IsBoolean({ message: "是否公开必须是布尔值" })
    isPublic?: boolean;
}

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
 * 智能体对话DTO
 */
export class AgentChatDto extends AgentConfigBaseDto {
    /**
     * 消息列表（标准AI对话格式）
     */
    @IsNotEmpty({ message: "消息列表不能为空" })
    @IsArray({ message: "消息必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => AgentChatMessageDto)
    messages: AgentChatMessageDto[];

    /**
     * 对话记录ID（可选，如果没有则创建新对话）
     */
    @IsOptional()
    @IsUUID(4, { message: "对话记录ID必须是有效的UUID" })
    conversationId?: string;

    /**
     * 表单变量（用于角色设定中的变量替换）
     */
    @IsOptional()
    @Type(() => Object)
    formVariables?: Record<string, string>;

    /**
     * 是否保存对话记录（默认为true）
     */
    @IsOptional()
    @IsBoolean({ message: "保存对话记录必须是布尔值" })
    saveConversation?: boolean;

    /**
     * 对话标题（创建新对话时使用）
     */
    @IsOptional()
    @IsString({ message: "对话标题必须是字符串" })
    title?: string;

    /**
     * 是否包含上下文
     */
    @IsOptional()
    @IsBoolean({ message: "包含上下文必须是布尔值" })
    includeContext?: boolean;

    /**
     * 是否返回引用来源
     */
    @IsOptional()
    @IsBoolean({ message: "返回引用来源必须是布尔值" })
    includeReferences?: boolean;

    /**
     * 是否生成自动追问
     */
    @IsOptional()
    @IsBoolean({ message: "生成自动追问必须是布尔值" })
    generateSuggestions?: boolean;

    /**
     * 模型配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelConfigDto)
    modelConfig?: ModelConfigDto;

    /**
     * 表单字段配置
     */
    @IsOptional()
    @IsArray({ message: "表单字段配置必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => FormFieldConfigDto)
    formFields?: FormFieldConfigDto[];

    /**
     * 表单字段输入值（用于预览和测试）
     */
    @IsOptional()
    @IsObject({ message: "表单字段输入值必须是对象" })
    formFieldsInputs?: Record<string, any>;
}

/**
 * 智能体对话响应DTO
 */
export interface AgentChatResponse {
    /**
     * 对话记录ID
     */
    conversationId: string;

    /**
     * AI回复内容
     */
    response: string;

    /**
     * 引用来源（如果启用）
     */
    referenceSources?: Array<{
        datasetId: string;
        datasetName: string;
        chunks: Array<{
            id: string;
            content: string;
            score: number;
            metadata?: Record<string, unknown>;
            fileName?: string;
            chunkIndex?: number;
        }>;
    }>;

    /**
     * 对话上下文（如果启用）
     */
    context?: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
    }>;

    /**
     * 自动追问建议（如果启用）
     */
    suggestions?: string[];

    /**
     * Token使用统计
     */
    tokenUsage?: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
    };

    /**
     * 响应时间（毫秒）
     */
    responseTime: number;

    /**
     * 标注命中信息（如果匹配到标注）
     */
    annotations?: {
        annotationId: string;
        question: string;
        similarity: number;
        createdBy: string;
    };
}

/**
 * 智能体对话测试DTO
 */
export class AgentChatTestDto {
    /**
     * 用户消息
     */
    @IsNotEmpty({ message: "用户消息不能为空" })
    @IsString({ message: "用户消息必须是字符串" })
    message: string;

    /**
     * 智能体配置（前端传入的临时配置用于测试）
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateAgentConfigDto)
    agentConfig?: UpdateAgentConfigDto;

    /**
     * 对话历史
     */
    @IsOptional()
    @IsArray({ message: "对话历史必须是数组" })
    history?: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
}

/**
 * 批量删除对话记录DTO
 */
export class BatchDeleteChatRecordDto {
    /**
     * 对话记录ID列表
     */
    @IsNotEmpty({ message: "对话记录ID列表不能为空" })
    @IsArray({ message: "对话记录ID列表必须是数组" })
    @IsUUID(4, { each: true, message: "对话记录ID必须是有效的UUID" })
    recordIds: string[];
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

/**
 * 发布配置DTO
 */
export class PublishConfigDto {
    /**
     * 允许的域名列表
     */
    @IsOptional()
    @IsArray({ message: "允许的域名必须是数组" })
    @IsString({ each: true, message: "域名必须是字符串" })
    allowOrigins?: string[];

    /**
     * 每分钟请求限制
     */
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    rateLimitPerMinute?: number;

    /**
     * 是否显示品牌信息
     */
    @IsOptional()
    @IsBoolean({ message: "显示品牌信息必须是布尔值" })
    showBranding?: boolean;

    /**
     * 是否允许下载历史记录
     */
    @IsOptional()
    @IsBoolean({ message: "允许下载历史记录必须是布尔值" })
    allowDownloadHistory?: boolean;
}

/**
 * 发布智能体DTO
 */
export class PublishAgentDto {
    /**
     * 发布配置
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => PublishConfigDto)
    publishConfig?: PublishConfigDto;
}

/**
 * 公开智能体信息响应DTO
 */
export class PublicAgentInfoDto {
    /**
     * 智能体ID
     */
    @IsUUID(4, { message: "智能体ID格式不正确" })
    id: string;

    /**
     * 智能体名称
     */
    @IsString({ message: "智能体名称必须是字符串" })
    name: string;

    /**
     * 智能体描述
     */
    @IsOptional()
    @IsString({ message: "智能体描述必须是字符串" })
    description?: string;

    /**
     * 智能体头像
     */
    @IsOptional()
    @IsString({ message: "智能体头像必须是字符串" })
    avatar?: string;

    /**
     * 对话头像
     */
    @IsOptional()
    @IsString({ message: "对话头像必须是字符串" })
    chatAvatar?: string;

    /**
     * 开场白
     */
    @IsOptional()
    @IsString({ message: "开场白必须是字符串" })
    openingStatement?: string;

    /**
     * 开场问题
     */
    @IsOptional()
    @IsArray({ message: "开场问题必须是数组" })
    @IsString({ each: true, message: "开场问题必须是字符串" })
    openingQuestions?: string[];

    /**
     * 表单字段配置
     */
    @IsOptional()
    @IsArray({ message: "表单字段配置必须是数组" })
    formFields?: any[];

    /**
     * 快捷指令
     */
    @IsOptional()
    @IsArray({ message: "快捷指令必须是数组" })
    quickCommands?: any[];

    /**
     * 发布配置
     */
    @IsOptional()
    @IsObject({ message: "发布配置必须是对象" })
    publishConfig?: PublishConfigDto;
}

/**
 * 公开对话DTO
 */
export class PublicAgentChatDto {
    /**
     * 消息列表（标准AI对话格式）
     */
    @IsNotEmpty({ message: "消息列表不能为空" })
    @IsArray({ message: "消息必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => AgentChatMessageDto)
    messages: AgentChatMessageDto[];

    /**
     * 对话ID（可选，用于继续对话）
     */
    @IsOptional()
    @IsUUID(4, { message: "对话ID格式不正确" })
    conversationId?: string;

    /**
     * 对话标题（可选）
     */
    @IsOptional()
    @IsString({ message: "对话标题必须是字符串" })
    title?: string;

    /**
     * 表单变量（可选）
     */
    @IsOptional()
    @IsObject({ message: "表单变量必须是对象" })
    formVariables?: Record<string, string>;

    /**
     * 表单字段输入值（可选）
     */
    @IsOptional()
    @IsObject({ message: "表单字段输入值必须是对象" })
    formFieldsInputs?: Record<string, any>;

    /**
     * 是否保存对话记录
     */
    @IsOptional()
    @IsBoolean({ message: "保存对话记录必须是布尔值" })
    saveConversation?: boolean = true;

    /**
     * 是否包含引用来源
     */
    @IsOptional()
    @IsBoolean({ message: "包含引用来源必须是布尔值" })
    includeReferences?: boolean;
}

/**
 * 导入智能体DTO
 */
export class ImportAgentDto extends UpdateAgentConfigDto {}

/**
 * V1 API 对话请求 DTO
 */
export class V1ChatDto {
    /**
     * 消息列表（标准AI对话格式）
     */
    @IsNotEmpty({ message: "消息列表不能为空" })
    @IsArray({ message: "消息必须是数组" })
    @ValidateNested({ each: true })
    @Type(() => AgentChatMessageDto)
    messages: AgentChatMessageDto[];

    /**
     * 响应模式
     * streaming: 流式模式（推荐）
     * blocking: 阻塞模式，等待执行完毕后返回结果
     */
    @IsOptional()
    @IsEnum(["streaming", "blocking"], { message: "响应模式必须是 streaming 或 blocking" })
    responseMode?: "streaming" | "blocking" = "streaming";
    /**
     * 对话ID（可选，用于继续对话）
     */
    @IsOptional()
    @IsString({ message: "对话ID必须是字符串" })
    conversationId?: string;

    /**
     * 对话标题（可选）
     */
    @IsOptional()
    @IsString({ message: "对话标题必须是字符串" })
    title?: string;

    /**
     * 表单变量（可选）
     */
    @IsOptional()
    @IsObject({ message: "表单变量必须是对象" })
    formVariables?: Record<string, string>;

    /**
     * 表单字段输入值（可选）
     */
    @IsOptional()
    @IsObject({ message: "表单字段输入值必须是对象" })
    formFieldsInputs?: Record<string, any>;

    /**
     * 是否保存对话记录
     */
    @IsOptional()
    @IsBoolean({ message: "保存对话记录必须是布尔值" })
    saveConversation?: boolean = true;

    /**
     * 是否包含引用来源
     */
    @IsOptional()
    @IsBoolean({ message: "包含引用来源必须是布尔值" })
    includeReferences?: boolean;
}
