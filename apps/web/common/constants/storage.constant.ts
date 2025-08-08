/**
 * 存储键名常量
 * @description 定义应用中使用的存储键名常量，如 Cookie、LocalStorage 等
 */

export const STORAGE_KEYS = {
    /** 用户Token */
    USER_TOKEN: "__user_token__",
    /** 用户临时Token */
    USER_TEMPORARY_TOKEN: "__user_temporary_token__",
    /** 登录时间戳 */
    LOGIN_TIME_STAMP: "__login_time_stamp__",
    /** 用户ID */
    USER_ID: "__user_id__",
    /** 后天布局 */
    LAYOUT_MODE: "__console_layout_mode__",
    /** 对话信息 */
    AI_CONVERSATION_TITLE: "__ai_conversation_title__",
    /** 主题模式 */
    NUXT_UI_PRIMARY: "nuxt-ui-primary",
    /** 主题颜色 */
    NUXT_UI_NEUTRAL: "nuxt-ui-neutral",
    /** 是否使用黑色作为主题色 */
    NUXT_UI_BLACK_AS_PRIMARY: "nuxt-ui-black-as-primary",
    /** 圆角 */
    NUXT_UI_RADIUS: "nuxt-ui-radius",
    /** 聊天窗口样式：conversation | document */
    CHAT_WINDOW_STYLE: "__chat_window_style__",
    /** 代码高亮主题 */
    CODE_HIGHLIGHT_THEME: "__code_highlight_theme__",
    /** Mermaid 图主题 */
    MERMAID_THEME: "__mermaid_theme__",
    /** 用户时区设置 */
    USER_TIMEZONE: "__user_timezone__",
} as const;
export type StorageKeys = keyof typeof STORAGE_KEYS;
