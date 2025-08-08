import { parsePackageName } from "@fastbuildai/utils";

/**
 * 获取所有翻译文件模块（按需加载，非 eager）
 */
export function getTranslationModules() {
    return import.meta.glob(
        ["./*/*.json", "!./*/*/index.json", "!./*/index.json", "!./index.json"],
        {
            eager: false,
        },
    );
}

/**
 * 获取所有插件的翻译文件模块（按需加载，非 eager）
 */
export function getPluginTranslationModules() {
    return import.meta.glob(["../../plugins/*/i18n/*/*.json"], { eager: false });
}

/**
 * 获取所有插件的 package.json 配置文件（仍使用 eager，体积很小）
 */
export function getPluginConfigs(): Record<string, any> {
    return import.meta.glob(["../../plugins/*/package.json"], { eager: true });
}

/**
 * 为指定语言生成翻译消息对象（异步，按需加载当前语言）
 * @param locale 语言代码 (如 'zh', 'en')
 */
export async function generateMessagesForLocale(locale: string): Promise<Record<string, any>> {
    const messages: Record<string, any> = {};

    // 1. 处理核心模块的翻译文件（仅加载当前语言）
    const coreModules = getTranslationModules();
    for (const path in coreModules) {
        const moduleLocale = extractLocale(path);
        const namespace = extractNamespace(path);
        if (moduleLocale !== locale) continue;
        if (moduleLocale === "unknown" || namespace === "unknown") {
            console.warn(`[i18n] 跳过无效的核心模块路径: ${path}`);
            continue;
        }
        const loader = coreModules[path] as () => Promise<any>;
        const mod = await loader();
        messages[namespace] = mod.default ?? mod;
    }

    // 2. 处理插件模块的翻译文件（仅加载当前语言）
    const pluginModules = getPluginTranslationModules();
    const pluginConfigs = getPluginConfigs();
    for (const path in pluginModules) {
        const pluginLocale = extractPluginLocale(path);
        if (pluginLocale !== locale) continue;
        const namespace = extractPluginNamespace(path, pluginConfigs);
        if (pluginLocale === "unknown" || namespace === "unknown") {
            console.warn(`[i18n] 跳过无效的插件路径: ${path}`);
            continue;
        }
        const loader = pluginModules[path] as () => Promise<any>;
        const mod = await loader();
        const payload = mod.default ?? mod;
        if (messages[namespace]) {
            console.warn(`[i18n] 命名空间冲突: ${namespace} (语言: ${locale})`);
            messages[namespace] = { ...messages[namespace], ...payload };
        } else {
            messages[namespace] = payload;
        }
    }

    return messages;
}

/**
 * 从模块路径中提取语言代码（locale）。
 */
export function extractLocale(path: string): string {
    const match = path.match(/\.\/([^/]+)\/[^/]+\.json$/);
    return match?.[1] ?? "unknown";
}

/**
 * 从插件模块路径中提取语言代码（locale）。
 */
export function extractPluginLocale(path: string): string {
    const match = path.match(/\/i18n\/([^/]+)\/[^/]+\.json$/);
    return match?.[1] ?? "unknown";
}

/**
 * 从模块路径中提取命名空间（namespace）。
 */
export function extractNamespace(path: string): string {
    const match = path.match(/\.\/[^/]+\/([^/]+)\.json$/);
    return match?.[1] ?? "unknown";
}

/**
 * 结合插件 package.json 计算插件命名空间
 */
export function extractPluginNamespace(path: string, pluginConfigs?: Record<string, any>): string {
    const match = path.match(/\/plugins\/([^/]+)\/i18n\/[^/]+\/([^/]+)\.json$/);
    if (match) {
        const pluginDir = match[1];
        const fileName = match[2];
        const configs = pluginConfigs ?? getPluginConfigs();
        const configPath = `../../plugins/${pluginDir}/package.json`;
        const pluginConfig = configs[configPath];
        if (pluginConfig) {
            const config = pluginConfig.default || pluginConfig;
            const pluginKey = parsePackageName(config.name) || pluginDir;
            const namespace = `${pluginKey}_${fileName}`;
            return namespace;
        } else {
            const namespace = `${pluginDir}_${fileName}`;
            return namespace;
        }
    }
    return "unknown";
}
