<script lang="ts" setup>
import type { PluginMarketItem } from "@/models/plugin-market";

/**
 * 通用插件卡片组件
 * 支持插件市场和插件管理两种模式
 */

/** 卡片模式常量 */
const CARD_MODE = {
    /** 市场模式 - 显示价格和安装按钮 */
    MARKET: "market",
    /** 管理模式 - 显示状态和管理按钮 */
    MANAGE: "manage",
} as const;

type CardMode = (typeof CARD_MODE)[keyof typeof CARD_MODE];

/** 插件状态常量 */
const PLUGIN_STATUS = {
    /** 已启用 */
    ENABLED: "enabled",
    /** 已禁用 */
    DISABLED: "disabled",
    /** 未安装 */
    UNINSTALLED: "uninstalled",
} as const;

type PluginStatus = (typeof PLUGIN_STATUS)[keyof typeof PLUGIN_STATUS];

interface Props {
    /** 插件数据 */
    plugin: PluginMarketItem;
    /** 卡片模式 */
    mode?: CardMode;
}

interface Emits {
    /** 查看详情事件 */
    (e: "detail", plugin: PluginMarketItem): void;
    /** 查看更新日志事件 */
    (e: "changelog", plugin: PluginMarketItem): void;
    /** 安装插件事件 */
    (e: "install", plugin: PluginMarketItem): void;
    /** 启用插件事件 */
    (e: "enable", plugin: PluginMarketItem): void;
    /** 禁用插件事件 */
    (e: "disable", plugin: PluginMarketItem): void;
    /** 卸载插件事件 */
    (e: "uninstall", plugin: PluginMarketItem): void;
}

