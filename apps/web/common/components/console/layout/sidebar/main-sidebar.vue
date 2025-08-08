<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { computed, ref } from "vue";

import { buildSidebarItems } from "@/common/utils/menu-helper";

const ConsoleLayoutSiteLogo = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/site-logo.vue"),
);
const UserMenu = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/user-menu.vue"),
);
const ConsoleDashboardSearchButton = defineAsyncComponent(
    () => import("@/common/components/console/dashboard-search/button.vue"),
);

import { ProScrollArea } from "@fastbuildai/ui";

const props = defineProps<{
    /** 是否折叠 */
    collapsed?: boolean;
    /** 是否打开移动端菜单 */
    mobileMenu?: boolean;
}>();

const emits = defineEmits<{
    /** 打开移动端菜单 */
    (e: "update:mobileMenu"): void;
}>();

const isOpen = useVModel(props, "mobileMenu", emits);
defineShortcuts({
    o: () => (isOpen.value = !isOpen.value),
});

const { t } = useI18n();

const collapsed = computed(() => props.collapsed);

/**
 * 构建导航菜单
 */
const items = computed<NavigationMenuItem[][]>(() => {
    const navigationItems = buildSidebarItems(useRoute().path);

    return [
        [
            {
                label: t("console-menu.functionMenu"),
                type: "label",
            },
            ...navigationItems,
        ],
    ];
});

const linkItems = computed<NavigationMenuItem[]>(() => [
    // {
    //     label: t("console-common.pluginMarket"),
    //     icon: "i-lucide-box",
    //     to: "https://fastbuildai-shop.yixiangonline.com",
    //     target: "_blank",
    // },
]);
</script>

<template>
    <div>
        <!-- 桌面版侧边栏 - 在移动端隐藏 -->
        <aside
            class="bg-sidebar hidden h-screen flex-col p-2 transition-all duration-300 md:flex"
            :class="{ 'w-16': collapsed, 'w-64': !collapsed }"
        >
            <!-- 顶部Logo区域 -->
            <ConsoleLayoutSiteLogo layout="side" :collapsed="collapsed" />

            <!-- 菜单区域 -->
            <ProScrollArea class="flex-1">
                <div class="flex flex-grow flex-col overflow-y-auto px-1.5 py-4">
                    <!-- 搜索按钮 -->
                    <ConsoleDashboardSearchButton
                        v-if="!collapsed"
                        class="mt-1 mb-3 overflow-hidden"
                    />

                    <!-- 菜单 -->
                    <div
                        :style="{
                            '--text-color-muted': 'var(--color-accent-foreground)',
                            '--text-color-dimmed': 'var(--color-accent-foreground)',
                        }"
                    >
                        <UNavigationMenu
                            :collapsed="collapsed"
                            orientation="vertical"
                            :items="items"
                            :ui="{
                                list: 'navbar-menu',
                                link: collapsed
                                    ? 'justify-center py-3 hover:bg-secondary dark:hover:bg-surface-800 rounded-lg'
                                    : 'justify-start hover:bg-secondary dark:hover:bg-surface-800 p-2 px-3 leading-6 rounded-lg',
                                linkLeadingIcon: collapsed ? 'size-5' : 'size-4',
                            }"
                        >
                            <template #item-trailing="{ item }">
                                <UIcon
                                    v-if="item.children?.length"
                                    name="i-lucide-chevron-right"
                                    class="iconify iconify--lucide size-4 shrink-0 transform transition-transform duration-200 group-data-[state=open]:rotate-90"
                                />
                            </template>
                        </UNavigationMenu>
                    </div>
                    <UNavigationMenu
                        :collapsed="collapsed"
                        orientation="vertical"
                        :items="linkItems"
                        class="mt-auto w-full"
                        :ui="{
                            list: 'navbar-other',
                            link: collapsed
                                ? 'justify-center py-3 hover:bg-secondary dark:hover:bg-surface-800 rounded-lg'
                                : 'justify-start hover:bg-secondary dark:hover:bg-surface-800 p-2 px-3 leading-6 rounded-lg',
                            linkLeadingIcon: collapsed ? 'size-5' : 'size-4',
                        }"
                    />
                </div>
            </ProScrollArea>

            <!-- 底部折叠按钮 -->
            <UserMenu
                mode="sidebar"
                :collapsed="collapsed"
                :mobile-menu="false"
                @update:collapsed="collapsed = $event"
            />
        </aside>

        <!-- 移动端菜单 -->
        <USlideover v-model:open="isOpen" side="left" :ui="{ content: '!w-fit flex-0 max-w-fit' }">
            <template #content>
                <aside
                    class="bg-sidebar flex h-screen w-64 flex-col p-2 transition-all duration-300"
                >
                    <!-- 顶部Logo区域 -->
                    <ConsoleLayoutSiteLogo layout="side" :collapsed="false" />

                    <!-- 菜单区域 -->
                    <div class="flex flex-grow flex-col overflow-y-auto py-4">
                        <div
                            :style="{
                                '--text-color-muted': 'var(--color-accent-foreground)',
                                '--text-color-dimmed': 'var(--color-accent-foreground)',
                            }"
                        >
                            <UNavigationMenu
                                :collapsed="false"
                                orientation="vertical"
                                :items="items"
                                :ui="{
                                    list: 'navbar-menu',
                                    link: 'justify-start hover:bg-secondary dark:hover:bg-surface-800 p-2 px-3 leading-6 rounded-lg',
                                    linkLeadingIcon: 'size-4',
                                }"
                            >
                                <template #item-trailing="{ item }">
                                    <UIcon
                                        v-if="item.children?.length"
                                        name="i-lucide-chevron-right"
                                        class="iconify iconify--lucide size-4 shrink-0 transform transition-transform duration-200 group-data-[state=open]:rotate-90"
                                    />
                                </template>
                            </UNavigationMenu>
                        </div>
                        <UNavigationMenu
                            :collapsed="false"
                            orientation="vertical"
                            :items="linkItems"
                            class="mt-auto w-full"
                            :ui="{
                                list: 'navbar-other',
                                link: 'justify-start hover:bg-secondary dark:hover:bg-surface-800 p-2 px-3 leading-6 rounded-lg',
                                linkLeadingIcon: 'size-4',
                            }"
                        />
                    </div>

                    <!-- 底部折叠按钮 -->
                    <UserMenu
                        mode="sidebar"
                        :collapsed="collapsed"
                        :mobile-menu="true"
                        @update:collapsed="collapsed = $event"
                    />
                </aside>
            </template>
        </USlideover>
    </div>
</template>

<style lang="scss" scoped>
aside :deep(.navbar-menu) > li:not(:first-child) {
    margin-bottom: 4px;
}
aside :deep(.navbar-menu) {
    .text-dimmed {
        color: var(--color-accent-foreground);
    }
    .text-muted {
        color: var(--color-accent-foreground);
    }
}

aside :deep(.navbar-other) {
    a .iconify {
        color: var(--color-accent-foreground);
    }
    a .truncate {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--color-accent-foreground);

        svg {
            width: 16px;
            height: 16px;
        }
    }
}
</style>
