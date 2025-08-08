<script lang="ts" setup>
import { useImagePreview } from "@fastbuildai/ui";

import TimeDisplay from "@/common/components/time-display.vue";
import type { PluginMarketItem } from "@/models/plugin-market";

/**
 * 插件详情抽屉组件
 */
interface Props {
    /** 是否显示抽屉 */
    modelValue: boolean;
    /** 选中的插件 */
    plugin: PluginMarketItem | null;
}

interface Emits {
    /** 更新显示状态 */
    (e: "update:modelValue", value: boolean): void;
    /** 安装插件事件 */
    (e: "install", plugin: PluginMarketItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const open = useVModel(props, "modelValue", emit);

/**
 * 获取插件价格显示
 */
function getPluginPriceDisplay(plugin: PluginMarketItem): string {
    const price = parseFloat(plugin.price);
    return price === 0 ? "免费" : `¥${price}`;
}

/**
 * 获取终端支持标签
 */
function getTerminalSupportLabels(plugin: PluginMarketItem): string[] {
    if (!plugin.terminal_support) return [];

    const supportMap: Record<string, string> = {
        "1": "Web",
        "2": "Mobile",
        "3": "Desktop",
        "4": "API",
    };

    return plugin.terminal_support
        .split(",")
        .map((id) => supportMap[id.trim()])
        .filter(Boolean);
}

/**
 * 处理安装插件
 */
function handleInstall() {
    if (props.plugin) {
        emit("install", props.plugin);
    }
}

/**
 * 关闭抽屉
 */
function handleClose() {
    emit("update:modelValue", false);
}
</script>

<template>
    <UDrawer
        v-model:open="open"
        :set-background-color-on-scale="false"
        direction="right"
        should-scale-background
    >
        <template #content>
            <div v-if="plugin" class="flex flex-col pr-4" style="width: 400px">
                <!-- 抽屉头部 -->
                <div class="flex items-center justify-between py-2">
                    <h2 class="text-secondary-foreground text-xl font-bold">
                        {{ $t("console-plugins.market.detail") }}
                    </h2>
                    <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        @click="handleClose"
                    />
                </div>

                <!-- 抽屉内容 -->
                <div class="flex-1 overflow-y-auto">
                    <div class="flex flex-col space-y-6">
                        <!-- 插件基本信息 -->
                        <div class="mt-6 flex items-start gap-4">
                            <UAvatar
                                :src="plugin.icon"
                                :alt="plugin.name"
                                size="3xl"
                                :ui="{ root: 'rounded-lg' }"
                            >
                                <template #fallback>
                                    <UIcon
                                        name="i-lucide-puzzle"
                                        class="text-muted-foreground h-8 w-8"
                                    />
                                </template>
                            </UAvatar>
                            <div class="flex-1">
                                <h3
                                    class="text-secondary-foreground flex items-center gap-2 text-base"
                                >
                                    {{ plugin.name }}
                                    <UBadge size="sm">
                                        {{ $t("console-plugins.market.official_team") }}
                                    </UBadge>
                                </h3>
                                <p class="text-accent-foreground my-2 text-sm dark:text-gray-400">
                                    {{ $t("console-plugins.market.author") }}:{{
                                        plugin.author.nickname
                                    }}
                                </p>
                                <div class="flex items-center gap-4">
                                    <span
                                        :class="[
                                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                                            parseFloat(plugin.price) === 0
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
                                        ]"
                                    >
                                        {{ getPluginPriceDisplay(plugin) }}
                                    </span>
                                    <div class="flex gap-1">
                                        <span
                                            v-for="label in getTerminalSupportLabels(plugin)"
                                            :key="label"
                                            class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/30"
                                        >
                                            {{ label }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 插件描述 -->
                        <div>
                            <h4 class="text-secondary-foreground mb-2 font-medium">
                                {{ $t("console-plugins.market.d") }}
                            </h4>
                            <p class="text-accent-foreground dark:text-gray-400">
                                {{ plugin.description }}
                            </p>
                        </div>
                        <!-- 预览图片 -->
                        <div v-if="plugin.cover">
                            <h4 class="text-secondary-foreground mb-2 font-medium">
                                {{ $t("console-plugins.market.preview_image") }}
                            </h4>
                            <div class="grid grid-cols-2 gap-4">
                                <img
                                    v-for="(cover, index) in plugin.cover.split(',')"
                                    :key="index"
                                    :src="cover.trim()"
                                    :alt="`${plugin.name} 预览 ${index + 1}`"
                                    class="h-32 w-full rounded-lg object-cover"
                                    @click="useImagePreview(plugin.cover.split(','), index)"
                                />
                            </div>
                        </div>

                        <!-- 版本信息 -->
                        <div v-if="plugin.versions.length > 0">
                            <h4 class="text-secondary-foreground mb-2 font-medium">
                                {{ $t("console-plugins.market.version_info") }}
                            </h4>
                            <div class="space-y-3">
                                <div
                                    v-for="version in plugin.versions.slice(0, 3)"
                                    :key="version.id"
                                    class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                >
                                    <div class="mb-1 flex items-center justify-between">
                                        <span class="text-secondary-foreground font-medium">
                                            v{{ version.version }}
                                        </span>
                                        <span
                                            class="text-muted-foreground text-sm dark:text-gray-400"
                                        >
                                            <TimeDisplay
                                                :datetime="version.release_time"
                                                mode="date"
                                            />
                                        </span>
                                    </div>
                                    <p class="text-accent-foreground text-sm dark:text-gray-400">
                                        {{ version.description }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- 上次更新时间 -->
                        <div>
                            <h4 class="text-secondary-foreground mb-2 font-medium">
                                {{ $t("console-plugins.market.update_time") }}
                            </h4>
                            <p class="text-accent-foreground dark:text-gray-400">
                                {{ plugin.update_time }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 抽屉底部 -->
                <div class="flex gap-3 pb-4">
                    <UButton
                        color="neutral"
                        variant="outline"
                        class="flex-1 justify-center"
                        size="lg"
                        @click="handleClose"
                    >
                        {{ $t("console-common.close") }}
                    </UButton>
                    <UButton
                        color="primary"
                        class="flex-1 justify-center"
                        size="lg"
                        @click="handleInstall"
                    >
                        {{ $t("console-plugins.market.install") }}
                    </UButton>
                </div>
            </div>
            <div v-else class="flex h-full w-full items-center justify-center">
                <UIcon name="i-lucide-package-search" class="h-12 w-12 text-gray-400" />
            </div>
        </template>
    </UDrawer>
</template>