const props = withDefaults(defineProps<Props>(), {
    mode: "market",
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

/**
 * 处理选择状态变化
 */
function handleSelect(selected: boolean | "indeterminate") {
    // plugin-card 暂时不支持选择功能，保留接口以备将来扩展
}

/**
 * 获取插件封面图片
 */
function getPluginCover(plugin: PluginMarketItem): string {
    if (!plugin.cover) return "";
    const covers = plugin.cover.split(",");
    return covers[0] || "";
}

/**
 * 获取插件价格显示
 */
function getPluginPriceDisplay(plugin: PluginMarketItem): string {
    const price = parseFloat(plugin.price);
    return price === 0 ? t("console-plugins.market.free") : `¥${price}`;
}

/**
 * 获取插件状态
 */
function getPluginStatus(plugin: PluginMarketItem): PluginStatus {
    // 根据实际的状态字段进行判断
    if (plugin.status === 1) return PLUGIN_STATUS.ENABLED;
    if (plugin.status === 0) return PLUGIN_STATUS.DISABLED;
    return PLUGIN_STATUS.UNINSTALLED;
}

/**
 * 获取插件版本
 */
function getPluginVersion(plugin: PluginMarketItem): string {
    if (plugin.versions && plugin.versions.length > 0) {
        return plugin.versions[0].version;
    }
    return "1.0.0";
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
 * 获取状态显示信息
 */
function getStatusInfo(status: PluginStatus) {
    switch (status) {
        case PLUGIN_STATUS.ENABLED:
            return {
                label: t("console-plugins.manage.status.enabled"),
                color: "success" as const,
                icon: "i-lucide-check-circle",
            };
        case PLUGIN_STATUS.DISABLED:
            return {
                label: t("console-plugins.manage.status.disabled"),
                color: "error" as const,
                icon: "i-lucide-pause-circle",
            };
        default:
            return {
                label: t("console-plugins.manage.status.unknown"),
                color: "warning" as const,
                icon: "i-lucide-flame-kindling",
            };
    }
}

/**
 * 获取下拉菜单项
 */
const dropdownActions = computed(() => {
    return [
        {
            label: t("console-plugins.market.detail"),
            icon: "i-lucide-info",
            onSelect: () => emit("detail", props.plugin),
        },
        {
            label: t("console-plugins.market.changelog"),
            icon: "i-lucide-clock",
            onSelect: () => emit("changelog", props.plugin),
        },
    ];
});

/**
 * 获取操作按钮
 */
function getActionButton(plugin: PluginMarketItem) {
    if (props.mode === CARD_MODE.MARKET) {
        return {
            label: t("console-plugins.market.install"),
            icon: "i-lucide-download",
            color: "primary" as const,
            onClick: () => emit("install", plugin),
        };
    }

    // 管理模式
    const status = getPluginStatus(plugin);

    if (status === PLUGIN_STATUS.ENABLED) {
        return {
            label: t("console-plugins.manage.disable"),
            icon: "i-lucide-pause",
            color: "warning" as const,
            onClick: () => emit("disable", plugin),
        };
    } else if (status === PLUGIN_STATUS.DISABLED) {
        return {
            label: t("console-plugins.manage.enable"),
            icon: "i-lucide-play",
            color: "success" as const,
            onClick: () => emit("enable", plugin),
        };
    }

    return null;
}

const statusInfo = computed(() => getStatusInfo(getPluginStatus(props.plugin)));
const actionButton = computed(() => getActionButton(props.plugin));
</script>

<template>
    <div
        class="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
        <!-- 插件封面 -->
        <div class="relative h-48 bg-gray-100 dark:bg-gray-700">
            <img
                v-if="getPluginCover(plugin)"
                :src="getPluginCover(plugin)"
                :alt="plugin.name"
                class="pointer-events-none h-full w-full object-cover select-none"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
                <UIcon name="i-lucide-image" class="h-12 w-12 text-gray-400" />
            </div>

            <div class="absolute top-3 right-3 flex items-center gap-2">
                <!-- 市场模式：显示价格 -->
                <UButton v-if="mode === CARD_MODE.MARKET" color="primary">
                    {{ getPluginPriceDisplay(plugin) }}
                </UButton>

                <!-- 管理模式：显示状态 -->
                <UButton
                    v-else
                    :color="statusInfo.color"
                    variant="solid"
                    size="sm"
                    class="flex items-center gap-1"
                >
                    <UIcon :name="statusInfo.icon" class="h-3 w-3" />
                    {{ statusInfo.label }}
                </UButton>

                <!-- 操作菜单 -->
                <UDropdownMenu :items="[dropdownActions]" :popper="{ placement: 'bottom-end' }">
                    <UButton color="neutral" variant="soft" icon="i-lucide-ellipsis-vertical" />
                </UDropdownMenu>
            </div>
        </div>

        <!-- 插件信息 -->
        <div class="p-4">
            <!-- 插件图标和名称 -->
            <div class="mb-2 flex items-start gap-3">
                <div class="flex-shrink-0">
                    <img
                        v-if="plugin.icon"
                        :src="plugin.icon"
                        :alt="plugin.name"
                        class="h-10 w-10 rounded-lg object-cover"
                    />
                    <div
                        v-else
                        class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600"
                    >
                        <UIcon name="i-lucide-puzzle" class="text-muted-foreground h-5 w-5" />
                    </div>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <h3 class="text-secondary-foreground truncate font-medium">
                            {{ plugin.name }}
                        </h3>
                        <!-- 官方标识 -->
                        <UBadge color="info" variant="soft">
                            <UIcon name="i-lucide-crown" class="mr-1 size-3" />
                            {{ $t("console-plugins.manage.official") }}
                        </UBadge>
                    </div>
                    <p class="text-accent-foreground truncate text-sm dark:text-gray-400">
                        {{ plugin.author?.nickname || $t("console-plugins.market.author") }}
                    </p>
                </div>
            </div>

            <!-- 插件描述 -->
            <p class="text-accent-foreground mb-2 line-clamp-2 text-sm dark:text-gray-400">
                {{ plugin.description }}
            </p>

            <!-- 终端支持标签 -->
            <div class="mb-2 flex flex-wrap gap-1">
                <UBadge
                    v-for="label in getTerminalSupportLabels(plugin)"
                    :key="label"
                    color="info"
                    variant="soft"
                >
                    {{ label }}
                </UBadge>
            </div>

            <!-- 底部信息和操作按钮 -->
            <div class="flex items-center justify-between">
                <!-- 左侧：时间和版本信息 -->
                <div
                    class="text-muted-foreground flex items-center gap-2 text-xs dark:text-gray-400"
                >
                    <TimeDisplay :datetime="plugin.update_time" mode="datetime" />
                    <span>•</span>
                    <span>v{{ getPluginVersion(plugin) }}</span>
                </div>

                <!-- 右侧：操作按钮 -->
                <div class="flex items-center gap-1">
                    <!-- 主要操作按钮 -->
                    <UButton
                        v-if="actionButton"
                        :color="actionButton.color"
                        variant="soft"
                        size="xs"
                        :icon="actionButton.icon"
                        @click="actionButton.onClick"
                    >
                        {{ actionButton.label }}
                    </UButton>

                    <!-- 管理模式的卸载按钮 -->
                    <UButton
                        v-if="mode === CARD_MODE.MANAGE"
                        color="error"
                        variant="soft"
                        size="xs"
                        icon="i-lucide-trash-2"
                        @click="emit('uninstall', plugin)"
                    >
                        {{ $t("console-plugins.manage.uninstall") }}
                    </UButton>
                </div>
            </div>
        </div>
    </div>
</template>
