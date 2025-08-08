/**
 * 插件导出文件
 * 集中导出所有 Markdown 插件
 * @author FastbuildAI
 */

import type MarkdownIt from "markdown-it";

import { createCopyPlugin } from "./copy";
import { createGithubAlertsPlugin } from "./github-alerts";
import { createHighlightPlugin } from "./highlight";
import { createKatexPlugin, createKatexPluginCDN } from "./katex";
import { createMermaidPlugin } from "./mermaid";

/**
 * 插件配置选项
 */
export interface PluginOptions {
    /** 是否为暗色模式 */
    isDark: boolean;
    /** 代码高亮主题 */
    highlightTheme?: {
        light: string;
        dark: string;
    };
    /** Mermaid 主题 */
    mermaidTheme?: "default" | "dark" | "forest" | "neutral";
}

/**
 * 配置所有插件
 * @param md MarkdownIt 实例
 * @param options 插件配置选项
 */
export async function configurePlugins(
    md: MarkdownIt,
    options: PluginOptions = { isDark: false },
): Promise<void> {
    // 配置代码高亮插件（使用 CDN）
    md.use(
        createHighlightPlugin({
            isDark: options.isDark,
            themes: options.highlightTheme,
        }),
    );

    // 配置 GitHub 风格警报
    md.use(createGithubAlertsPlugin());

    // 配置 KaTeX 插件（CDN 方式，仅浏览器端等待资源就绪后挂载）
    md.use(await createKatexPluginCDN());

    // 配置 Mermaid 图表插件（CDN 方式）
    md.use(
        createMermaidPlugin({
            theme: options.mermaidTheme,
        }),
    );

    // 配置代码复制插件
    md.use(createCopyPlugin());
}

export { createCopyPlugin, createHighlightPlugin, createKatexPlugin, createMermaidPlugin };
