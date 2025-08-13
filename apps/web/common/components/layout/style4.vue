<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import type { NavigationConfig } from "@/app/console/decorate/layout/types";
import { ROUTES } from "@/common/constants/routes.constant";

const UserProfile = defineAsyncComponent(() => import("./components/user-profile.vue"));
const ConsoleLayoutSiteLogo = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/site-logo.vue"),
);

interface Props {
    navigationConfig: NavigationConfig;
}

const props = defineProps<Props>();
const { t } = useI18n();
const userStore = useUserStore();

// 侧边栏折叠状态
const collapsed = ref(false);
// 移动端菜单状态
const mobileMenuOpen = ref(false);

/**
 * 将 NavigationConfig 转换为 NavigationMenuItem 格式
 * 参考 index.vue 的数据结构
 */
const navigationItems = computed((): NavigationMenuItem[][] => {
    const items = props.navigationConfig.items.map((item: NavigationMenuItem) => ({
        label: item.title,
        icon: item.icon,
        badge: item.badge,
        to: item.link?.path || "/",
        active:
            item.link?.path === useRoute().path || item.link?.path === useRoute().meta.activePath,
        target: item.link?.path?.startsWith("http") ? "_blank" : undefined,
        children: item.children?.map((child: NavigationMenuItem) => ({
            label: child.title,
            icon: child.icon,
            badge: child.badge,
            to: child.link?.path || "/",
            target: child.link?.path?.startsWith("http") ? "_blank" : undefined,
        })),
    }));

    return [
        [
            {
                label: "导航菜单",
                type: "label",
            },
            ...items,
        ],
    ];
});

/**
 * 底部链接菜单
 * 参考 index.vue 的 linkItems
 */
const linkItems = computed((): NavigationMenuItem[] => [
    {
        label: t("common.menu.workspace"),
        icon: "i-lucide-layout-dashboard",
        target: "_blank",
        to: ROUTES.CONSOLE,
    },
]);
</script>

<template>
    <div class="bg-muted/50 flex h-full w-full flex-row">
        <!-- 桌面版侧边栏 - 参考 index.vue 的实现 -->
        <aside
            class="relative hidden h-full flex-col p-2 transition-all duration-300 md:flex"
            :class="{ 'w-18': collapsed, 'w-54': !collapsed }"
        >
            <!-- 顶部Logo区域 -->
            <ConsoleLayoutSiteLogo layout="side" :collapsed="collapsed" :isWeb="true" />

            <!-- 菜单区域 - 完全参考 index.vue 的结构 -->
            <div class="flex flex-grow flex-col overflow-y-auto px-1.5 py-4">
                <!-- 主导航菜单 -->
                <div>
                    <UNavigationMenu
                        :collapsed="collapsed"
                        orientation="vertical"
                        :items="navigationItems"
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

                <!-- 底部链接菜单 -->
                <UNavigationMenu
                    v-if="userStore.userInfo?.permissions"
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

            <!-- 折叠/展开按钮 -->
            <div
                class="transition-left absolute z-50 hidden duration-300 md:block"
                :style="{ bottom: '30%', left: collapsed ? '54px' : '200px' }"
            >
                <UButton
                    :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    class="bg-background rounded-full border p-2 shadow-md"
                    @click="collapsed = !collapsed"
                >
                    <span class="sr-only">
                        {{ collapsed ? "展开侧边栏" : "折叠侧边栏" }}
                    </span>
                </UButton>
            </div>

            <!-- 底部用户头像 -->
            <UserProfile
                :size="collapsed ? 'md' : 'lg'"
                :collapsed="collapsed"
                :content="{
                    side: 'bottom',
                    align: 'start',
                    sideOffset: -60,
                    alignOffset: collapsed ? 120 : 220,
                }"
            />
        </aside>

        <!-- 主要内容区域 -->
        <main class="bg-background flex min-w-0 flex-1 flex-col overflow-y-scroll rounded-l-xl">
            <slot />
        </main>
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
