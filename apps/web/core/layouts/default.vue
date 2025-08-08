<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";

import type { NavigationConfig } from "@/app/console/decorate/layout/types";
import { apiGetWebLayoutConfig } from "@/services/web/decorate";

const layoutToComponentMap: Record<string, string> = {
    "layout-1": "style1", // 顶部导航1 -> style1
    "layout-2": "style2", // 顶部导航2 -> style2
    "layout-3": "style3", // 顶部导航3 -> style3
    "layout-4": "style4", // 侧边导航1 -> style4
    "layout-5": "style5", // 侧边导航2 -> style5
};

const { data: layoutResponse } = await useAsyncData(
    "web-layout-config",
    () => apiGetWebLayoutConfig("web"),
    {
        // 默认配置
        default: () => ({
            code: 200,
            data: {
                layout: "layout-5",
                menus: [],
            },
            message: "success",
        }),
        server: import.meta.server,
    },
);

const controlsStore = useControlsStore();

/** 响应式布局配置 */
const layoutConfig = computed(() => {
    return (
        layoutResponse.value?.data || {
            layout: "layout-5",
            menus: [],
        }
    );
});

controlsStore.setLayoutStyle(layoutConfig.value.layout as string);

/** 动态导入布局组件 */
const LayoutComponent = computed(() => {
    const componentName = layoutToComponentMap[layoutConfig.value.layout] || "style1";
    return defineAsyncComponent(() => import(`@/common/components/layout/${componentName}.vue`));
});

/** 构建导航配置 */
const navigationConfig = computed((): NavigationConfig => {
    return {
        items: layoutConfig.value.menus || [
            {
                id: "1",
                title: "首页",
                link: { path: "/" },
                icon: "i-lucide-home",
            },
            {
                id: "2",
                title: "用户",
                link: { path: "/profile" },
                icon: "i-lucide-user",
            },
        ],
    };
});
</script>

<template>
    <component :is="LayoutComponent" :navigation-config="navigationConfig">
        <slot />
    </component>
</template>
