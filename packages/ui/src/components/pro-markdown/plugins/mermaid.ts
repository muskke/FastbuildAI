/**
 * Mermaid 插件配置
 * 用于渲染 Mermaid 图表和流程图
 * @author FastbuildAI
 */

import type MarkdownIt from "markdown-it";

import { useImagePreview } from "../../../composables/useImagePreview";

/**
 * Mermaid 插件配置选项
 */
export interface MermaidOptions {
    /** 是否自动启动 */
    startOnLoad?: boolean;
    /** 安全级别 */
    securityLevel?: "strict" | "loose" | "antiscript" | "sandbox";
    /** 流程图配置 */
    flowchart?: {
        htmlLabels?: boolean;
        useMaxWidth?: boolean;
    };
    /** 主题 */
    theme?: "default" | "dark" | "forest" | "neutral";
    /** 字典配置 */
    dictionary?: {
        token?: string;
        [key: string]: string | undefined;
    };
    /** 是否抑制错误渲染 */
    suppressErrorRendering?: boolean;
    /** 是否抑制错误渲染 */
    suppressErrors?: boolean;
    /**
     * 可选：自定义 CDN 地址（默认使用 esm.sh mermaid@9.1.7）
     * 例如："https://esm.sh/mermaid@9.1.7?bundle"
     */
    cdnBaseUrl?: string;
}

/**
 * HTML 实体转义函数
 * @param {string} str 待转义的字符串
 * @returns {string} 转义后的字符串
 */
const htmlEntities = (str: string): string =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 全局渲染计数器，用于生成唯一ID */
let renderCounter = 0;
/** 上一次渲染内容 */
let lastRenderContent: string | null = null;
/** Mermaid 实例（仅在浏览器端通过 CDN 加载） */
let MermaidInst: any | null = null;
/** 是否正在加载 Mermaid */
let MermaidLoading: Promise<any> | null = null;

/**
 * 动态加载 Mermaid（仅浏览器端，CDN 版本锁定为 9.1.7，无本地兜底）
 */
async function loadMermaid(cdnBaseUrl?: string): Promise<any | null> {
    if (typeof window === "undefined") return null;
    if (MermaidInst) return MermaidInst;
    if (MermaidLoading) return MermaidLoading;

    const cdnUrl =
        cdnBaseUrl ||
        (typeof (globalThis as any).NUXT_PUBLIC_MERMAID_CDN === "string"
            ? (globalThis as any).NUXT_PUBLIC_MERMAID_CDN
            : "https://esm.sh/mermaid@9.1.7?bundle");

    MermaidLoading = import(/* @vite-ignore */ cdnUrl)
        .then((mod: any) => {
            MermaidInst = mod?.default ?? mod;
            return MermaidInst;
        })
        .catch((err: any) => {
            console.warn("Mermaid CDN 加载失败", err);
            return null;
        })
        .finally(() => {
            MermaidLoading = null;
        });

    return MermaidLoading;
}

/**
 * 安全渲染 Mermaid 图表
 * @param {string} key 图表的唯一标识符
 * @param {string} content Mermaid 图表内容
 * @returns {Promise<string | null>} 返回渲染后的 SVG 字符串或 null
 */
const safeRenderMermaid = (key: string, content: string): string | null | any => {
    try {
        if (!MermaidInst) return null;
        return MermaidInst.mermaidAPI.render(key, content);
    } catch (error) {
        // 解析或渲染异常统一记录到控制台，不向上抛出，避免 UI 抖动
        console.warn("Mermaid 渲染失败:", (error as Error)?.message || error);
        return null;
    }
};

/**
 * 显示渲染成功的图表
 * @param {string} id 占位符元素的ID
 * @param {string} chartId 图表的唯一标识
 * @param {string} svg 渲染后的SVG内容
 */
const showChart = (id: string, chartId: string, svg: string): void | any => {
    setTimeout(() => {
        const svgEl = document.querySelector(`#${id} svg`);
        if (!svgEl) return;

        svgEl.addEventListener("click", async () => {
            try {
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                useImagePreview([url], 1);
                setTimeout(() => URL.revokeObjectURL(url), 30000);
            } catch (err) {
                console.warn("预览失败", err);
            }
        });
    }, 100);

    return `<div id="${id}" data-mermaid-id="${chartId}"  class="mermaid cursor-pointer hover:scale-101 transition-all duration-300">${svg}</div>`;
};

/**
 * 显示渲染错误信息
 * @param {string} id 占位符元素的ID
 * @param {string} message 错误消息
 */
