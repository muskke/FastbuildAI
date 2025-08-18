<script setup lang="ts">
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { onMounted, reactive, ref } from "vue";

import type { McpServerInfo } from "@/models/web-mcp-server";
import {
    apiDeleteMcpServer,
    apiGetMcpServerList,
    apiUpdateMcpServerVisible,
} from "@/services/web/mcp-server";

const McpServerEdit = defineAsyncComponent(() => import("./mcp-server-edit.vue"));
const McpServerCard = defineAsyncComponent(() => import("./components/web-mcp-card.vue"));
const McpDetail = defineAsyncComponent(() => import("./components/mcp-server-detail.vue"));

// 路由实例
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数（匹配后端支持的参数）
const searchForm = reactive({
    name: "",
    type: "system",
});

const isJsonImport = ref(false);

// 选中的供应商
const selectMcpServer = ref<Set<string>>(new Set());

// 弹窗状态
const showMcpServerModal = ref(false);
const editingMcpServerId = ref("");
const isView = ref(false);
const isSystemMcp = ref(false);

const updateIds = ref<string[]>([]);

const systemList = ref<McpServerInfo[]>([]);
const page = ref(1);

const { paging, getLists } = usePaging({
    fetchFun: apiGetMcpServerList,
    params: searchForm,
});

/** 删除数据 */
const handleDelete = async (id: string) => {
    try {
        await useModal({
            title: t("console-ai-mcp-server.deleteTitle"),
            description: t("console-ai-mcp-server.deleteMessage"),
            color: "error",
        });

        await apiDeleteMcpServer(id);
        toast.success(t("console-ai-mcp-server.deleteSuccess"));

        // 清空选中状态
        selectMcpServer.value.clear();

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

/**
 * 处理删除 MCP 服务
 */
const handleDeleteProvider = (mcpServer: McpServerInfo) => {
    if (mcpServer.id) {
        handleDelete(mcpServer.id);
    }
};

/**
 * 查看模型
 */
const handleViewModels = (mcpServerId: string) => {
    editingMcpServerId.value = mcpServerId;
    isView.value = true;
};

/**
 * 新增 MCP 服务
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
 * 编辑供应商
 */
const handleEditProvider = (provider: McpServerInfo) => {
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
 * 处理显示/隐藏MCP服务
 */
const handleToggleVisible = async (providerId: string, isVisible: boolean) => {
    try {
        await apiUpdateMcpServerVisible(providerId, { status: isVisible });
        toast.success(
            isVisible
                ? t("console-ai-mcp-server.form.isActiveDisabled")
                : t("console-ai-mcp-server.form.isActiveEnabled"),
        );

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Toggle provider active failed:", error);
    }
};

const changeUpdate = (ids?: string[]) => {
    updateIds.value = ids || [];
};

const handleSearchChange = useDebounceFn(() => {
    page.value = 1;
    systemList.value = [];
    getLists();
}, 500);

definePageMeta({
    layout: "setting",
    title: "menu.mcpServerSetting",
    inSystem: true,
    inLinkSelector: true,
});

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="provider-list-container">
        <div
            class="bg-background sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 pb-4"
        >
            <UTabs
                v-model="searchForm.type"
                color="primary"
                :content="false"
                :items="[
                    {
                        label: t('console-ai-mcp-server.search.system'),
                        value: 'system',
                    },
                    {
                        label: t('console-ai-mcp-server.userMcp'),
                        value: 'user',
                    },
                ]"
                @update:modelValue="getLists"
            />
            <!-- 搜索区域 -->
            <div>
                <UInput
                    v-model="searchForm.name"
                    class="w-50"
                    :placeholder="t('console-ai-mcp-server.search.placeholder')"
                    @change="getLists"
                    @update:model-value="handleSearchChange"
                />
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
            <div class="grid grid-cols-1 gap-6 py-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                <div v-if="searchForm.type === 'user'" class="rounded-lg border border-dashed p-4">
                    <div class="flex flex-col">
                        <h3 class="text-muted-foreground pb-2 pl-2 text-xs font-bold">
                            {{ t("console-ai-mcp-server.addTitle") }}
                        </h3>
                        <div
                            class="text-primary hover:bg-primary-50 flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm"
                            @click="handleAddMcpServer"
                        >
                            <UIcon name="i-lucide-file-plus-2" class="mr-2 size-4" />
                            <span>{{ t("console-ai-mcp-server.quickCreateTitle") }}</span>
                        </div>
                        <div
                            class="text-primary hover:bg-primary-50 flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm"
                            @click="handleImportMcpServer"
                        >
                            <UIcon name="i-lucide-file-json-2" class="mr-2 size-4" />
                            <span>{{ t("console-ai-mcp-server.importTitle") }}</span>
                        </div>
                    </div>
                </div>
                <McpServerCard
                    v-for="mcpServer in paging.items"
                    :key="mcpServer.id"
                    :mcpServer="mcpServer"
                    :selected="selectMcpServer.has(mcpServer.id as string)"
                    :update-ids="updateIds"
                    @delete="handleDeleteProvider"
                    @edit="handleEditProvider"
                    @view-models="handleViewModels"
                    @toggle-visible="handleToggleVisible"
                />
            </div>
        </template>

        <!-- 加载状态 -->
        <div v-else-if="paging.loading" class="flex h-[50vh] items-center justify-center">
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground">{{ $t("console-common.loading") }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[50vh] flex-col items-center justify-center">
            <UIcon name="i-lucide-building" class="mb-4 h-16 w-16 text-gray-400" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                {{ $t("console-ai-mcp-server.emptyState") }}
            </h3>
            <p class="text-accent-foreground">
                {{ $t("console-ai-mcp-server.emptyStateDescription") }}
            </p>
            <UButtonGroup orientation="horizontal" class="mt-4">
                <UButton
                    v-if="searchForm.type !== 'system'"
                    icon="i-heroicons-plus"
                    color="primary"
                    @click="handleAddMcpServer"
                >
                    {{ $t("console-ai-mcp-server.quickCreateTitle") }}
                </UButton>
                <UButton
                    v-if="searchForm.type !== 'system'"
                    icon="i-lucide-file-json-2"
                    color="primary"
                    variant="subtle"
                    @click="handleImportMcpServer"
                >
                    {{ $t("console-ai-mcp-server.importTitle") }}
                </UButton>
            </UButtonGroup>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-50 flex items-center justify-between gap-3 py-4"
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
            :is-view="isView"
            :is-json-import="isJsonImport"
            :is-system-mcp="isSystemMcp"
            @change-update="changeUpdate"
            @close="
                (refresh) => {
                    showMcpServerModal = false;
                    isJsonImport = false;
                    if (refresh) handleModalSuccess();
                }
            "
        />
        <McpDetail
            v-if="isView"
            :id="editingMcpServerId"
            :is-view="isView"
            :is-system-mcp="isSystemMcp"
            @close="
                (refresh) => {
                    isView = false;
                    if (refresh) handleModalSuccess();
                }
            "
        />
    </div>
</template>
