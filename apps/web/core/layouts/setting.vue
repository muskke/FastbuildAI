<script lang="ts" setup>
/**
 * 个人中心布局组件
 * @description 提供个人中心页面的通用布局，包括左侧导航栏和右侧内容区域
 */

import { computed, defineAsyncComponent } from "vue";

import type { NavigationConfig } from "@/app/console/decorate/layout/types";
import { apiGetWebLayoutConfig } from "@/services/web/decorate";
import type { IconType } from "@/types/icon";
const router = useRouter();
const { t } = useI18n();
const route = useRoute();

// 导航菜单项的类型定义
interface MenuItem {
    label: string;
    icon: IconType;
    children?: {
        label: string;
        icon: IconType;
        to: string;
        slot?: string;
    }[];
}

// 导航菜单项
const items = computed<MenuItem[]>(() => [
    {
        label: t("common.label.personalRights"),
        icon: "i-lucide-book-open",
        children: [
            {
                label: t("common.personalRights.rechargeCenter"),
                icon: "lucide:badge-dollar-sign",
                to: "/profile/personal-rights/recharge-center",
            },
        ],
    },
    {
        label: t("common.label.profile"),
        icon: "i-lucide-book-open",
        children: [
            {
                label: t("common.profile.title"),
                icon: "i-lucide-user",
                to: "/profile",
            },
            {
                label: t("common.settings.mcpServer"),
                icon: "i-lucide-wind",
                to: "/profile/mcp-server-settings",
            },
            {
                label: t("common.profile.purchaseRecord"),
                icon: "lucide:clock-8",
                to: "/profile/purchase-record",
            },
            {
                label: t("common.profile.powerDetail"),
                icon: "i-lucide-database-zap",
                to: "/profile/power-detail",
            },
            {
                label: t("common.settings.general"),
                icon: "i-lucide-settings-2",
                slot: "components" as const,
                to: "/profile/general-settings",
            },
        ],
    },
]);

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

/** 响应式布局配置 */
const layoutConfig = computed(() => {
    return (
        layoutResponse.value?.data || {
            layout: "layout-5",
            menus: [],
        }
    );
});
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

const pageTitle = ref(route.meta.title as string);

watch(
    () => route.meta.title,
    () => {
        pageTitle.value = route.meta.title as string;
    },
);
</script>

<template>
    <component :is="LayoutComponent" :navigation-config="navigationConfig" class="h-screen">
        <div class="container mx-auto flex h-full justify-between gap-12 py-8">
            <!-- 导航栏 -->
            <div
                class="bg-muted flex w-52 flex-col gap-2 rounded-lg p-4"
                :style="{
                    '--text-color-muted': 'var(--color-accent-foreground)',
                    '--text-color-dimmed': 'var(--color-accent-foreground)',
                }"
            >
                <div v-for="item in items" :key="item.label" class="flex flex-col gap-2">
                    <!-- 分组标题 -->
                    <div class="text-muted-foreground px-2 py-1 text-xs font-medium">
                        {{ item.label }}
                    </div>

                    <!-- 分组内的对话项 -->
                    <div class="flex flex-col gap-2">
                        <div
                            v-for="category in item.children"
                            :key="category.label"
                            class="group relative"
                        >
                            <UButton
                                :label="category.label"
                                :ui="{
                                    base: 'flex justify-between w-full gap-2 cursor-pointer relative pl-6 py-2',
                                }"
                                :variant="category.to === route.path ? 'soft' : 'ghost'"
                                :color="category.to === route.path ? 'primary' : 'neutral'"
                                @click="router.push(category.to)"
                            >
                                <template v-if="typeof category.icon === 'string'">
                                    <UIcon :name="category.icon" size="16" />
                                </template>
                                <template
                                    v-else-if="
                                        typeof category.icon === 'object' &&
                                        category.icon?.type === 'svg'
                                    "
                                >
                                    <div
                                        class="flex size-4 items-center justify-center"
                                        v-html="category.icon.content"
                                    ></div>
                                </template>
                                <span class="block flex-1 truncate text-left">
                                    {{ category.label }}
                                </span>
                            </UButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="flex flex-1 flex-col">
                <!-- 返回按钮和标题 -->
                <div class="mb-12 flex h-fit items-center gap-2">
                    <UButton
                        variant="soft"
                        color="primary"
                        icon="i-heroicons-arrow-left"
                        @click="router.push('/')"
                    />
                    <h1 class="flex-1 pr-[36px] text-center text-xl font-semibold">
                        <slot name="page-title">{{ t(pageTitle) }}</slot>
                    </h1>
                </div>

                <!-- 页面内容插槽 -->
                <div class="flex-1 overflow-y-auto">
                    <slot />
                </div>
            </div>
        </div>
    </component>
</template>