const showError = (id: string, message: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    const container = document.createElement("div");
    container.className = "mermaid-error";
    container.style.cssText =
        "background:#fff5f5;border:1px solid #f99;border-radius:4px;padding:10px;color:#c00;";
    container.innerHTML = `<strong>Mermaid render error</strong><div style="color:#666;font-size:14px">${htmlEntities(message)}</div>`;
    el.replaceWith(container);
};

/**
 * 渲染 Mermaid 图表的主要函数
 * @param {string} code 原始的 Mermaid 代码
 * @param {string} id 占位符元素的ID
 */
const renderMermaidChart = (code: string, id: string): Promise<void> | any => {
    const chartId = `mermaid-${++renderCounter}`;

    try {
        // Mermaid 未加载（CDN 加载中或失败）：返回空容器并在加载完成后异步渲染
        if (!MermaidInst) {
            const placeholder = `<div id="${id}" class="mermaid"></div>`;
            // 异步触发加载并渲染
            void loadMermaid().then(() => {
                try {
                    if (!MermaidInst) return;
                    const parseResult = MermaidInst.mermaidAPI.parse(code);
                    if (parseResult === false) return;
                    const svg = safeRenderMermaid(chartId, code);
                    lastRenderContent = svg;
                    const el = document.getElementById(id);
                    if (el && svg) {
                        // 用渲染结果整体替换占位容器，保持原有结构和点击预览逻辑
                        el.outerHTML = showChart(id, chartId, svg);
                    }
                } catch (err) {
                    // 渲染失败时替换为错误提示
                    const el = document.getElementById(id);
                    if (el) showError(id, (err as Error)?.message || "渲染失败");
                }
            });
            return placeholder;
        }

        // 先尝试解析，若内容不完整（流式输入未结束）则 parse 会返回 false
        const parseResult = MermaidInst.mermaidAPI.parse(code);

        // parseResult 若为 false 表示语法暂时无效，直接跳过本次渲染
        if (parseResult === false) {
            if (lastRenderContent) {
                return showChart(id, chartId, lastRenderContent as string);
            }
            return "";
        }

        const svg = safeRenderMermaid(chartId, code);
        lastRenderContent = svg;
        if (svg) {
            return showChart(id, chartId, svg);
        }
    } catch (error) {
        // 解析错误时显示友好的错误信息，而不是抛出异常
        console.warn("Mermaid 解析错误:", (error as Error)?.message || error);
        return `<div id="${id}" class="mermaid-error" style="background:#fff5f5;border:1px solid #f99;border-radius:4px;padding:10px;color:#c00;">
            <strong>Mermaid 语法错误</strong>
            <div style="color:#666;font-size:14px;margin-top:8px;">
                解析失败: ${htmlEntities((error as any)!.str || "解析失败")}
            </div>
            <details style="margin-top:8px;">
                <summary style="cursor:pointer;color:#666;">查看原始代码</summary>
                <pre style="background:#f8f8f8;padding:8px;border-radius:4px;margin-top:4px;overflow:auto;">${htmlEntities(code)}</pre>
            </details>
        </div>`;
    }
};

/** 默认配置选项 */
const defaultOptions: MermaidOptions = {
    startOnLoad: false,
    securityLevel: "strict",
    flowchart: {
        htmlLabels: false,
        useMaxWidth: true,
    },
    dictionary: {
        token: "mermaid",
    },
    suppressErrorRendering: false,
    suppressErrors: false,
};

/**
 * 创建 Mermaid 插件
 * @param {Partial<MermaidOptions>} options 插件配置选项
 * @returns {function} 返回 MarkdownIt 插件函数
 */
export function createMermaidPlugin(
    options: Partial<MermaidOptions> = {},
): (md: MarkdownIt) => void {
    const config = { ...defaultOptions, ...options };

    // 浏览器端异步加载并初始化（CDN v9.1.7，无本地兜底）
    if (typeof window !== "undefined") {
        // 异步预加载，不阻塞后续渲染
        void loadMermaid(config.cdnBaseUrl).then((inst) => {
            try {
                inst?.initialize({
                    ...config,
                    theme: config.theme,
                });
            } catch (e) {
                console.warn("Mermaid 初始化失败", e);
            }
        });
    }

    return (md) => {
        const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);

        md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
            const tokenObj = tokens[idx];
            const info = tokenObj.info.trim();

            if (info === "mermaid" || info.startsWith("mermaid")) {
                const id = `mermaid-placeholder-${Date.now()}-${idx}`;

                // 异步渲染图表
                return renderMermaidChart(tokenObj.content, id);
            }

            return defaultFence?.(tokens, idx, opts, env, self) ?? "";
        };
    };
}
