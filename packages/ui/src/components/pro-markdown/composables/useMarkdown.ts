/**
 * Markdown 渲染 Composable
 * 提供 Markdown 渲染相关功能，针对SSR优化和内存效率优化
 * @author FastbuildAI
 */

import { useColorMode } from "@vueuse/core";
import MarkdownItAsync from "markdown-it-async";
import { computed, onUnmounted, ref, watch } from "vue";

import { STORAGE_KEYS } from "@/common/constants";

import { configurePlugins } from "../plugins";

// 实例缓存，避免重复创建
let cachedMarkdownInstance: any | null = null;
let lastConfigHash: string | null = null;

/**
 * 生成配置哈希，用于判断是否需要重新创建实例
 */
function generateConfigHash(config: any): string {
    return JSON.stringify(config);
}

/**
 * 创建或获取缓存的 MarkdownIt 实例
 */
async function getMarkdownInstance(config: any): Promise<any> {
    const configHash = generateConfigHash(config);

    // 如果配置未变化且有缓存实例，直接返回
    if (cachedMarkdownInstance && lastConfigHash === configHash) {
        return cachedMarkdownInstance;
    }

    // 创建新实例
    const md = MarkdownItAsync({
        html: false,
        linkify: true,
        breaks: true,
    });

    // 配置插件（仅在客户端）
    if (!import.meta.env.SSR) {
        await configurePlugins(md as any, config);
    }

    // 更新缓存
    cachedMarkdownInstance = md;
    lastConfigHash = configHash;

    return md;
}

/**
 * 清理缓存实例（用于内存管理）
 */
function clearMarkdownCache(): void {
    cachedMarkdownInstance = null;
    lastConfigHash = null;
}

/**
 * 使用 Markdown 渲染
 * @returns Markdown 渲染相关的状态和方法
 */
export function useMarkdown() {
    const colorMode = useColorMode();

    /** 计算当前是否为暗色主题 */
    const isDark = computed(() => colorMode.value === "dark");

    /** 渲染结果 */
    const result = ref("");

    /** 当前内容 */
    const content = ref("");

    /** 渲染状态标记，防止重复渲染 */
    const isRendering = ref(false);

    /**
     * 渲染 Markdown 内容
     * @param markdownContent Markdown 内容
     * @returns 渲染后的 HTML
     */
    const render = async (markdownContent: string) => {
        content.value = markdownContent || "";

        if (!markdownContent) {
            result.value = "";
            return "";
        }

        // SSR 环境下进行一次基础 Markdown 预渲染（不加载重型插件）
        if (import.meta.env.SSR) {
            const md = MarkdownItAsync({ html: false, linkify: true, breaks: true });
            const html = await md.renderAsync(markdownContent);
            result.value = html;
            return result.value;
        }

        // 防止重复渲染
        if (isRendering.value) {
            return result.value;
        }

        isRendering.value = true;

        try {
            // 读取主题配置
            const highlightTheme = useCookie<string>(STORAGE_KEYS.CODE_HIGHLIGHT_THEME).value;
            const mermaidTheme = useCookie<any>(STORAGE_KEYS.MERMAID_THEME).value;

            const config = {
                isDark: isDark.value,
                highlightTheme: highlightTheme
                    ? { light: highlightTheme, dark: highlightTheme }
                    : undefined,
                mermaidTheme: mermaidTheme || undefined,
            };

            // 获取或创建 MarkdownIt 实例
            const md = await getMarkdownInstance(config);

            // 渲染内容
            const html = await md.renderAsync(markdownContent);
            result.value = html;
            return html;
        } catch (error) {
            console.error("Markdown 渲染错误:", error);
            result.value = `<div class="markdown-error">Markdown 渲染错误: ${error}</div>`;
            return result.value;
        } finally {
            isRendering.value = false;
        }
    };

    /** 监听主题变化，重新渲染 */
    watch(
        () => isDark.value,
        () => {
            if (content.value.length && !isRendering.value) {
                // 清理缓存，因为主题变化需要重新配置插件
                clearMarkdownCache();
                render(content.value);
            }
        },
        { immediate: false },
    );

    // 处理点击事件
    const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // 处理 A 标签相关逻辑
        if (target.getAttribute("href")) {
            const href = target.getAttribute("href");
            // 如果是锚点链接，则滚动到对应位置
            if (href && href.startsWith("#")) {
                event.preventDefault();
                const id = href.substring(1);
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                }
            }
        }
    };

    // 组件卸载时清理缓存（可选，根据实际需求）
    onUnmounted(() => {
        // 注意：这里不直接清理全局缓存，因为可能有其他组件在使用
        // 实际场景中可以考虑引用计数机制
    });

    return {
        result,
        render,
        handleClick,
        clearCache: clearMarkdownCache, // 暴露清理方法，供外部使用
    };
}
