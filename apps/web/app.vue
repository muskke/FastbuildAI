<script setup lang="ts">
import * as uiLocale from "@nuxt/ui/locale";
import colors from "tailwindcss/colors";

import { uiI18nMap } from "./core/i18n/language";

const { locale } = useI18n();
const appConfig = useAppConfig();
const colorMode = useColorMode();
const appStore = useAppStore();
const userStore = useUserStore();

const color = computed(() =>
    colorMode.value === "dark" ? (colors as any)[appConfig.ui.colors.neutral][900] : "white",
);
const radius = computed(() => `:root { --ui-radius: ${appConfig.theme.radius}rem; }`);
const blackAsPrimary = computed(() =>
    appConfig.theme.blackAsPrimary
        ? `:root { --ui-primary: black; --color-primary: black; } .dark { --ui-primary: white; --color-primary: white;}`
        : ":root {}",
);

/** 获取全局配置 */
await useAsyncData("config", () => appStore.getConfig(), {
    lazy: import.meta.server,
});

/** 获取用户信息 */
await useAsyncData("users", () => userStore.getUser(), {
    lazy: import.meta.server,
});

useHead({
    title: appStore.siteConfig?.webinfo?.name,
    meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { key: "theme-color", name: "theme-color", content: color },
    ],
    link: [
        { rel: "icon", href: appStore.siteConfig?.webinfo?.icon || "/favicon.ico" },
        { rel: "apple-touch-icon", href: appStore.siteConfig?.webinfo?.logo || "/favicon.ico" },
    ],
    style: [
        { innerHTML: radius, id: "nuxt-ui-radius", tagPriority: -2 },
        { innerHTML: blackAsPrimary, id: "nuxt-ui-black-as-primary", tagPriority: -2 },
    ],
    htmlAttrs: {
        lang: useCookie("nuxt-ui-language")?.value || locale.value || "zh-Hans",
    },
});

useSeoMeta({
    title: appStore.siteConfig?.webinfo?.name,
    description: appStore.siteConfig?.webinfo?.description || "",
    ogTitle: appStore.siteConfig?.webinfo?.name,
    ogDescription: appStore.siteConfig?.webinfo?.description || "",
    ogImage: appStore.siteConfig?.webinfo?.logo,
    ogType: "website",
    ogLocale: locale.value,
    ogSiteName: appStore.siteConfig?.webinfo?.name,
});
</script>

<template>
    <UApp
        :toaster="appConfig.toaster"
        :locale="uiLocale[uiI18nMap[locale] as keyof typeof uiLocale]"
        data-vaul-drawer-wrapper
    >
        <!-- 加载指示器 -->
        <NuxtLoadingIndicator color="var(--ui-primary)" :height="2" />
        <!-- 路由变化提示 用于屏幕阅读器 -->
        <NuxtRouteAnnouncer />
        <!-- 页面布局 -->
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
