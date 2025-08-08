/** Nuxt UI 语言代码映射 */
export const uiI18nMap: Record<string, string> = {
    zh: "zh-cn",
    en: "en",
    jp: "jp",
} as const;

/** 浏览器语言代码映射 */
export const navigatorMap: Record<string, string> = {
    "zh-cn": "zh",
    "zh-tw": "zh",
    "ja-jp": "jp",
    en: "en",
    "en-us": "en",
    "en-gb": "en",
} as const;

/** 支持的语言常量 */
export const Language = {
    /** 中文 */
    ZH: "zh",
    /** 英语 */
    EN: "en",
    /** 日语 */
    JP: "jp",
} as const;

/** 语言代码类型 */
export type LanguageCode = (typeof Language)[keyof typeof Language];

/** 可用语言选项列表 */
export const languageOptions: LanguageOption[] = [
    {
        code: Language.ZH,
        name: "简体中文",
        icon: "🇨🇳",
        translationCode: "zh",
    },
    {
        code: Language.EN,
        name: "English",
        icon: "🇺🇸",
        translationCode: "en",
    },
    {
        code: Language.JP,
        name: "日本語",
        icon: "🇯🇵",
        translationCode: "ja",
    },
];

/** 获取语言的翻译代码 */
export function getTranslationCode(lang: LanguageCode): string {
    const option = languageOptions.find((opt) => opt.code === lang);
    return option ? option.translationCode : lang;
}

/** 获取语言的翻译名称 */
export function getTranslationName(lang: LanguageCode): string {
    const option = languageOptions.find((opt) => opt.code === lang);
    return option ? option.name : lang;
}

/**
 * 获取默认语言
 * 优先使用浏览器/系统的语言设置
 * 如果不在支持的语言列表中，则回退到中文
 */
export function getDefaultLanguage(): string {
    if (import.meta.client) {
        try {
            // 获取浏览器语言
            const browserLang = navigator.language.toLowerCase();
            // 检查是否支持该语言
            return navigatorMap[browserLang] || Language.ZH;
        } catch (error) {
            console.warn("获取浏览器语言设置失败，使用默认语言", error);
        }
    }

    // 默认回退到中文
    return Language.ZH;
}
