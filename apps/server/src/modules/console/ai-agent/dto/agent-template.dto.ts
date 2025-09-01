import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * 智能体模板配置接口
 */
export interface AgentTemplateConfig {
    /** 角色设定 */
    rolePrompt?: string;
    /** 是否显示对话上下文 */
    showContext?: boolean;
    /** 是否显示引用来源 */
    showReference?: boolean;
    /** 是否允许反馈 */
    enableFeedback?: boolean;
    /** 是否开启联网搜索 */
    enableWebSearch?: boolean;
    /** 开场白 */
    openingStatement?: string;
    /** 开场问题 */
    openingQuestions?: string[];
    /** 快捷指令配置 */
    quickCommands?: Array<{ command: string; description: string }>;
    /** 自动追问配置 */
    autoQuestions?: Record<string, unknown>;
    /** 表单字段配置 */
    formFields?: Record<string, unknown>[];
    /** 模型配置 */
    modelConfig?: Record<string, unknown>;
    /** 知识库ID列表 */
    datasetIds?: string[];
}

/**
 * 智能体模板信息DTO
 */
export class AgentTemplateDto {
    /** 模板ID */
    id: string;

    /** 模板名称 */
    name: string;

    /** 模板描述 */
    description?: string;

    /** 模板头像 */
    avatar?: string;

    /** 模板分类 */
    categories?: string;

    /** 是否推荐 */
    isRecommended?: boolean;

    /** 其他配置（包含所有 AgentTemplateConfig 属性） */
    [key: string]: any;
}

/**
 * 从模板创建智能体DTO
 */
export class CreateAgentFromTemplateDto {
    /** 模板ID */
    @IsNotEmpty({ message: "模板ID不能为空" })
    @IsString({ message: "模板ID必须是字符串" })
    templateId: string;

    /** 智能体名称 */
    @IsNotEmpty({ message: "智能体名称不能为空" })
    @IsString({ message: "智能体名称必须是字符串" })
    name: string;

    /** 智能体描述 */
    @IsOptional()
    @IsString({ message: "智能体描述必须是字符串" })
    description?: string;

    /** 智能体头像 */
    @IsOptional()
    @IsString({ message: "智能体头像必须是字符串" })
    avatar?: string;

    /** 创建者ID */
    @IsOptional()
    @IsString({ message: "创建者ID必须是字符串" })
    createBy?: string;

    /** 自定义配置覆盖 */
    customConfig?: Partial<AgentTemplateConfig>;
}

/**
 * 查询模板列表DTO
 */
export class QueryTemplateDto {
    /** 搜索关键词 */
    @IsOptional()
    @IsString({ message: "搜索关键词必须是字符串" })
    keyword?: string;

    /** 分类筛选 */
    @IsOptional()
    @IsString({ message: "分类必须是字符串" })
    categories?: string;

    /** 标签筛选 */
    @IsOptional()
    @IsArray({ message: "标签必须是数组" })
    @IsString({ each: true, message: "标签必须是字符串" })
    tags?: string[];

    /** 是否只显示推荐模板 */
    @IsOptional()
    @IsBoolean({ message: "是否推荐必须是布尔值" })
    recommended?: boolean;

    /** 排序方式 */
    @IsOptional()
    @IsString({ message: "排序方式必须是字符串" })
    sortBy?: "name" | "usageCount" | "rating" | "createdAt";

    /** 排序顺序 */
    @IsOptional()
    @IsString({ message: "排序顺序必须是字符串" })
    sortOrder?: "asc" | "desc";
}
