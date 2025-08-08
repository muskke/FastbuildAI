import type { WebsiteCopyright, WebsiteInfo, WebsiteStatistics } from "./website";

/** 网站配置接口 */
export interface SiteConfig {
    /** 网站信息 */
    webinfo: WebsiteInfo;
    /** 版权信息 */
    copyright: WebsiteCopyright;
    /** 统计信息 */
    statistics: WebsiteStatistics;
}

/** 协议项接口 */
export interface AgreementItem {
    /** 标题 */
    title: string;
    /** 类型 */
    type: string;
    /** 内容 */
    content: string;
    /** 更新时间 */
    updateAt: string;
}

/** 分页请求参数 */
export interface Pagination {
    /** 当前页码，从1开始 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 页面大小（兼容性字段） */
    page_size?: number;
    /** 可选：其他查询参数 */
    [key: string]: any;
}

/** 通用查询参数基础接口 */
export interface BaseQueryParams extends Pagination {
    /** 关键词搜索 */
    keyword?: string;
    /** 创建时间范围-开始 */
    startDate?: string;
    /** 创建时间范围-结束 */
    endDate?: string;
}

/** 实体基础字段接口 */
export interface BaseEntity {
    /** 主键ID */
    id: string;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 删除时间（软删除） */
    deletedAt?: string;
}

/** 创建请求基础类型 - 排除自动生成的字段 */
export type BaseCreateRequest<T extends BaseEntity> = Omit<
    T,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

/** 更新请求基础类型 - 使所有字段可选但ID必需 */
export type BaseUpdateRequest<T extends BaseEntity> = Partial<BaseCreateRequest<T>> & {
    id: string;
};

/** 状态筛选查询参数 */
export interface StatusQueryParams {
    /** 状态筛选 */
    status?: string | number;
    /** 是否启用 */
    isEnabled?: boolean;
    /** 是否活跃 */
    isActive?: boolean;
}

/** 时间范围查询参数 */
export interface TimeRangeQueryParams {
    /** 创建时间范围-开始 */
    startDate?: string;
    /** 创建时间范围-结束 */
    endDate?: string;
    /** 兼容字段：开始时间 */
    startTime?: string;
    /** 兼容字段：结束时间 */
    endTime?: string;
}

/** 扩展的基础查询参数 */
export interface ExtendedBaseQueryParams
    extends BaseQueryParams,
        StatusQueryParams,
        TimeRangeQueryParams {}

/**
 * 通用 CRUD 接口模板
 * 使用示例：
 * interface UserEntity extends BaseEntity { name: string; email: string; }
 * type UserCreateRequest = CrudCreateRequest<UserEntity>;
 * type UserUpdateRequest = CrudUpdateRequest<UserEntity>;
 * interface UserQueryRequest extends CrudQueryRequest<UserEntity> {}
 */
export type CrudCreateRequest<T extends BaseEntity> = BaseCreateRequest<T>;
export type CrudUpdateRequest<T extends BaseEntity> = BaseUpdateRequest<T>;
export interface CrudQueryRequest<T extends BaseEntity = BaseEntity>
    extends ExtendedBaseQueryParams {
    /** 根据具体实体扩展特定的查询字段 */
}

/** 分页结果接口 */
export interface PaginationResult<T> {
    /** 数据列表 */
    items: T[];
    /** 总条数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 总页数 */
    totalPages: number;
}

/** 分页结果接口（兼容性接口） */
export interface PageResult<T> {
    /** 数据列表 */
    lists: T[];
    /** 总条数 */
    total?: number;
    /** 当前页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
    /** 总页数 */
    totalPages?: number;
}

/** 协议菜单项接口 */
export interface AgreementMenuItem {
    /** 菜单ID */
    id: string;
    /** 菜单标签 */
    label: string;
    /** 菜单值 */
    value: string;
    /** 是否默认展开 */
    defaultOpen?: boolean;
    /** 子项列表 */
    list: AgreementItem[];
}

/** 聊天窗口样式 */
export type ChatWindowStyle = "conversation" | "document";

/** 文件上传状态枚举 */
export type FileUploadStatus = "pending" | "uploading" | "success" | "error";

/** 文件返回项类型 */
export interface FileItem {
    /** 原始文件名 */
    originalName?: string;
    /** 存储文件名 */
    storageName?: string;
    /** 文件类型 */
    type?: "document" | "image" | "video";
    /** MIME 类型 */
    mimeType?: string;
    /** 文件大小（字节） */
    size?: number;
    /** 文件扩展名 */
    extension?: string;
    /** 文件路径 */
    path?: string;
    /** 文件访问URL */
    url?: string;
    /** 文件描述 */
    description?: string | null;
    /** 上传者ID */
    uploaderId?: string | null;
    /** 文件ID */
    id?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    /** 原始文件对象（上传过程中使用） */
    file?: File;
    /** 上传状态 */
    status?: FileUploadStatus;
    /** 上传进度（0-100） */
    progress?: number;
    /** 错误信息 */
    error?: string;
    /** 其他扩展属性 */
    [index: string]: any;
}

/**
 * 模型分类常量对象
 */
export const MODEL_TYPES = {
    /**
     * 大语言模型
     * 用于自然语言处理、对话生成等任务的通用语言模型
     */
    LLM: "llm",

    /**
     * 内容审核模型
     * 用于检测和过滤有害、不适当或违规内容
     */
    MODERATION: "moderation",

    /**
     * 重排序模型
     * 用于对搜索结果或文档进行相关性排序
     */
    RERANK: "rerank",

    /**
     * 语音转文本模型
     * 将语音内容转换为文本形式
     */
    SPEECH_TO_TEXT: "speech2text",

    /**
     * 文本嵌入模型
     * 将文本转换为向量表示，用于语义搜索等任务
     */
    TEXT_EMBEDDING: "text-embedding",

    /**
     * 文本转语音模型
     * 将文本内容转换为自然语音
     */
    TTS: "tts",
} as const;

/**
 * 模型分类类型
 */
export type ModelType = (typeof MODEL_TYPES)[keyof typeof MODEL_TYPES];

/**
 * 快捷菜单配置接口
 */
export interface QuickMenu {
    id: string;
    name: string;
    alias: string;
    description: string;
    icon: string;
    type: string;
    url: string;
    timeout: number;
    providerIcon: null;
    providerName: string;
    providerUrl: null;
    sortOrder: number;
    connectable: boolean;
    connectError: string;
    isDisabled: boolean;
    creatorId: null;
    createdAt: string;
    updatedAt: string;
}
