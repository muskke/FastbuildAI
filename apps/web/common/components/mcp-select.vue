<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import {
    type McpServerInfo,
    type McpServerResponse,
    McpServerType,
    type SystemMcpServerInfo,
} from "@/models/web-mcp-server";
import { apiGetAllMcpServerList } from "@/services/web/mcp-server";

interface Props {
    modelValue?: string[];
    disabled?: boolean;
    showDescription?: boolean;
    defaultSelected?: boolean;
    console?: boolean;
    capability?: string;
    modelId?: string;
    mcpIds?: string[];
}

const { t } = useI18n();
const router = useRouter();

const props = withDefaults(defineProps<Props>(), {
    showDescription: true,
    defaultSelected: true,
    console: false,
    modelId: "",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: string[]): void;
    (e: "change", value: any): void;
}>();

const loading = ref(false);
const isOpen = ref(false);
const search = ref("");
const selectedIds = ref<string[]>([]);
const tab = ref<McpServerType>(McpServerType.SYSTEM);
const mcpList = ref<McpServerInfo[] | SystemMcpServerInfo[]>([]);
const allMcpList = ref<(McpServerInfo | SystemMcpServerInfo)[]>([]);
const toast = useMessage();

const filteredMcpList = computed(() => {
    const query = search.value.trim().toLowerCase();
    const mcpList = allMcpList.value.filter((m) => m.type === tab.value);

    if (!query) return mcpList;

    // 过滤mcpList，返回name、providerName或description包含query的对象
    const filteredMcpList = mcpList.filter((m) =>
        [m.name, m.providerName, m.description].some((s) => s?.toLowerCase().includes(query)),
    );
    return filteredMcpList;
});

/**
 * 仅保留在 allMcpList 中存在的已选 ID
 * 用于展示和状态判断，避免无效 ID 导致的“仍然显示选中效果”问题
 */
const selectedValidIds = computed(() =>
    (Array.isArray(selectedIds.value) ? selectedIds.value : []).filter((id) =>
        allMcpList.value.some((m) => m.id === id),
    ),
);

const handleTabChange = (value: McpServerType) => {
    tab.value = value;
    getAllList();
};

/**
 * 获取所有 MCP 服务器列表
 */
const getAllList = async () => {
    if (loading.value) return;
    // 从本地存储恢复选择，确保为数组类型
    try {
        const raw = JSON.parse(localStorage.getItem("mcpIds") || "[]");
        selectedIds.value = Array.isArray(raw) ? raw : [];
    } catch {
        selectedIds.value = [];
    }
    try {
        const data: McpServerInfo[] | SystemMcpServerInfo[] = await apiGetAllMcpServerList();
        allMcpList.value = data;
        // 拉取后立即过滤无效的 selectedIds，并同步回本地与对外事件
        const sourceIds = Array.isArray(selectedIds.value) ? selectedIds.value : [];
        const valid = sourceIds.filter((id) => data.some((item) => item.id === id));
        if (valid.length !== selectedIds.value.length) {
            // 仅更新内部状态用于 UI 展示，避免在刷新时清空 localStorage 的持久化选择
            selectedIds.value = valid;
        }
    } catch (e) {
        console.error("MCP加载失败", e);
    }
};

onMounted(() => {
    getAllList();
});

/**
 * 选择或取消选择MCP服务器
 */
function select(mcp: SystemMcpServerInfo | McpServerInfo) {
    const index = selectedIds.value.indexOf(mcp.id);
    if (index > -1) {
        // 已选中，则取消选择
        selectedIds.value.splice(index, 1);
    } else {
        // 未选中，则添加到选中列表
        if (selectedIds.value.length === 5) {
            toast.warning(
                "为了保持性能，在当前的 MCP模式下，最多只能同时激活5个MCP 服务器。请在启用新的服务器之前关闭一些服务器。",
            );
            return;
        }
        selectedIds.value.push(mcp.id);
    }

    localStorage.setItem("mcpIds", JSON.stringify(selectedIds.value));

    emit("update:modelValue", [...selectedIds.value]);
    emit("change", selectedIds.value);
}

/**
 * 清除所有选择
 */
function clearSelection() {
    selectedIds.value = [];
    emit("update:modelValue", []);
    emit("change", []);
    isOpen.value = false;
    search.value = "";
    localStorage.removeItem("mcpIds");
}

async function handlePopoverUpdate(value: boolean) {
    if (value) {
        await getAllList();
        // 过滤无效 ID（更温和：仅移除不存在的，而非全清）
        const sourceIds = Array.isArray(selectedIds.value) ? selectedIds.value : [];
        const valid = sourceIds.filter((id) => allMcpList.value.some((item) => item.id === id));
        if (valid.length !== selectedIds.value.length) {
            // 仅更新内部状态用于 UI 展示，避免在弹层打开时清空 localStorage 的持久化选择
            selectedIds.value = valid;
        }
    }
}

/**
 * 获取MCP服务器图标
 */
