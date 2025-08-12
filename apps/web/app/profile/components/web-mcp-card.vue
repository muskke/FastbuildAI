<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { McpServerInfo } from "@/models/web-mcp-server";
import { apiCheckMcpServerConnect } from "@/services/web/mcp-server";

interface ProviderCardProps {
    mcpServer: McpServerInfo;
    selected?: boolean;
}

interface ProviderCardEmits {
    (e: "select", mcpServer: McpServerInfo, selected: boolean | "indeterminate"): void;
    (e: "delete", mcpServer: McpServerInfo): void;
    (e: "edit", mcpServer: McpServerInfo): void;
    (e: "view-models", mcpServerId: string): void;
    (e: "remove-system", mcpServerId: string): void;
    (e: "toggle-visible", mcpServerId: string, isActive: boolean): void;
}

const props = withDefaults(defineProps<ProviderCardProps>(), {
    selected: false,
});

const emit = defineEmits<ProviderCardEmits>();
const { t } = useI18n();
const router = useRouter();
const { hasAccessByCodes } = useAccessControl();

const connectable = ref(false);
const connectableError = ref<string | undefined>("");

/**
 * 获取MCP服务器图标
 */
function getMcpServerIcon(mcpServer: McpServerInfo): string {
    if (mcpServer.icon) {
        return mcpServer.icon;
    }
    // 使用MCP服务器名称首字母作为默认图标
    const firstLetter = mcpServer.name?.charAt(0).toUpperCase() || "P";
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=6366f1&color=fff&size=80`;
}

/**
 * mcp 连通性测试
 */
const handleCheckConnect = async () => {
    const res = await apiCheckMcpServerConnect(props.mcpServer.id);
    connectable.value = res.connectable;
    connectableError.value = res.error;
};

const connectableType = computed(() => {
    return props.mcpServer.connectable || connectable.value;
});

const connectableErrorInfo = computed(() => {
    return props.mcpServer.connectError || connectableError.value;
});
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

    if (props.mcpServer.type === "user") {
        items.push({
            label: t("console-ai-mcp-server.edit"),
            icon: "i-lucide-edit",
            onSelect: () => emit("edit", props.mcpServer),
        });
    }

    if (props.mcpServer.type === "user") {
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

const statusInfo = computed(() => getMcpServerStatusInfo(props.mcpServer.isShow ?? false));

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

onMounted(() => {
    if (!props.mcpServer.connectable && !props.mcpServer.connectError) {
        handleCheckConnect();
    }
});
</script>

<template>
    <ProCard
        class="flex flex-col overflow-hidden"
        show-actions
        :selected="selected"
        :actions="dropdownActions"
        @select="handleSelect"
    >
        <template #icon="{ groupHoverClass, selectedClass }">
            <div class="flex items-center gap-4">
                <UChip :color="connectableType ? 'success' : 'error'" position="top-right">
                    <UAvatar
                        :src="getMcpServerIcon(mcpServer)"
                        :alt="mcpServer.name"
                        size="3xl"
                        :ui="{ root: 'rounded-lg' }"
                        :class="[groupHoverClass, selectedClass]"
                    />
                </UChip>
                <div>
                    <div class="flex items-center gap-2">
                        <h3
                            class="text-secondary-foreground flex items-center text-base font-semibold"
                        >
                            <UTooltip :text="mcpServer.name" :delay="0">
                                <span class="line-clamp-1">
                                    {{ mcpServer.alias || mcpServer.name }}
                                </span>
                            </UTooltip>
                        </h3>
                    </div>
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
                :text="mcpServer.description || t('console-ai-mcp-server.noDescription')"
                :delay-duration="0"
            >
                <h4 v-if="mcpServer.description" class="text-muted-foreground line-clamp-2 text-xs">
                    {{ mcpServer.description }}
                </h4>
                <h4 v-else class="text-muted-foreground line-clamp-2 text-xs">
                    {{ t("console-ai-mcp-server.noDescription") }}
                </h4>
            </UTooltip>
            <UTooltip :text="connectableErrorInfo" :delay-duration="0">
                <div v-if="connectableErrorInfo" class="flex flex-row items-center gap-1.5">
                    <UIcon name="tabler:plug-connected-x" size="16" class="text-red-500" />
                    <h4 class="line-clamp-2 text-xs text-red-500">
                        {{ connectableErrorInfo }}
                    </h4>
                </div>
            </UTooltip>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <USwitch
                    :model-value="!mcpServer.isDisabled"
                    @update:model-value="(val) => emit('toggle-visible', mcpServer.id, !val)"
                    unchecked-icon="lucide:eye-off"
                    checked-icon="lucide:eye"
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
