<script setup lang="ts">
import { ProPaginaction, ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import type { AiProviderInfo } from "@/models/ai-provider";
import type { McpServerDetail } from "@/models/mcp-server";
import {
    apiBatchDeleteMcpServers,
    apiDeleteMcpServer,
    apiGetMcpServerList,
    apiSetQuickMenu,
    apiUpdateMcpServer,
} from "@/services/console/mcp-server";

const McpServerCard = defineAsyncComponent(() => import("./_components/mcp-server-card.vue"));
const McpServerEdit = defineAsyncComponent(() => import("./edit.vue"));
const McpDetail = defineAsyncComponent(() => import("./detail.vue"));

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数（匹配后端支持的参数）
const searchForm = reactive({
    name: "",
    isDisabled: null,
});

const isJsonImport = ref(false);

// 选中的供应商
const selectMcpServer = ref<Set<string>>(new Set());

// 弹窗状态
const showMcpServerModal = ref(false);
const editingMcpServerId = ref("");
const isView = ref(false);

// 更新mcp服务器ID
const updateIds = ref<string[]>([]);

const { paging, getLists } = usePaging({
    fetchFun: apiGetMcpServerList,
    params: searchForm,
});

/**
 * 处理供应商选择
 */
const handleMcpServerSelect = (provider: McpServerDetail, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const providerId = provider.id as string;
        if (selected) {
            selectMcpServer.value.add(providerId);
        } else {
            selectMcpServer.value.delete(providerId);
        }
    }
};

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    if (isSelected) {
        paging.items.forEach((provider: AiProviderInfo) => {
            if (provider.id) {
                selectMcpServer.value.add(provider.id as string);
            }
        });
    } else {
        selectMcpServer.value.clear();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-ai-mcp-server.deleteTitle"),
            description: t("console-ai-mcp-server.deleteMessage"),
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteMcpServers(id);
            toast.success(t("console-ai-mcp-server.deleteSuccess"));
        } else {
            await apiDeleteMcpServer(id);
            toast.success(t("console-ai-mcp-server.deleteSuccess"));
        }

        // 清空选中状态
        selectMcpServer.value.clear();

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

/**
 * 处理删除供应商
 */
const handleDeleteProvider = (provider: McpServerDetail) => {
    if (provider.id) {
        handleDelete(provider.id);
    }
};

/**
 * 批量删除选中供应商
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectMcpServer.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};

/**
 * 查看模型
 */
const handleViewModels = (mcpServerId: string) => {
    // router.push(`/console/ai-config/provider/model?providerId=${providerId}`);
    // showMcpServerModal.value = true;
    editingMcpServerId.value = mcpServerId;
    isView.value = true;
};

/**
 * 新增供应商
 */
const handleAddMcpServer = () => {
    editingMcpServerId.value = "";
    showMcpServerModal.value = true;
};

/**
 * JSON 导入
 */
const handleImportMcpServer = () => {
    showMcpServerModal.value = true;
    editingMcpServerId.value = "";
    isJsonImport.value = true;
};

/**
 * 设置快速菜单
 */
const handleSetQuickMenu = async (mcpServer: McpServerDetail) => {
    try {
        await apiSetQuickMenu(mcpServer.id);
        getLists();
        toast.success(t("console-ai-mcp-server.quickMenuSuccess"));
    } catch (error) {
        console.error("Set quick menu failed:", error);
    }
};

const changeUpdate = (ids?: string[]) => {
    updateIds.value = ids || [];
};

/**
 * 编辑供应商
 */
const handleEditProvider = (provider: McpServerDetail) => {
    editingMcpServerId.value = provider.id;
    showMcpServerModal.value = true;
};

/**
 * 弹窗操作成功回调
 */
const handleModalSuccess = () => {
    getLists();
};

/**
 * 处理启用/禁用供应商
 */
const handleToggleProviderActive = async (providerId: string, isDisabled: boolean) => {
    try {
        await apiUpdateMcpServer(providerId, { isDisabled });
        toast.success(isDisabled ? "MCP已禁用" : "MCP已启用");

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Toggle provider active failed:", error);
    }
};

