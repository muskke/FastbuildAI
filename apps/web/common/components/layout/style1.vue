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
}

const props = defineProps<Props>();

const userStore = useUserStore();

// 移动端菜单状态
const mobileMenuOpen = ref(false);
const expandedMobileMenu = ref<string | null>(null);

// 监听点击外部关闭移动端菜单
onMounted(() => {
    const handleClickOutside = (event: Event) => {
        const target = event.target as Element;
        if (!target.closest("header")) {
            mobileMenuOpen.value = false;
            expandedMobileMenu.value = null;
        }
    };

    document.addEventListener("click", handleClickOutside);

    onUnmounted(() => {
        document.removeEventListener("click", handleClickOutside);
    });
});
</script>

<template>
    <div class="bg-muted flex h-full w-full flex-col">
        <!-- 顶部导航栏 -->
        <header class="sticky top-0 z-50 p-4">
            <div
                class="border-box relative flex h-[var(--navbar-height)] w-full items-center justify-between rounded-lg border border-transparent px-2 py-1.5 shadow-[0px_5px_18px_rgba(204,_204,_204,_0.2)] backdrop-blur-sm transition-[box-shadow_background-color_border-color] duration-300 motion-reduce:transition-none lg:grid lg:grid-cols-[1fr_auto_1fr] lg:rounded-2xl lg:py-[0.4375rem] lg:pr-[0.4375rem] dark:shadow-[0px_5px_18px_rgba(204,_204,_204,_0.1)]"
            >
                <!-- Logo 和品牌名称 -->
                <ConsoleLayoutSiteLogo layout="mixture" />

                <!-- 桌面端导航菜单 -->
                <ul
                    class="text-brand-neutrals-700 dark:text-brand-neutrals-200 col-start-2 hidden gap-2 px-2 font-medium lg:flex xl:gap-4"
                >
                    <li v-for="item in props.navigationConfig.items" :key="item.id">
                        <!-- 普通菜单项 -->
                        <NuxtLink
                            :to="item.link?.path || '/'"
                            :target="item.link?.path?.startsWith('http') ? '_blank' : '_self'"
                            :rel="item.link?.path?.startsWith('http') ? 'noopener noreferrer' : ''"
                            class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors duration-300 motion-reduce:transition-none"
                            :class="{
                                'bg-primary text-white':
                                    item.link?.path === useRoute().path ||
                                    item.link?.path === useRoute().meta.activePath,
                            }"
                        >
                            <Icon v-if="item.icon" :name="item.icon" class="mr-1 inline-block" />
                            <span class="text-sm font-medium">{{ item.title }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <!-- 右侧操作区域 -->
                <div class="col-start-3 hidden w-full items-center justify-end gap-3 lg:flex">
                    <!-- 主题切换 -->
                    <ThemeToggle />

                    <!-- 用户头像菜单 -->
                    <UserProfile
                        size="md"
                        :collapsed="false"
                        :content="{
                            side: 'bottom',
                            align: 'center',
                            sideOffset: 20,
                        }"
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
                <MobileMenuButton
                    :expanded="mobileMenuOpen"
                    @click="mobileMenuOpen = !mobileMenuOpen"
                />

                <!-- 移动端导航菜单 -->
                <MobileNavigation
                    v-model="mobileMenuOpen"
                    :navigation-config="navigationConfig"
                    :show-workspace-button="false"
                />
            </div>
        </header>

        <!-- 主要内容区域 -->
        <main class="bg-background shadow-default h-full flex-1 overflow-hidden rounded-t-xl">
            <slot />
        </main>
    </div>
</template>
