/**
 * 链接选择器类型定义
 */

/**
 * 链接类型枚举
 */
export const LinkType = {
    /** 系统页面 */
    SYSTEM: "system",
    /** 插件页面 */
    PLUGIN: "plugin",
    /** 微页面 */
    MICROPAGE: "micropage",
    /** 自定义链接 */
    CUSTOM: "custom",
};
export type _LinkType = (typeof LinkType)[keyof typeof LinkType];

/**
 * 链接项接口
 */
export interface LinkItem {
    /** 链接类型 */
    type?: _LinkType;
    /** 显示名称 */
    name?: string;
    /** 链接路径 */
    path?: string;
    /** 额外数据 */
    query?: Record<string, any>;
}

/**
 * 路由元信息接口
 */
export interface RouteMeta {
    /** 是否允许在链接选择器中显示 */
    inLinkSelector?: boolean;
    /** 是否为系统页面 */
    inSystem?: boolean;
    /** 页面标题 */
    title?: string;
    /** 页面图标 */
    icon?: string;
}

/**
 * 功能选项接口
 */
export interface LinkPickerOption {
    /** 选项键值 */
    key: _LinkType;
    /** 显示标签 */
    label: string;
    /** 图标 */
    icon: string;
}

/**
 * 组件属性接口
 */
export interface LinkPickerProps {
    /** 当前选中的链接 */
    modelValue?: LinkItem | null;
    /** 占位符文本 */
    placeholder?: string;
    /** 是否可清除 */
    clearable?: boolean;
    /** 输入框大小 */
    size?: "sm" | "md" | "lg" | "xl";
}

/**
 * 组件事件接口
 */
export interface LinkPickerEmits {
    /** 更新模型值 */
    (e: "update:modelValue", value: LinkItem | null): void;
    /** 值变化事件 */
    (e: "change", value: LinkItem | null): void;
}

/**
 * 内容组件属性接口
 */
export interface LinkPickerContentProps {
    /** 当前选中的链接 */
    selected?: LinkItem | null;
}

/**
 * 内容组件事件接口
 */
export interface LinkPickerContentEmits {
    /** 选择链接事件 */
    (e: "select", link: LinkItem): void;
    /** 关闭事件 */
    (e: "close"): void;
}

/**
 * 链接提供者接口
 */
export interface LinkProvider {
    /** 提供者类型 */
    type: _LinkType;
    /** 获取链接列表 */
    getLinks(): Promise<LinkItem[]> | LinkItem[];
    /** 搜索链接 */
    searchLinks?(query: string): Promise<LinkItem[]> | LinkItem[];
    /** 验证链接 */
    validateLink?(link: LinkItem): boolean;
}
