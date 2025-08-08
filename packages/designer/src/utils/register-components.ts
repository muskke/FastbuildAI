import type { Component } from "vue";
import { defineAsyncComponent } from "vue";

import { DEFAULT_DEVICE_TYPE } from "../config/design";

type ComponentType = "content" | "attribute";

/**
 * 动态注册组件
 * @param type 组件类型
 * @returns 组件映射表 { componentName: Component }
 */
export function registerComponents(type: ComponentType = "content") {
    const components: Record<string, Component> = {};

    // 动态导入PC组件
    const webWidgets = import.meta.glob("../components/widgets/web/**/*.vue", { eager: false });

    // 动态导入Mobile组件
    const mobileWidgets = import.meta.glob("../components/widgets/mobile/**/*.vue", {
        eager: false,
    });

    // 根据设备类型选择要处理的模块集合
    const modulesToProcess = DEFAULT_DEVICE_TYPE.value === "web" ? [webWidgets] : [mobileWidgets];

    // 处理每个模块集合
    for (const modules of modulesToProcess) {
        // 根据类型过滤和注册组件
        Object.entries(modules).forEach(([filePath, component]) => {
            if (filePath.endsWith(`/${type}.vue`)) {
                const match = filePath.match(/\/(web|mobile)\/([^/]+)\//);
                if (match?.[2]) {
                    components[match[2]] = defineAsyncComponent(component as any);
                }
            }
        });
    }

    return components;
}
