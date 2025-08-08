<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";

import mixture from "@/common/components/console/layout/mixture/index.vue";
import sidebar from "@/common/components/console/layout/sidebar/index.vue";
import { STORAGE_KEYS } from "@/common/constants";

const controls = useControlsStore();
const isMobile = useMediaQuery("(max-width: 768px)");

const autoSwitchLayoutForMobile = (isMobile: boolean) => {
    if (isMobile && controls.consoleLayoutMode !== "side") {
        controls.consoleTempLayoutMode = controls.consoleLayoutMode;
        controls.consoleLayoutMode = "side";
        useCookie(STORAGE_KEYS.LAYOUT_MODE).value = "side";
    } else if (!isMobile && controls.consoleTempLayoutMode) {
        // 先恢复到原来的布局模式
        const originalMode = controls.consoleTempLayoutMode;
        controls.consoleLayoutMode = originalMode;
        useCookie(STORAGE_KEYS.LAYOUT_MODE).value = originalMode;
        // 最后清空临时布局模式
        controls.consoleTempLayoutMode = "";
    }
};

watch(isMobile, autoSwitchLayoutForMobile, { immediate: true });
</script>

<template>
    <main>
        <!-- 侧边栏布局 -->
        <sidebar v-if="controls.consoleLayoutMode === 'side'" />
        <!-- 顶部+侧边栏混合布局 -->
        <mixture v-else-if="controls.consoleLayoutMode === 'mixture'" />

        <!-- 全局搜索组件 -->
        <ConsoleDashboardSearch />
    </main>
</template>