/**
 * 计算选中状态
 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every(
            (provider: AiProviderInfo) =>
                provider.id && selectMcpServer.value.has(provider.id as string),
        )
    );
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter(
        (provider: AiProviderInfo) =>
            provider.id && selectMcpServer.value.has(provider.id as string),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="provider-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.name"
                class="w-70"
                :placeholder="t('console-ai-mcp-server.search.placeholder')"
                @change="getLists"
            />

            <USelect
                v-model="searchForm.isDisabled"
                :items="[
                    { label: t('console-ai-mcp-server.search.all'), value: null },
                    { label: t('console-ai-mcp-server.enableTitle'), value: false },
                    { label: t('console-ai-mcp-server.disableTitle'), value: true },
                ]"
                class="w-fit"
                label-key="label"
                value-key="value"
                :placeholder="t('console-ai-mcp-server.search.status')"
                @change="getLists"
            />

            <div class="flex items-center gap-2 md:ml-auto">
                <!-- 全选控制 -->
                <div class="flex items-center gap-2">
                    <UCheckbox
                        :model-value="
                            isAllSelected ? true : isIndeterminate ? 'indeterminate' : false
                        "
                        @update:model-value="handleSelectAll"
                    />
                    <span class="text-accent-foreground text-sm dark:text-gray-400">
                        {{ selectMcpServer.size }} / {{ paging.items.length }}
                        {{ t("console-common.selected") }}
                    </span>
                </div>

                <AccessControl :codes="['ai-mcp-servers:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectMcpServer.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectMcpServer.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <AccessControl :codes="['ai-mcp-servers:create']">
                    <UDropdownMenu
                        size="lg"
                        :items="[
                            {
                                label: t('console-ai-mcp-server.quickCreateTitle'),
                                icon: 'i-heroicons-plus',
                                color: 'primary',
                                onSelect: () => handleAddMcpServer(),
                            },
                            {
                                label: t('console-ai-mcp-server.importTitle'),
                                icon: 'i-lucide-file-json-2',
                                color: 'primary',
                                onSelect: () => handleImportMcpServer(),
                            },
                        ]"
                        :content="{
                            align: 'start',
                            side: 'bottom',
                            sideOffset: 8,
                        }"
                        :ui="{
                            content: 'w-48',
                        }"
                    >
                        <UButton icon="i-heroicons-plus" color="primary">
                            {{ t("console-ai-mcp-server.addTitle") }}
                        </UButton>
                    </UDropdownMenu>
                </AccessControl>
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
            <ProScrollArea class="h-[calc(100vh-13rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <McpServerCard
                        v-for="mcpServer in paging.items"
                        :key="mcpServer.id"
                        :mcpServer="mcpServer"
                        :selected="selectMcpServer.has(mcpServer.id as string)"
                        :isUpdate="updateIds"
                        @select="handleMcpServerSelect"
                        @delete="handleDeleteProvider"
                        @edit="handleEditProvider"
                        @view-models="handleViewModels"
                        @toggle-active="handleToggleProviderActive"
                        @set-quick-menu="handleSetQuickMenu"
                    />
                </div>
            </ProScrollArea>
        </template>

        <!-- 加载状态 -->
        <div
            v-else-if="paging.loading"
            class="flex h-[calc(100vh-13rem)] items-center justify-center"
        >
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground">{{ $t("console-common.loading") }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[calc(100vh-13rem)] flex-col items-center justify-center">
            <UIcon name="i-lucide-building" class="text-muted-foreground mb-4 h-16 w-16" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                {{ $t("console-ai-mcp-server.emptyState") }}
            </h3>
            <p class="text-accent-foreground">
                {{ $t("console-ai-mcp-server.emptyStateDescription") }}
            </p>
            <UDropdownMenu
                size="lg"
                :items="[
                    {
                        label: t('console-ai-mcp-server.quickCreateTitle'),
                        icon: 'i-heroicons-plus',
                        color: 'primary',
                        onSelect: () => handleAddMcpServer(),
                    },
                    {
                        label: t('console-ai-mcp-server.importTitle'),
                        icon: 'i-lucide-file-json-2',
                        color: 'primary',
                        onSelect: () => handleImportMcpServer(),
                    },
                ]"
                :content="{
                    align: 'start',
                    side: 'bottom',
                    sideOffset: 8,
                }"
                :ui="{
                    content: 'w-48',
                }"
            >
                <UButton class="mt-4" icon="i-heroicons-plus" color="primary">
                    {{ $t("console-ai-mcp-server.addFirstMcpServer") }}
                </UButton>
            </UDropdownMenu>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectMcpServer.size }} {{ $t("console-common.selected") }}
            </div>

            <div class="flex items-center gap-1.5">
                <ProPaginaction
                    v-model:page="paging.page"
                    v-model:size="paging.pageSize"
                    :total="paging.total"
                    @change="getLists"
                />
            </div>
        </div>

        <!-- MCP服务器弹窗 -->
        <McpServerEdit
            v-if="showMcpServerModal"
            :id="editingMcpServerId"
            :is-json-import="isJsonImport"
            @change-update="changeUpdate"
            @close="
                (refresh) => {
                    showMcpServerModal = false;
                    isView = false;
                    isJsonImport = false;
                    if (refresh) handleModalSuccess();
                }
            "
        />

        <McpDetail
            v-if="isView"
            :id="editingMcpServerId"
            @close="
                (refresh) => {
                    isView = false;
                    if (refresh) handleModalSuccess();
                }
            "
        />
    </div>
</template>
