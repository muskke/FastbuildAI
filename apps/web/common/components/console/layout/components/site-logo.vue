<script lang="ts" setup>
import { ROUTES } from "@/common/constants/routes.constant";
import Logo from "@/public/logo.svg";
import LogoFull from "@/public/logo-full.svg";

const props = defineProps<{
    layout: "side" | "mixture";
    collapsed?: boolean;
    isWeb?: boolean;
}>();

const appStore = useAppStore();

function backToHome() {
    return navigateTo(ROUTES.HOME);
}

// 设置 inheritAttrs 为 false，手动处理 attrs 的继承
defineOptions({ inheritAttrs: false });
</script>

<template>
    <h1
        v-if="props.layout === 'side'"
        v-bind="$attrs"
        class="hover:bg-secondary dark:hover:bg-surface-800 flex cursor-pointer items-center gap-2 rounded-xl select-none"
        :class="props.collapsed ? 'p-1' : 'p-2'"
        @click="backToHome"
    >
        <div
            class="bg-primary flex flex-none items-center justify-center rounded-lg transition-all"
            :class="props.collapsed ? 'size-10' : 'size-9'"
        >
            <img
                v-if="appStore.siteConfig?.webinfo.logo"
                :src="appStore.siteConfig?.webinfo.logo"
                alt="Logo"
                class="size-8"
            />

            <Logo v-else class="text-background size-7" :fontControlled="false" filled />
        </div>
        <div
            class="flex flex-col gap-0.5 truncate leading-none whitespace-nowrap"
            :class="{ hidden: props.collapsed }"
        >
            <span class="text-sm font-bold">{{ appStore.siteConfig?.webinfo.name }}</span>
            <span v-if="!props.isWeb" class="text-muted-foreground truncate text-xs">
                {{ $t("console-common.admin") }}
            </span>
        </div>
    </h1>
    <h1 v-if="props.layout === 'mixture'" class="flex items-center truncate" @click="backToHome">
        <template v-if="appStore.siteConfig?.webinfo.logo">
            <img :src="appStore.siteConfig?.webinfo.logo" alt="Logo" class="h-8 w-8 flex-none" />
            <span class="ml-2 truncate text-lg font-bold">{{
                appStore.siteConfig?.webinfo.name
            }}</span>
        </template>

        <!-- 没有logo的时候显示全称 -->
        <LogoFull v-else class="text-foreground h-6" filled :fontControlled="false" />
    </h1>
</template>
