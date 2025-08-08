/**
 * 插件市场查询请求参数接口
 */
export interface PluginMarketQueryRequest extends Pagination {
    /** 分类ID */
    cid?: number;
    /** 插件名称 */
    name?: string;
    /** 插件类型 */
    type?: number;
    /** 价格筛选 */
    price_type?: "free" | "paid";
}

/**
 * 插件作者信息
 */
export interface PluginAuthor {
    /** 作者ID */
    id: number;
    /** 作者序列号 */
    sn: number;
    /** 作者头像 */
    avatar: string;
    /** 作者昵称 */
    nickname: string;
    /** 作者账号 */
    account: string;
    /** 作者手机号 */
    mobile: string;
}

/**
 * 插件版本信息
 */
export interface PluginVersion {
    /** 版本ID */
    id: number;
    /** 版本号 */
    version: string;
    /** 版本描述 */
    description: string;
    /** 更新日志 */
    changelog: string;
    /** 发布时间 */
    release_time: string;
}

/**
 * 插件市场项目信息
 */
export interface PluginMarketItem {
    /** 插件ID */
    id: number;
    /** 分类ID */
    cid: number;
    /** 插件名称 */
    name: string;
    /** 插件标识 */
    key: string;
    /** 插件描述 */
    description: string;
    /** 插件封面图片（多张，逗号分隔） */
    cover: string;
    /** 插件图标 */
    icon: string;
    /** 插件价格 */
    price: string;
    /** 插件状态 */
    status: number;
    /** 拒绝原因 */
    reject_reason: string | null;
    /** 作者ID */
    author_id: number;
    /** 是否推荐 */
    is_featured: number;
    /** 排序 */
    sort: number;
    /** 是否禁用 */
    disable: number;
    /** 终端支持（逗号分隔的数字） */
    terminal_support: string;
    /** 创建时间 */
    create_time: string;
    /** 更新时间 */
    update_time: string;
    /** 删除时间 */
    delete_time: string | null;
    /** 作者信息 */
    author: PluginAuthor;
    /** 版本列表 */
    versions: PluginVersion[];
}

/**
 * 插件类型信息
 */
export interface PluginType {
    /** 类型标签 */
    label: string;
    /** 类型值 */
    value: number;
}

/**
 * 插件分类信息
 */
export interface PluginCategory {
    /** 分类ID */
    id: number;
    /** 分类名称 */
    name: string;
    /** 分类描述 */
    description: string;
    /** 分类图标 */
    icon: string;
    /** 排序 */
    sort: number;
    /** 是否禁用 */
    disable: number;
    /** 创建时间 */
    create_time: string;
    /** 更新时间 */
    update_time: string;
}

/**
 * 插件市场列表数据
 */
export interface PluginMarketListData {
    /** 插件列表 */
    lists: PluginMarketItem[];
    /** 总数 */
    count: number;
    /** 当前页码 */
    page_no: number;
    /** 每页数量 */
    page_size: number;
    /** 扩展信息 */
    extend: {
        /** 插件类型列表 */
        types: PluginType[];
        /** 插件分类列表 */
        categories: PluginCategory[];
    };
}
