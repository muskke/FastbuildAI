/**
 * 代码复制插件
 * @author FastbuildAI
 */

import { useClipboard } from "@vueuse/core";
import type MarkdownIt from "markdown-it";
import type { Composer } from "vue-i18n";

import { useMessage } from "../../../composables/useMessage";

// 未使用的 CopyOptions 接口及相关逻辑已移除，避免无效代码

// 缓存常用正则表达式
const HTML_ESCAPE_REGEX = /[&<>"']/g;
const HTML_ESCAPE_REPLACER: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/**
 * HTML 转义（用于插入到模板中，避免 XSS）
 */
function escapeHtmlFast(html: string): string {
    return html.replace(HTML_ESCAPE_REGEX, (ch) => HTML_ESCAPE_REPLACER[ch]);
}

// ============ 全局事件监听控制 ============
// 使用模块级变量，确保无论插件被多次创建，复制事件只会被绑定一次
let isCopyClickHandlerAttached = false;

/**
 * 事件委托处理复制操作
 */
function handleCopyClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>(".pro-markdown-copy-button");

    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;

    if (!button) return;

    const encodedCode = button.dataset.code ?? "";

    try {
        const decoded = decodeURIComponent(encodedCode);

        // 使用 VueUse 的 useClipboard
        const { copy, isSupported } = useClipboard();

        if (!isSupported.value) {
            useMessage().error(t("console-common.messages.copyFailed"));
            return;
        }

        copy(decoded)
            .then(() => {
                // 成功反馈
                button.classList.add("copied");

                // 获取图标元素
                const iconElement = button.querySelector(".pro-markdown-copy-icon") as HTMLElement;
                if (iconElement) {
                    // 切换到成功图标
                    iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m12 15l2 2l4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>`;

                    // 2秒后恢复原始图标
                    setTimeout(() => {
                        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>`;
                        button.classList.remove("copied");
                    }, 2000);
                } else {
                    // 如果没有找到图标元素，只处理按钮状态
                    setTimeout(() => button.classList.remove("copied"), 2000);
                }

                useMessage().success(t("console-common.messages.copySuccess"));
            })
            .catch(() => {
                useMessage().error(t("console-common.messages.copyFailed"));
            });
    } catch {
        useMessage().error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 创建复制代码插件
 * @returns { MarkdownIt } MarkdownIt 实例
 */
export function createCopyPlugin(): (md: MarkdownIt) => void {
    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;
    return (md: MarkdownIt) => {
        const defaultRender = md.renderer.rules.fence!.bind(md.renderer.rules);

        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
            const token = tokens[idx];
            const rawLang = token.info.trim();
            const lang = escapeHtmlFast(rawLang) || "text";
            const content = token.content;

            // 渲染原始代码块
            const codeHtml = defaultRender(tokens, idx, options, env, slf);

            // 使用 encodeURIComponent 存储代码内容，避免在 HTML 中出现特殊字符导致的问题
            const encodedContent = encodeURIComponent(content);

            const copyText = t("common.chat.messages.copy");

            return `
        <div class="pro-markdown-code-wrapper">
          <div class="pro-markdown-code-header">
            <span class="pro-markdown-code-lang">${lang}</span>
            <button
              class="pro-markdown-copy-button !py-2.5"
              data-code="${encodedContent}"
              title="${copyText}"
              aria-label="${copyText}"
            >
              <span class="pro-markdown-copy-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>
              </span>
            </button>
          </div>
          ${codeHtml}
        </div>
      `;
        };

        if (!isCopyClickHandlerAttached && typeof window !== "undefined") {
            // 直接在浏览器环境中绑定事件，无需延迟
            document.addEventListener("click", handleCopyClick);
            isCopyClickHandlerAttached = true;
        }
    };
}
