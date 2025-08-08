/**
 * 网站信息配置
 */
export interface WebsiteInfo {
    /** 网站名称 */
    name: string;
    /** 网站描述 */
    description?: string;
    /** 网站图标 */
    icon: string;
    /** 网站Logo */
    logo: string;
}

/**
 * 协议配置
 */
export interface WebsiteAgreement {
    /** 服务条款标题 */
    serviceTitle: string;
    /** 服务条款内容 */
    serviceContent: string;
    /** 隐私政策标题 */
    privacyTitle: string;
    /** 隐私政策内容 */
    privacyContent: string;
    /** 支付协议标题 */
    paymentTitle: string;
    /** 支付协议内容 */
    paymentContent: string;
    /** 协议最后更新时间 */
    updateAt?: string;
}

/**
 * 版权配置
 */
export interface WebsiteCopyright {
    /** 版权名称 */
    displayName: string;
    /** 图标URL */
    iconUrl: string;
    /** 链接URL */
    url: string;
}

/**
 * 统计配置
 */
export interface WebsiteStatistics {
    /** 统计AppID */
    appid: string;
}

/**
 * 网站配置
 */
export interface WebsiteConfig {
    /** 网站信息 */
    webinfo: WebsiteInfo;
    /** 协议配置 */
    agreement: WebsiteAgreement;
    /** 版权配置 */
    copyright: WebsiteCopyright;
    /** 统计配置 */
    statistics: WebsiteStatistics;
}

/**
 * 更新网站配置请求 - 支持部分更新，继承完整配置并使所有字段可选
 */
export interface UpdateWebsiteRequest extends Partial<WebsiteConfig> {
    /** 配置分组（可选，用于指定更新哪个分组） */
    group?: "webinfo" | "agreement" | "copyright" | "statistics";
}
