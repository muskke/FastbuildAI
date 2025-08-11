<script setup lang="ts">
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
    hasPreview?: boolean;
}

const props = defineProps<Props>();

// 移动端侧边栏状态
const isOpen = ref(false);

// 获取应用状态和用户状态
const userStore = useUserStore();

// 监听点击外部关闭移动端菜单
onMounted(() => {
    const handleClickOutside = (event: Event) => {
        const target = event.target as Element;
        if (!target.closest("[data-mobile-menu]")) {
            isOpen.value = false;
        }
    };

    document.addEventListener("click", handleClickOutside);

    onUnmounted(() => {
        document.removeEventListener("click", handleClickOutside);
    });
});
</script>

<template>
    <div class="bg-muted/50 flex h-full w-full flex-col">
        <!-- 顶部导航栏 -->
        <header class="relative w-full">
            <div class="flex w-full items-center justify-between p-4">
                <ConsoleLayoutSiteLogo layout="mixture" />

                <!-- 中间浮动导航菜单（桌面端） -->
                <ul
                    class="border-border/50 bg-background/60 fixed top-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-6 rounded-full border px-8 py-2 backdrop-blur-sm lg:flex"
                    :class="{ '!left-inherit !static !translate-x-0': hasPreview }"
                >
                    <li
                        v-for="item in navigationConfig.items"
                        :key="item.id"
                        class="hover:text-primary transition-colors duration-200"
                    >
                        <NuxtLink
                            :to="item.link?.path || '/'"
                            :target="item.link?.path?.startsWith('http') ? '_blank' : '_self'"
                            :rel="item.link?.path?.startsWith('http') ? 'noopener noreferrer' : ''"
                            class="flex items-center justify-center gap-1 text-sm font-medium"
                            :class="{
                                'text-primary':
                                    item.link?.path === useRoute().path ||
                                    item.link?.path === useRoute().meta.activePath,
                            }"
                        >
                            <Icon v-if="item.icon" :name="item.icon" size="16" />
                            <span>{{ item.title }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <!-- 右侧操作区域（桌面端） -->
                <div class="hidden items-center gap-3 lg:flex">
                    <!-- 主题切换 -->
                    <ThemeToggle />

                    <!-- 用户头像 -->
                    <UserProfile
                        :collapsed="false"
                        :content="{
                            side: 'bottom',
                            align: 'center',
                            sideOffset: 20,
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
                <MobileMenuButton :expanded="isOpen" @click="isOpen = true" />

                <!-- 移动端导航菜单 -->
                <MobileNavigation v-model="isOpen" :navigation-config="navigationConfig" />
            </div>
        </header>

        <!-- 主要内容区域 -->
        <main class="bg-background shadow-default h-full flex-1 overflow-hidden rounded-t-xl">
            <slot />
        </main>
    </div>
</template>
