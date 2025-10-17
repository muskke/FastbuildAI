/**
 * AI提供商管理相关类型定义
 *
 * @description 定义AI提供商管理相关的数据结构和请求参数接口
 * @author BuildingAI
 */

/**
 * AI供应商信息接口
 */
export interface AiProviderInfo {
    /** 供应商ID */
    id: string;
    /** 供应商标识符 */
    provider: string;
    /** 供应商名称 */
    name: string;
    /** API密钥 */
    apiKey: string;
    /** 基础URL */
    baseUrl: string;
    /** 图标URL */
    iconUrl?: string;
    /** 官网URL */
    websiteUrl?: string;
    /** 描述信息 */
    description?: string;
    /** 全局配置 */
    modelConfig?: modelConfigItem[];
    /** 是否启用 */
    isActive: boolean;
    /** 排序顺序 */
    sortOrder: number;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    supportedModelTypes: string[];
    /** 是否为内置供应商 */
    isBuiltIn: boolean;
    /** 模型 */
    models: modelConfigItem[];
}

/**
 * 创建供应商请求参数
 */
export interface CreateAiProviderRequest {
    /** 供应商标识符 */
    provider: string;
    /** 供应商名称 */
    name: string;
    /** API密钥 */
    bindKeyConfigId: string;
    /** 图标URL */
    iconUrl?: string;
    /** 官网URL */
    websiteUrl?: string;
    /** 描述信息 */
    description?: string;
    /** 是否启用 */
    isActive?: boolean;
    /** 排序顺序 */
    sortOrder?: number;
    /** 支持的模型类型 */
    supportedModelTypes?: string[];
}

/**
 * 更新供应商请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface UpdateAiProviderRequest extends Partial<CreateAiProviderRequest> {}

/**
 * 供应商查询参数 - 继承基础分页参数
 */
export interface AiProviderQueryParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 是否启用 */
    isActive?: boolean;
}

/**
 * AI模型查询请求参数 - 继承基础分页参数
 */
export interface AiModelQueryRequest extends Pagination {
    /** 关键词搜索（模型名称、描述） */
    keyword?: string;
    /** 供应商ID筛选 */
    providerId?: string;
    /** 是否启用筛选 */
    isActive?: boolean;
    /** 是否默认模型筛选 */
    isDefault?: boolean;
    /** 模型能力筛选 */
    capability?: string;
    /** 模型类型筛选 */
    modelType?: string[];
}

/**
 * 全局配置参数项接口
 */
export interface modelConfigItem {
    /** 参数字段名 */
    field: string;
    /** 参数标题 */
    title: string;
    /** 参数描述 */
    description: string;
    /** 参数值 */
    value: any;
    /** 是否启用 */
    enable: boolean;
}

/**
 * 模型参数配置项接口
 */
export interface ModelConfigItem {
    /** 参数名称 */
    name: string;
    /** 参数值 */
    value: number | string;
    /** 是否启用 */
    enable: boolean;
    /** 参数别名 */
    alias: string;
}

/**
 * AI模型信息接口
 */
export interface AiModelInfo {
    /** 模型ID */
    id: string;
    /** 模型名称 */
    name: string;
    /** 供应商ID */
    providerId: string;
    /** 模型标识符 */
    model: string;
    /** 模型配置 */
    modelConfig: ModelConfigItem[];
    /** 是否启用 */
    isActive: boolean;
    /** 是否默认模型 */
    isDefault: boolean;
    /** 模型描述 */
    description?: string;
    /** 排序顺序 */
    sortOrder: number;
    /** 模型类型 */
    modelType: string;
    /** 最大上下文 */
    maxContext: number;
    /** 定价信息 */
    billingRule: {
        /** 算力 */
        power: number;
        /** tokens */
        tokens: number;
    };
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}

/**
 * 供应商信息接口（包含模型列表）
 */
export interface ProviderInfo {
    /** 供应商ID */
    id: string;
    /** 供应商标识符 */
    provider: string;
    /** 供应商名称 */
    name: string;
    /** 是否启用 */
    isActive: boolean;
    /** 模型数量 */
    modelCount: number;
    /** 模型列表 */
    models: AiModelInfo[];
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}

/**
 * 创建AI模型请求参数
 */
export type CreateAiModelRequest = {
    /** 模型名称 */
    name: string;
    /** 供应商ID */
    providerId: string;
    /** 模型标识符 */
    model: string;
    /** 最大Token数 */
    maxTokens?: number;
    /** 模型配置 */
    modelConfig?: ModelConfigItem[];
    /** 是否启用 */
    isActive?: boolean;
    /** 是否默认模型 */
    isDefault?: boolean;
    /** 模型描述 */
    description?: string;
    /** 排序顺序 */
    sortOrder?: number;
    /** 定价信息 */
    pricing?: {
        /** 输入价格 */
        input?: number;
        /** 输出价格 */
        output?: number;
        /** 货币单位 */
        currency?: string;
    };
};

/**
 * 更新AI模型请求参数 - 继承创建请求并使所有字段可选，但ID必需
 */
export interface UpdateAiModelRequest extends Partial<CreateAiModelRequest> {
    /** 模型ID（更新时必需） */
    id: string;
}

/**
 * 模型类型
 */
export interface ModelType {
    value: string;
    label: string;
    description: string;
}
