import { addPlugin, addTemplate, createResolver, defineNuxtModule } from "@nuxt/kit";
import fs from "fs";
import { join, resolve } from "pathe";

/**
 * 检测并收集 Console Layout 配置
 */
function collectConsoleLayouts(rootDir: string): Record<string, string> {
    const layouts: Record<string, string> = {};

    // 检测 layout
    const getLayout = (filePath: string): string => {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const match = content.match(
                /definePageMeta\s*\(\s*\{\s*[^}]*layout:\s*["']([^"']+)["'][^}]*\}\s*\)/s,
            );
            return match ? match[1] : "console";
        } catch {
            return "console";
        }
    };

    // 扫描目录
    const scan = (dir: string, isPlugin = false, pluginName = "") => {
        if (!fs.existsSync(dir)) return;

        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);

            if (entry.isDirectory() && entry.name !== "_components") {
                scan(fullPath, isPlugin, pluginName);
            } else if (entry.name.endsWith(".vue")) {
                const layout = getLayout(fullPath);

                if (isPlugin) {
                    const relativePath = fullPath
                        .split(`/plugins/${pluginName}/app/console/`)[1]
                        ?.replace(".vue", "");
                    if (relativePath) {
                        layouts[`@plugins/${pluginName}/${relativePath}`] = layout;
                        layouts[`${pluginName}/app/console/${relativePath}`] = layout;
                    }
                } else {
                    const relativePath = fullPath.split("/app/console/")[1]?.replace(".vue", "");
                    if (relativePath) layouts[relativePath] = layout;
                }
            }
        }
    };

    // 扫描系统和插件页面
    scan(resolve(rootDir, "app/console"));

    const pluginsDir = resolve(rootDir, "plugins");
    if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir)
            .filter(
                (dir) => fs.statSync(join(pluginsDir, dir)).isDirectory() && !dir.startsWith("."),
            )
            .forEach((pluginName) =>
                scan(join(pluginsDir, pluginName, "app/console"), true, pluginName),
            );
    }

    return layouts;
}

export default defineNuxtModule({
    meta: { name: "console-layout" },
    setup(_, nuxt) {
        const layouts = collectConsoleLayouts(createResolver(import.meta.url).resolve("../../"));

        addPlugin({
            src: addTemplate({
                filename: "console-layout.mjs",
                getContents: () => {
                    return `export default defineNuxtPlugin(() => {
    const layouts = ${JSON.stringify(layouts, null, 2)};
    useNuxtApp().provide('getConsoleLayout', (path) => {
        const cleanPath = path?.startsWith('/console/') ? path.substring(9) : path;
        return layouts[cleanPath] || 'console';
    });
});`;
                },
            }).dst,
        });

        nuxt.hook("prepare:types", ({ declarations }) => {
            declarations.push(
                `declare module '#app' { interface NuxtApp { $getConsoleLayout: (path: string) => string; } }`,
            );
        });
    },
});
