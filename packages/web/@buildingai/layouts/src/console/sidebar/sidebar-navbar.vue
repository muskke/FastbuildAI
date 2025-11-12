<script setup lang="ts">
import { ROUTES } from "@buildingai/constants/web";
import { useMediaQuery } from "@vueuse/core";

import type { BreadcrumbItem } from "#ui/types";

import { buildBreadcrumbs } from "../../menu-helper";

const SidebarTrigger = defineAsyncComponent(() => import("./sidebar-trigger.vue"));
const ReloadButton = defineAsyncComponent(() => import("../components/button-reload.vue"));
const GoHomeButton = defineAsyncComponent(() => import("../components/button-go-home.vue"));

const props = defineProps<{
    /** 是否折叠侧边栏 */
    collapsed?: boolean;
}>();

const emit = defineEmits<{
    /** 折叠状态变化事件 */
    (e: "toggle", value: boolean): void;
    /** 打开移动菜单事件 */
    (e: "open-mobile-menu"): void;
}>();

const { t } = useI18n();
const isMobile = useMediaQuery("(max-width: 768px)");

/** 切换侧边栏折叠状态或打开移动菜单 */
function toggleSidebar() {
    if (isMobile.value) {
        // 通知布局组件打开移动菜单
        emit("open-mobile-menu");
    } else {
        // 桌面模式切换侧边栏
        emit("toggle", !props.collapsed);
    }
}

/** 面包屑导航数据 */
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    return buildBreadcrumbs(useRoute().path, ROUTES.CONSOLE, t("layouts.admin"));
});
</script>

<template>
    <header
        class="flex h-16 w-full shrink-0 items-center justify-between gap-4 px-4 transition-all ease-linear"
        :class="{ 'h-12': collapsed }"
    >
        <div class="flex items-center gap-2">
            <!-- 侧边栏折叠按钮 -->
            <SidebarTrigger :collapsed="collapsed" @toggle="toggleSidebar" />

            <!-- 页面刷新按钮 -->
            <ReloadButton />

            <!-- 分隔线 -->
            <USeparator orientation="vertical" class="h-4" />

            <!-- 面包屑导航 -->
            <UBreadcrumb :items="breadcrumbs" :ui="{ root: 'ml-2' }">
                <template #separator>
                    <span class="bg-muted-foreground mx-2 rounded-full p-0.5"></span>
                </template>
            </UBreadcrumb>
        </div>

        <!-- 右侧工具区域 -->
        <div class="flex items-center gap-2">
            <GoHomeButton />
        </div>

        <!-- 消息通知 -->
        <!-- <div>
            <UChip color="error" :inset="true" :show="true">
                <UButton
                    data-sidebar="trigger"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :ui="{ base: 'py-2' }"
                >
                    <span class="sr-only">Page Refresh</span>
                    <UIcon name="i-lucide-bell" class="size-4" />
                </UButton>
            </UChip>
        </div> -->
    </header>
</template>