function getMcpServerIcon(mcpServer: McpServerInfo | SystemMcpServerInfo): string {
    if (mcpServer.icon) {
        return mcpServer.icon;
    }
    // 使用MCP服务器名称首字母作为默认图标
    const firstLetter = mcpServer.name?.charAt(0).toUpperCase() || "P";
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=6366f1&color=fff&size=80`;
}

// onMounted(getSystemList);
</script>

<template>
    <UPopover v-model:open="isOpen" :disabled="props.disabled" @update:open="handlePopoverUpdate">
        <UButton
            color="primary"
            variant="ghost"
            :ui="{ leadingIcon: 'size-4' }"
            :class="{ 'bg-primary/10': selectedValidIds.length }"
            :loading="loading"
            :disabled="props.disabled"
            @click.stop
        >
            <span class="flex items-center gap-1 truncate">
                <svg
                    class="size-4"
                    viewBox="0 0 195 195"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177"
                        stroke="currentColor"
                        stroke-width="12"
                        stroke-linecap="round"
                    />
                    <path
                        d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52"
                        stroke="currentColor"
                        stroke-width="12"
                        stroke-linecap="round"
                    />
                    <path
                        d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822"
                        stroke="currentColor"
                        stroke-width="12"
                        stroke-linecap="round"
                    />
                </svg>
                <span>{{ t("common.mcp-server.tool") }}</span>
                <UAvatarGroup
                    v-if="selectedValidIds.length"
                    :ui="{ base: 'ring-0 -me-2' }"
                    size="2xs"
                >
                    <UAvatar
                        v-for="(id, index) in selectedValidIds"
                        :style="`z-index: ${index + 1}`"
                        :key="id"
                        :src="
                            (() => {
                                const server = allMcpList.find((m) => m.id === id);
                                return server ? getMcpServerIcon(server) : '';
                            })()
                        "
                        :alt="
                            (() => {
                                const server = allMcpList.find((m) => m.id === id);
                                return server?.name || '';
                            })()
                        "
                    />
                </UAvatarGroup>
                <!-- <span v-if="selectedIds.length">({{ selectedIds.length }})</span> -->
            </span>
            <div class="flex items-center gap-2">
                <UIcon
                    name="i-lucide-x"
                    v-if="selectedValidIds.length > 0 && props.console"
                    @click.stop="clearSelection()"
                />
                <div class="flex items-center">
                    <UIcon name="i-lucide-chevron-down" :class="{ 'rotate-180': isOpen }" />
                </div>
            </div>
        </UButton>

        <template #content>
            <div class="bg-background max-h-[480px] w-90 overflow-hidden rounded-lg shadow-lg">
                <div class="flex items-center gap-2 border-b p-3">
                    <UInput
                        v-model="search"
                        :placeholder="t('console-common.placeholder.mcpSelect')"
                        size="lg"
                        :ui="{ root: 'flex-1' }"
                    >
                        <template #leading><UIcon name="i-lucide-search" /></template>
                    </UInput>
                    <UButton
                        class="w-fit"
                        color="primary"
                        variant="ghost"
                        :ui="{ leadingIcon: 'size-4' }"
                        icon="i-lucide-rotate-ccw"
                        @click="selectedIds = []"
                        >{{ t("common.mcp-server.reset") }}</UButton
                    >
                </div>

                <div class="grid grid-cols-1 gap-3 p-2">
                    <UTabs
                        color="primary"
                        variant="link"
                        :content="false"
                        :items="[
                            {
                                label: t('console-common.tab.system'),
                                value: 'system',
                            },
                            {
                                label: t('console-common.tab.custom'),
                                value: 'user',
                            },
                        ]"
                        @update:model-value="handleTabChange($event as McpServerType)"
                        v-model="tab"
                        class="w-full"
                    />
                    <div
                        v-if="loading"
                        class="text-muted-foreground col-span-full py-10 text-center"
                    >
                        {{ t("console-common.loading") }}...
                    </div>

                    <div
                        v-else-if="!filteredMcpList.length"
                        class="text-muted-foreground col-span-full py-10 text-center"
                    >
                        {{ t("console-common.empty") }}
                    </div>

                    <section class="max-h-70 space-y-2 overflow-y-auto">
                        <ul class="space-y-1">
                            <li
                                v-for="mcp in filteredMcpList"
                                :key="mcp.id"
                                class="group hover:bg-muted flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors"
                                :class="{
                                    'bg-secondary': selectedIds.includes(mcp.id),
                                    '!cursor-not-allowed': !mcp.connectable,
                                }"
                                @click="mcp.connectable && select(mcp)"
                            >
                                <UPopover
                                    mode="hover"
                                    :open-delay="500"
                                    :content="{
                                        align: 'start',
                                        side: 'right',
                                        sideOffset: 20,
                                    }"
                                >
                                    <div class="flex w-full flex-row items-center justify-between">
                                        <div
                                            class="flex flex-row items-start gap-2 space-y-0.5 overflow-hidden"
                                        >
                                            <UAvatar
                                                v-if="mcp.icon"
                                                :src="mcp.icon"
                                                :alt="mcp.name"
                                                size="lg"
                                                :ui="{ image: 'rounded-md' }"
                                            />
                                            <div
                                                v-else
                                                class="bg-primary flex size-9 items-center justify-center rounded-md"
                                            >
                                                <svg
                                                    class="size-6 text-white"
                                                    viewBox="0 0 195 195"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M25 97.8528L92.8823 29.9706C102.255 20.598 117.451 20.598 126.823 29.9706V29.9706C136.196 39.3431 136.196 54.5391 126.823 63.9117L75.5581 115.177"
                                                        stroke="currentColor"
                                                        stroke-width="12"
                                                        stroke-linecap="round"
                                                    />
                                                    <path
                                                        d="M76.2653 114.47L126.823 63.9117C136.196 54.5391 151.392 54.5391 160.765 63.9117L161.118 64.2652C170.491 73.6378 170.491 88.8338 161.118 98.2063L99.7248 159.6C96.6006 162.724 96.6006 167.789 99.7248 170.913L112.331 183.52"
                                                        stroke="currentColor"
                                                        stroke-width="12"
                                                        stroke-linecap="round"
                                                    />
                                                    <path
                                                        d="M109.853 46.9411L59.6482 97.1457C50.2757 106.518 50.2757 121.714 59.6482 131.087V131.087C69.0208 140.459 84.2168 140.459 93.5894 131.087L143.794 80.8822"
                                                        stroke="currentColor"
                                                        stroke-width="12"
                                                        stroke-linecap="round"
                                                    />
                                                </svg>
                                            </div>
                                            <div class="flex flex-1 flex-col overflow-hidden">
                                                <p
                                                    class="text-secondary-foreground truncate text-sm font-medium"
                                                >
                                                    {{ mcp.alias || mcp.name }}
                                                </p>
                                                <p
                                                    v-if="props.showDescription && mcp.description"
                                                    class="text-muted-foreground truncate text-xs"
                                                >
                                                    {{ mcp.description }}
                                                </p>
                                                <div
                                                    v-if="mcp.connectError"
                                                    class="line-clamp-1 flex items-center gap-1 text-xs text-red-500"
                                                >
                                                    <UIcon name="i-lucide-alert-octagon" />
                                                    <p>{{ mcp.connectError }}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <UIcon
                                            v-if="selectedIds.includes(mcp.id)"
                                            name="i-lucide-check-circle"
                                            class="text-primary flex-none"
                                            size="lg"
                                        />
                                    </div>

                                    <template #content>
                                        <div class="flex h-fit w-96 flex-col items-start gap-4 p-5">
                                            <!-- 头部信息 -->
                                            <div class="flex flex-row justify-center gap-2">
                                                <UAvatar
                                                    :src="getMcpServerIcon(mcp)"
                                                    :alt="mcp.name"
                                                    size="2xl"
                                                    :ui="{ image: 'rounded-md' }"
                                                />
                                                <div class="flex flex-col gap-1">
                                                    <p
                                                        class="text-secondary-foreground truncate text-sm font-medium"
                                                    >
                                                        {{ mcp.alias || mcp.name }}
                                                    </p>
                                                    <UBadge
                                                        v-if="mcp.connectable"
                                                        size="sm"
                                                        class="w-fit"
                                                        color="success"
                                                    >
                                                        {{ t("common.mcp-server.success") }}
                                                    </UBadge>
                                                    <div
                                                        v-else
                                                        class="line-clamp-1 flex items-center gap-1 text-sm text-red-500"
                                                    >
                                                        <UIcon name="i-lucide-alert-octagon" />
                                                        <p>{{ mcp.connectError }}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <!-- 连通信息 -->

                                            <!-- mcp 详情 -->
                                            <div class="bg-muted w-full rounded-lg p-2">
                                                <p
                                                    class="text-muted-foreground text-xs wrap-break-word"
                                                >
                                                    {{
                                                        mcp.description ||
                                                        t("common.mcp-server.detail.noDescription")
                                                    }}
                                                </p>
                                            </div>

                                            <div class="space-y-2">
                                                <h2 class="text-xs font-bold">
                                                    {{ t("common.mcp-server.detail.tools") }}
                                                </h2>

                                                <div class="flex flex-wrap gap-1">
                                                    <UBadge
                                                        v-for="tool in mcp.tools"
                                                        :key="tool.id"
                                                        color="neutral"
                                                        variant="outline"
                                                    >
                                                        {{ tool.name }}
                                                    </UBadge>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </UPopover>
                            </li>
                        </ul>
                        <div class="sticky bottom-0">
                            <UButton
                                color="primary"
                                variant="outline"
                                class="bg-background hover:bg-primary-100 flex w-full items-center justify-center"
                                @click="router.push('/profile/mcp-server-settings')"
                            >
                                {{ t("common.mcp-server.setMcp") }}
                                <UIcon name="i-lucide-external-link" />
                            </UButton>
                        </div>
                    </section>
                </div>
            </div>
        </template>
    </UPopover>
</template>
