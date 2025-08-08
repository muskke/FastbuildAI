<script setup lang="ts">
/**
 * 布局预览面板组件
 * @description 用于预览不同布局样式的效果，使用全局布局组件
 */
import ProPlaceholder from "@fastbuildai/ui/components/pro-placeholder.vue";

import { useLayoutStore } from "../stores/layout";

const layoutStore = useLayoutStore();

// 计算属性
const currentLayoutStyle = computed(() => layoutStore.currentLayoutStyle);
const navigationConfig = computed(() => layoutStore.navigationConfig);

// 当前布局组件 - 更新组件映射
const currentLayoutComponent = computed(() => {
    const componentMap = {
        Layout1: markRaw(
            defineAsyncComponent(() => import("@/common/components/layout/style1.vue")),
        ),
        Layout2: markRaw(
            defineAsyncComponent(() => import("@/common/components/layout/style2.vue")),
        ),
        Layout3: markRaw(
            defineAsyncComponent(() => import("@/common/components/layout/style3.vue")),
        ),
        Layout4: markRaw(
            defineAsyncComponent(() => import("@/common/components/layout/style4.vue")),
        ),
        Layout5: markRaw(
            defineAsyncComponent(() => import("@/common/components/layout/style5.vue")),
        ),
    };
    return (
        componentMap[currentLayoutStyle.value.component as keyof typeof componentMap] ||
        componentMap.Layout1
    );
});
</script>

<template>
    <div class="bg-muted flex h-full flex-1 flex-col rounded-lg">
        <!-- 预览内容区域 -->
        <div class="pointer-events-none flex h-full w-full justify-center">
            <!-- 动态渲染布局组件 -->
            <component
                :is="currentLayoutComponent"
                :has-preview="true"
                :navigation-config="JSON.parse(JSON.stringify(navigationConfig))"
            >
                <ProPlaceholder class="!m-0 !ml-4" />
            </component>
        </div>
    </div>
</template>
