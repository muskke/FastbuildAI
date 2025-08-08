<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { McpServerDetail } from "@/models/mcp-server";
import type { McpServerInfo } from "@/models/web-mcp-server";

interface ProviderCardProps {
    mcpServer: McpServerInfo;
    selected?: boolean;
}

interface ProviderCardEmits {
    (e: "view-models", mcpServerId: string): void;
    (e: "add-system-mcp-server", mcpServerId: string): void;
    (e: "remove-system", mcpServerId: string): void;
}

const props = withDefaults(defineProps<ProviderCardProps>(), {
    selected: false,
});

const emit = defineEmits<ProviderCardEmits>();
const { t } = useI18n();
const router = useRouter();

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
 * 处理卡片点击
 */
function handleCardClick() {
    emit("view-models", props.mcpServer.id);
}

// 添加系统 mcp 服务
function addSystemMcpServer() {
    emit("add-system-mcp-server", props.mcpServer.id);
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
    <ProCard class="mx-1 flex flex-col">
        <template #icon="{ groupHoverClass, selectedClass }">
            <div class="flex items-center gap-4">
                <UChip :color="mcpServer.connectable ? 'success' : 'error'" position="top-left">
                    <UAvatar
                        :src="getMcpServerIcon(mcpServer)"
                        :alt="mcpServer.name"
                        size="3xl"
                        :ui="{ root: 'rounded-lg' }"
                        :class="[groupHoverClass, selectedClass]"
                    />
                </UChip>
                <div>
                    <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                        <UTooltip :text="mcpServer.name" :delay="0">
                            <span class="line-clamp-1">
                                {{ mcpServer.name }}
                            </span>
                        </UTooltip>
                    </h3>
                    <UTooltip :text="mcpServer.url" :delay-duration="0">
                        <a
                            class="text-muted-foreground line-clamp-1 text-xs"
                            :href="getFormattedUrl(mcpServer.url)"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @ {{ mcpServer.providerName }}
                        </a>
                    </UTooltip>
                </div>
            </div>
        </template>

        <template #description>
            <!-- 描述 -->
            <UTooltip :text="mcpServer.description" :delay-duration="0">
                <h4 v-if="mcpServer.description" class="text-muted-foreground line-clamp-2 text-xs">
                    {{ mcpServer.description }}
                </h4>
                <h4 v-else class="text-muted-foreground line-clamp-2 text-xs">
                    {{ t("console-ai-mcp-server.noDescription") }}
                </h4>
            </UTooltip>
            <UTooltip :text="mcpServer.connectError" :delay-duration="0">
                <h4 v-if="mcpServer.connectError" class="line-clamp-2 text-xs text-red-500">
                    {{ mcpServer.connectError }}
                </h4>
            </UTooltip>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                    <UButton icon="i-lucide-eye" variant="ghost" size="sm" @click="handleCardClick">
                        {{ t("console-ai-mcp-server.check") }}
                    </UButton>
                </div>

                <div>
                    <UButton
                        v-if="!mcpServer.isAssociated"
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="addSystemMcpServer()"
                    >
                        {{ t("console-ai-mcp-server.addSystemMcpServer") }}
                    </UButton>
                    <UButton
                        v-else
                        color="error"
                        variant="outline"
                        icon="i-lucide-trash-2"
                        @click="emit('remove-system', props.mcpServer.id)"
                    >
                        {{ t("console-ai-mcp-server.removeSystem") }}
                    </UButton>
                </div>
            </div>
        </template>
    </ProCard>
</template>
