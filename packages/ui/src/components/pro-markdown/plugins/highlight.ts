/**
 * 代码高亮插件配置
 * 使用 Shiki 实现代码高亮
 */

import { fromAsyncCodeToHtml } from "@shikijs/markdown-it/async";
import type MarkdownIt from "markdown-it";

/**
 * 高亮配置选项
 */
export interface HighlightOptions {
    /** 是否为暗色模式 */
    isDark: boolean;
    /** 主题配置，可动态指定 light/dark 对应的 Shiki 主题名称 */
    themes?: {
        light: string;
        dark: string;
    };
    /**
     * 可选：自定义 CDN 地址（例如："https://esm.sh/shiki@3.7.0?bundle"）
     * 若未设置，则默认从 esm.sh 获取；加载失败会回退到本地依赖
     */
    cdnBaseUrl?: string;
}

/**
 * 常用语言列表，避免打包全量
 */
const COMMON_LANGUAGES = [
    "bash",
    "c",
    "cpp",
    "css",
    "diff",
    "dockerfile",
    "go",
    "graphql",
    "html",
    "java",
    "javascript",
    "json",
    "jsx",
    "kotlin",
    "less",
    "lua",
    "makefile",
    "markdown",
    "php",
    "python",
    "ruby",
    "rust",
    "scss",
    "shell",
    "sql",
    "swift",
    "toml",
    "tsx",
    "typescript",
    "vue",
    "xml",
    "yaml",
    "ini",
    "powershell",
];

/**
 * 验证并规范化代码语言标识符
 * @param lang 待验证的语言标识符
 * @returns 标准化语言或 null
 */
function validateLanguage(lang: string): string | null {
    const normalized = lang.toLowerCase();
    const aliasMap: Record<string, string> = {
        js: "javascript",
        mjs: "javascript",
        cjs: "javascript",
        jsx: "jsx",
        ts: "typescript",
        tsx: "tsx",
        sh: "bash",
        zsh: "bash",
        shell: "bash",
        yml: "yaml",
        md: "markdown",
        proto: "protobuf",
        plist: "xml",
        cs: "csharp",
        kt: "kotlin",
        tex: "latex",
    };
    const mapped = aliasMap[normalized] || normalized;
    if (COMMON_LANGUAGES.includes(mapped)) return mapped;
    return null;
}

/**
 * 动态加载 Shiki 的 codeToHtml（优先从 CDN 加载，失败回退到本地）
 */
async function resolveCodeToHtml(
    cdnBaseUrl?: string,
): Promise<(code: string, opts: any) => Promise<string> | string> {
    // 仅在浏览器端加载，SSR 直接回退为原样输出
    if (typeof window === "undefined") {
        return (code: string) => code;
    }

    const cdnUrl =
        cdnBaseUrl ||
        // 允许从运行时环境变量读取（若宿主框架注入了该变量）
        (typeof (globalThis as any).NUXT_PUBLIC_SHIKI_CDN === "string"
            ? (globalThis as any).NUXT_PUBLIC_SHIKI_CDN
            : "https://esm.sh/shiki@3.7.0?bundle");

    try {
        // 使用 CDN 方式加载（避免参与打包）
        const mod = await import(/* @vite-ignore */ cdnUrl);
        if (mod && typeof mod.codeToHtml === "function") {
            return mod.codeToHtml.bind(mod);
        }
    } catch (err) {
        // 忽略 CDN 加载失败，直接使用原始代码（不高亮）
        console.warn("Shiki CDN 加载失败", err);
    }

    // 直接返回原始代码
    return (code: string) => code;
}

/**
 * 创建高性能代码高亮插件
 */
export function createHighlightPlugin(
    options: HighlightOptions = { isDark: false },
): (md: MarkdownIt) => void {
    return (md: any) => {
        const themeConfig = options.themes || {
            light: "snazzy-light",
            dark: "tokyo-night",
        };

        md.use(
            fromAsyncCodeToHtml(
                async (code, opts) => {
                    // SSR 下直接返回原始代码，避免在服务端引入 Shiki
                    if (typeof window === "undefined") {
                        return code;
                    }

                    const validLang = validateLanguage(opts.lang) || "text";
                    const colorMode = options.isDark ? "dark" : "light";

                    const codeToHtml = await resolveCodeToHtml(options.cdnBaseUrl);
                    return codeToHtml(code, {
                        ...opts,
                        lang: validLang,
                        defaultColor: colorMode,
                    } as any);
                },
                {
                    themes: themeConfig,
                    cssVariablePrefix: "--shiki-",
                },
            ),
        );
    };
}
