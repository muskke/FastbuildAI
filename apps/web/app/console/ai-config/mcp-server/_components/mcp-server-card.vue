<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { McpServerDetail } from "@/models/mcp-server";

interface ProviderCardProps {
    mcpServer: McpServerDetail;
    selected?: boolean;
}

interface ProviderCardEmits {
    (e: "select", mcpServer: McpServerDetail, selected: boolean | "indeterminate"): void;
    (e: "delete", mcpServer: McpServerDetail): void;
    (e: "edit", mcpServer: McpServerDetail): void;
    (e: "set-quick-menu", mcpServer: McpServerDetail): void;
    (e: "view-models", mcpServerId: string): void;
    (e: "toggle-active", mcpServerId: string, isActive: boolean): void;
}

const props = withDefaults(defineProps<ProviderCardProps>(), {
    selected: false,
});

const emit = defineEmits<ProviderCardEmits>();
const { t } = useI18n();
const router = useRouter();
const { hasAccessByCodes } = useAccessControl();

/**
 * mcpServer状态信息
 */
function getMcpServerStatusInfo(isActive: boolean) {
    if (isActive) {
        return {
            label: t("console-ai-mcp-server.disableTitle"),
            color: "error" as const,
            icon: "i-lucide-x-circle",
        };
    } else {
        return {
            label: t("console-ai-mcp-server.enableTitle"),
            color: "success" as const,
            icon: "i-lucide-check-circle",
        };
    }
}

/**
 * 获取下拉菜单项
 */
const dropdownActions = computed(() => {
    const items = [];

    if (hasAccessByCodes(["ai-providers:update"])) {
        items.push({
            label: t("console-ai-mcp-server.edit"),
            icon: "i-lucide-edit",
            onSelect: () => emit("edit", props.mcpServer),
        });
    }

    if (hasAccessByCodes(["ai-providers:update"]) && !props.mcpServer.isQuickMenu) {
        items.push({
            label: t("console-ai-mcp-server.setQuickMenu"),
            icon: "i-lucide-star",
            onSelect: () => emit("set-quick-menu", props.mcpServer),
        });
    }

    if (hasAccessByCodes(["ai-providers:delete"])) {
        if (items.length > 0) {
            items.push({
                type: "separator" as const,
                label: "",
                onSelect: () => {},
            });
        }
        items.push({
            label: t("console-ai-mcp-server.delete"),
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => emit("delete", props.mcpServer),
        });
    }

    return items;
});

const statusInfo = computed(() => getMcpServerStatusInfo(props.mcpServer.isDisabled));

/**
 * 处理卡片点击
 */
function handleCardClick() {
    emit("view-models", props.mcpServer.id);
}

/**
 * 处理选择状态变化
 */
function handleSelect(selected: boolean | "indeterminate") {
    if (typeof selected === "boolean") {
        emit("select", props.mcpServer, selected);
    }
}

/**
 * 格式化URL，确保包含协议前缀
 * @param url 原始URL
 * @returns 格式化后的URL
 */
function getFormattedUrl(url: string): string {
    if (!url) return "#";

    // 检查URL是否包含协议前缀，如果不包含则添加https://
    if (!/^https?:\/\//i.test(url)) {
        return "https://" + url;
    }

    return url;
}
</script>

<template>
    <ProCard
        class="flex flex-col overflow-hidden"
        selectable
        clickable
        show-actions
        :selected="selected"
        :actions="dropdownActions"
        @select="handleSelect"
    >
        <div
            v-if="mcpServer.isQuickMenu"
            class="bg-primary absolute top-2 -left-6 w-20 rotate-[-45deg] text-center text-xs font-bold text-white shadow-md"
        >
            {{ t("console-ai-mcp-server.quickMenu") }}
        </div>
        <template #icon="{ groupHoverClass, selectedClass }">
            <div class="flex items-center gap-4">
                <UChip :color="mcpServer.connectable ? 'success' : 'error'" position="top-right">
                    <UAvatar
                        :src="mcpServer.icon"
                        :alt="mcpServer.name"
                        size="3xl"
                        :ui="{ root: 'rounded-lg', fallback: 'text-inverted' }"
                        :class="[
                            groupHoverClass,
                            selectedClass,
                            mcpServer.icon ? '' : 'bg-primary',
                        ]"
                    />
                </UChip>
                <div>
                    <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                        <UTooltip :text="mcpServer.name" :delay="0">
                            <span class="line-clamp-1">
                                {{ mcpServer.alias || mcpServer.name }}
                            </span>
                        </UTooltip>
                    </h3>
                    <a
                        class="text-muted-foreground line-clamp-1 text-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @ {{ mcpServer.providerName }}
                    </a>
                </div>
            </div>
        </template>

        <template #description>
            <!-- 描述 -->

            <UTooltip
                :disabled="!mcpServer.description"
                :text="mcpServer.description"
                :delay-duration="0"
            >
                <h4 v-if="mcpServer.description" class="text-muted-foreground line-clamp-2 text-xs">
                    {{ mcpServer.description }}
                </h4>
                <h4 v-else class="text-muted-foreground line-clamp-2 text-xs">
                    {{ t("console-ai-mcp-server.noDescription") }}
                </h4>
            </UTooltip>
            <UTooltip :text="mcpServer.connectError" :delay-duration="0">
                <div v-if="mcpServer.connectError" class="flex flex-row items-center gap-1.5">
                    <UIcon name="tabler:plug-connected-x" size="16" class="text-red-500" />
                    <h4 class="line-clamp-2 text-xs text-red-500">
                        {{ mcpServer.connectError }}
                    </h4>
                </div>
            </UTooltip>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <USwitch
                    :model-value="!mcpServer.isDisabled"
                    @update:model-value="(val) => emit('toggle-active', mcpServer.id, !val)"
                    unchecked-icon="i-lucide-x"
                    checked-icon="i-lucide-check"
                    size="md"
                />

                <div class="flex items-center gap-1">
                    <UButton icon="i-lucide-eye" variant="ghost" size="sm" @click="handleCardClick">
                        {{ t("console-ai-mcp-server.check") }}
                    </UButton>
                </div>
            </div>
        </template>
    </ProCard>
</template>
