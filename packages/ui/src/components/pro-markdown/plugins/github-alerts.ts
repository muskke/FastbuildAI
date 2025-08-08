/**
 * GitHub 风格警报 插件配置
 * 用于渲染 GitHub 风格警报
 * @author FastbuildAI
 */
import type MarkdownIt from "markdown-it";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";

/**
 * 创建 GitHub 风格警报 插件
 * @returns { MarkdownIt } MarkdownIt 实例
 */
export function createGithubAlertsPlugin(): (md: MarkdownIt) => void {
    return MarkdownItGitHubAlerts;
}
