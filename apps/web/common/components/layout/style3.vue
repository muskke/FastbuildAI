<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import type { NavigationConfig } from "@/app/console/decorate/layout/types";
import { ROUTES } from "@/common/constants/routes.constant";

const MobileMenuButton = defineAsyncComponent(() => import("./components/mobile-menu-button.vue"));
const MobileNavigation = defineAsyncComponent(() => import("./components/mobile-navigation.vue"));
const UserProfile = defineAsyncComponent(() => import("./components/user-profile.vue"));
const ConsoleLayoutSiteLogo = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/site-logo.vue"),
);

interface Props {
    navigationConfig: NavigationConfig;
}

const props = defineProps<Props>();

const userStore = useUserStore();

// 移动端菜单状态
const mobileMenuOpen = ref(false);

/**
 * 将 NavigationConfig 转换为 NavigationMenuItem 格式
 */
const navigationItems = computed((): NavigationMenuItem[] => {
    return props.navigationConfig.items.map((item: NavigationMenuItem) => ({
        label: item.title,
        icon: item.icon,
        badge: item.badge,
        to: item.link?.path || "/",
        active:
            item.link?.path === useRoute().path || item.link?.path === useRoute().meta.activePath,
        target: item.link?.path?.startsWith("http") ? "_blank" : undefined,
        children: item.children?.map((child: NavigationMenuItem) => ({
            label: child.title,
            description: `前往 ${child.title}`,
            icon: child.icon,
            to: child?.link?.path || "/",
            target: child?.link?.path?.startsWith("http") ? "_blank" : undefined,
        })),
    }));
});
</script>

<template>
    <div class="bg-muted/50 flex h-full w-full flex-col">
        <!-- 使用 Nuxt UI NavigationMenu 的现代导航 -->
        <header class="px-4 py-2">
            <div class="flex items-center justify-between">
                <!-- 左侧 Logo -->
                <ConsoleLayoutSiteLogo layout="mixture" />

                <!-- 桌面端导航菜单 -->
                <div class="hidden md:flex md:flex-1 md:justify-center">
                    <UNavigationMenu
                        :items="navigationItems"
                        orientation="horizontal"
                        variant="pill"
                        color="primary"
                    />
                </div>

                <!-- 右侧操作区 -->
                <div class="hidden items-center gap-3 md:flex">
                    <!-- 主题切换 -->
                    <ThemeToggle />

                    <!-- 用户头像 -->
                    <UserProfile
                        :collapsed="false"
                        :content="{
                            side: 'bottom',
                            align: 'center',
                        }"
                        size="md"
                    >
                        <template #default>
                            <UAvatar :src="userStore.userInfo?.avatar" size="md" />
                        </template>
                    </UserProfile>

                    <!-- 工作台按钮 -->
                    <UButton
                        v-if="userStore.userInfo?.permissions"
                        :ui="{ base: 'rounded-full' }"
                        :to="ROUTES.CONSOLE"
                        color="primary"
                    >
                        {{ $t("common.menu.workspace") }}
                    </UButton>
                </div>

                <!-- 移动端菜单按钮 -->
                <div class="md:hidden">
                    <MobileMenuButton
                        :expanded="mobileMenuOpen"
                        :show-user-profile="false"
                        @click="mobileMenuOpen = !mobileMenuOpen"
                    />
                </div>
            </div>

            <!-- 移动端导航菜单 -->
            <MobileNavigation v-model="mobileMenuOpen" :navigation-config="navigationConfig" />
        </header>

        <!-- 主要内容区域 -->
        <main class="bg-background shadow-default h-full flex-1 overflow-hidden rounded-t-xl">
            <slot />
        </main>
    </div>
</template>
