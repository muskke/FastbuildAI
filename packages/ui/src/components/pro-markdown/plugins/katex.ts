/**
 * KaTeX 插件配置
 * 用于渲染数学公式（纯 CDN 加载，无本地兜底）
 * @author FastbuildAI
 */

import type MarkdownIt from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type { RuleInline } from "markdown-it/lib/parser_inline.mjs";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import type Token from "markdown-it/lib/token.mjs";

/** 全局 KaTeX 实例与加载状态 */
let KatexInst: any | null = null;
let KatexLoading: Promise<any> | null = null;

/**
 * 动态加载 KaTeX（仅浏览器端，CDN 固定版本 0.16.21）
 */
async function loadKatex(cdnBaseUrl?: string): Promise<any | null> {
    if (typeof window === "undefined") return null;
    if (KatexInst) return KatexInst;
    if (KatexLoading) return KatexLoading;

    const cdnUrl =
        cdnBaseUrl ||
        (typeof (globalThis as any).NUXT_PUBLIC_KATEX_CDN === "string"
            ? (globalThis as any).NUXT_PUBLIC_KATEX_CDN
            : "https://esm.sh/katex@0.16.21?bundle");

    KatexLoading = import(/* @vite-ignore */ cdnUrl)
        .then((mod: any) => {
            KatexInst = mod?.default ?? mod;
            return KatexInst;
        })
        .catch((err: any) => {
            console.warn("KaTeX CDN 加载失败", err);
            return null;
        })
        .finally(() => {
            KatexLoading = null;
        });

    return KatexLoading;
}

interface DelimiterValidity {
    canOpen: boolean;
    canClose: boolean;
}

/** 预编译字符检查 */
const SPACE_CODES = new Set([0x20, 0x09]);
const DIGIT_CODES = new Set(Array.from({ length: 10 }, (_, i) => i + 0x30));

/**
 * 判断是否为有效的分隔符
 * @param {StateInline} state markdown-it 行内解析状态对象，提供上下文信息
 * @param {number} pos 待检测的位置索引（基于当前行的字符串）
 */
function isValidDelimiter(state: StateInline, pos: number): DelimiterValidity {
    const prevCode = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    const nextCode = pos + 1 <= state.posMax ? state.src.charCodeAt(pos + 1) : -1;

    return {
        canOpen: !SPACE_CODES.has(nextCode),
        canClose: !(SPACE_CODES.has(prevCode) || DIGIT_CODES.has(nextCode)),
    };
}

/**
 * 行内数学公式解析
 * @param {StateInline} state 解析状态对象，包含当前行的信息
 * @param {boolean} silent 是否静默模式（true 时不创建 token，仅检测是否匹配）
 */

const parseInlineMath: RuleInline = (state: StateInline, silent: boolean) => {
    if (state.src[state.pos] !== "$") return false;

    const { canOpen } = isValidDelimiter(state, state.pos);
    if (!canOpen) {
        if (!silent) state.pending += "$";
        state.pos++;
        return true;
    }

    let endPos = state.pos + 1;
    let escCount = 0;

    while (endPos <= state.posMax) {
        if (state.src[endPos] === "\\") escCount++;
        else if (state.src[endPos] === "$" && escCount % 2 === 0) break;
        else escCount = 0;
        endPos++;
    }

    if (endPos > state.posMax || endPos === state.pos + 1) return false;

    const { canClose } = isValidDelimiter(state, endPos);
    if (!canClose) return false;

    if (!silent) {
        const content = state.src.slice(state.pos + 1, endPos);
        const token = state.push("math_inline", "math", 0);
        token.content = content;
        token.markup = "$";
    }

    state.pos = endPos + 1;
    return true;
};

/**
 * 块级数学公式解析
 * @param {StateBlock} state 解析状态对象，包含当前行的信息
 * @param {number} startLine 起始行号（基于 0 的索引）
 * @param {number} endLine 结束行号（基于 0 的索引）
 * @param {boolean} silent 是否静默模式（true 时不创建 token，仅检测是否匹配）
 */
const parseBlockMath: RuleBlock = (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean,
) => {
    const startPos = state.bMarks[startLine]! + state.tShift[startLine]!;
    if (state.src.slice(startPos, startPos + 2) !== "$$") return false;

    const content = [];
    let closingLine = startLine;
    let found = false;

    for (let line = startLine; line <= endLine; line++) {
        const lineStart = state.bMarks[line]! + state.tShift[line]!;
        const lineEnd = state.eMarks[line]!;
        let lineText = state.src.slice(lineStart, lineEnd);

        if (line === startLine) lineText = lineText.slice(2);
        if (lineText.includes("$$")) {
            const closePos = lineText.lastIndexOf("$$");
            content.push(lineText.slice(0, closePos));
            found = true;
            closingLine = line;
            break;
        }
        content.push(lineText);
    }

    if (!found) return false;

    if (!silent) {
        const token = state.push("math_block", "math", 0);
        token.content = content.join("\n").trim();
        token.block = true;
        token.map = [startLine, closingLine];
        token.markup = "$$";
    }

    state.line = closingLine + 1;
    return true;
};

/**
 * KaTeX 插件
 * @param { katex.KatexOptions } KatexOptions 参数
 * @returns { MarkdownIt } MarkdownIt 实例
 */
export function createKatexPlugin(options: any = {}): (md: MarkdownIt) => void {
    return function (md: MarkdownIt) {
        const createRenderer =
            (displayMode: boolean) =>
            (content: string): string => {
                try {
                    if (!KatexInst) {
                        // 纯 CDN 模式下，若尚未加载则返回原文占位（不抛错，不本地兜底）
                        return `<span class="katex-error">${content}</span>`;
                    }
                    return KatexInst.renderToString(content, {
                        ...options,
                        displayMode,
                    });
                } catch (error) {
                    if (options.throwOnError) {
                        console.error(error);
                    }
                    return `<span class="katex-error">${content}</span>`;
                }
            };

        const inlineRenderer = (tokens: Token[], index: number) =>
            `<span class="katex-inline">${createRenderer(false)(tokens[index]!.content)}</span>`;

        const blockRenderer = (tokens: Token[], index: number) =>
            `<div class="katex-block">${createRenderer(true)(tokens[index]!.content)}</div>\n`;

        md.inline.ruler.after("escape", "math_inline", parseInlineMath);
        md.block.ruler.after("blockquote", "math_block", parseBlockMath, {
            alt: ["paragraph", "reference", "blockquote", "list"],
        });

        md.renderer.rules.math_inline = inlineRenderer;
        md.renderer.rules.math_block = blockRenderer;
    };
}

/**
 * 异步创建 KaTeX 插件（推荐）：确保在挂载插件前已完成 CDN 加载
 */
export async function createKatexPluginCDN(
    options: any = {},
    cdnBaseUrl?: string,
): Promise<(md: MarkdownIt) => void> {
    await loadKatex(cdnBaseUrl);
    return createKatexPlugin(options as any);
}
