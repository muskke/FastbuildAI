<script setup lang="ts">
import { ProDateRangePicker, ProPaginaction, ProScrollArea } from "@fastbuildai/ui";
import { useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { computed, onMounted, reactive, ref } from "vue";

import TimeDisplay from "@/common/components/time-display.vue";
import type { AiConversation } from "@/models/ai-conversation";
import {
    apiBatchDeleteConversations,
    apiDeleteConversation,
    apiGetConversationList,
} from "@/services/console/ai-conversation";

const ConversationCard = defineAsyncComponent(() => import("./_components/conversation-card.vue"));
const ConversationDetail = defineAsyncComponent(() => import("./detail.vue"));
const UCheckbox = resolveComponent("UCheckbox");

const { hasAccessByCodes } = useAccessControl();

// 路由实例
const toast = useMessage();
const { t } = useI18n();
const table = ref();

// 列表查询参数
const searchForm = reactive({
    keyword: "",
    modelId: "",
    startDate: "",
    endDate: "",
});

const tab = ref(1);
const tabs = [
    { value: 1, icon: "i-lucide-list" },
    { value: 2, icon: "i-tabler-layout-grid" },
];

// 选中的对话
const selectedConversations = ref<Set<string>>(new Set());

// 弹窗状态
const showDetailModal = ref<boolean>(false);
const selectedConversationId = ref("");

const { paging, getLists } = usePaging({
    fetchFun: apiGetConversationList,
    params: searchForm,
});

/**
 * 处理对话选择
 */
const handleConversationSelect = (
    conversation: AiConversation,
    selected: boolean | "indeterminate",
) => {
    if (typeof selected === "boolean") {
        const conversationId = conversation.id;
        if (selected) {
            selectedConversations.value.add(conversationId);
        } else {
            selectedConversations.value.delete(conversationId);
        }
    }
};

const columns = ref<TableColumn<AiConversation>[]>([
    {
        id: "select",
        header: ({ table }) =>
            h(UCheckbox, {
                modelValue: table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : table.getIsAllPageRowsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") => {
                    table.toggleAllPageRowsSelected(!!value);
                    handleSelectAll(value);
                },
                "aria-label": "Select all",
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") => {
                    row.toggleSelected(!!value);
                    handleConversationSelect(row.original, value);
                },
                "aria-label": "Select row",
            }),
    },
    {
        accessorKey: "title",
        header: t("console-ai-conversation.list.title"),
    },
    {
        accessorKey: "userName",
        header: t("console-ai-conversation.list.userName"),
    },
    {
        accessorKey: "messageCount",
        header: t("console-ai-conversation.list.messageCount"),
    },
    {
        accessorKey: "totalTokens",
        header: t("console-ai-conversation.list.totalTokens"),
    },
    {
        accessorKey: "totalPower",
        header: t("console-ai-conversation.list.totalPower"),
    },
    {
        accessorKey: "updatedAt",
        header: t("console-ai-conversation.list.updatedAt"),
        cell: ({ row }) => {
            const updatedAt = row.getValue("updatedAt") as string;
            return h(TimeDisplay, {
                datetime: updatedAt,
                mode: "datetime",
            });
        },
    },
    {
        accessorKey: "action",
        header: t("console-ai-conversation.list.action"),
        size: 40, // 固定宽度
        enableSorting: false,
        enableHiding: false,
    },
]);

// 操作栏
function getRowItems(row: Row<AiConversation>) {
    return [
        {
            label: t("console-order-management.recharge.list.viewDetails"),
            icon: "i-lucide-eye",
            color: "info",
            onClick: () => {
                handleViewDetail(row.original.id);
            },
        },
        hasAccessByCodes(["ai-conversations:ai_conversation_delete"])
            ? {
                  label: t("console-common.delete"),
                  icon: "i-lucide-trash-2",
                  color: "error",
                  onSelect() {
                      handleDeleteConversation(row.original);
                  },
              }
            : null,
    ].filter(Boolean) as DropdownMenuItem[];
}

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    table.value?.tableApi.toggleAllPageRowsSelected(!!value);
    if (isSelected) {
        paging.items.forEach((conversation: AiConversation) => {
            selectedConversations.value.add(conversation.id);
        });
    } else {
        selectedConversations.value.clear();
    }
};

/**
 * 删除数据
 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-ai-conversation.delete.title"),
            description: t("console-ai-conversation.delete.description"),
            color: "error",
            cancelText: t("console-common.cancel"),
            confirmText: t("console-common.confirm"),
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteConversations(id);
            toast.success(t("common.message.deleteBatchSuccess"));
        } else {
            await apiDeleteConversation(id);
            toast.success(t("common.message.deleteSuccess"));
        }

        // 清空选中状态
        selectedConversations.value.clear();

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

/**
 * 处理删除对话
 */
const handleDeleteConversation = (conversation: AiConversation) => {
    handleDelete(conversation.id);
};

/**
 * 批量删除选中对话
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectedConversations.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};
/**
 * 查看对话详情
 */
const handleViewDetail = (conversationId: string) => {
    selectedConversationId.value = conversationId;
    showDetailModal.value = true;
};

/**
 * 计算选中状态
 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every((conversation: AiConversation) =>
            selectedConversations.value.has(conversation.id),
        )
    );
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter((conversation: AiConversation) =>
        selectedConversations.value.has(conversation.id),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

const handleSelect = (row: Row<AiConversation>) => {
    handleViewDetail(row.original.id);
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="conversation-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="$t('console-ai-conversation.search.placeholder')"
                @change="getLists"
            />

            <ProDateRangePicker
                v-model:start="searchForm.startDate"
                v-model:end="searchForm.endDate"
                :ui="{ root: 'w-auto sm:w-xs' }"
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
                    >
                        <template #label>
                            <span class="text-muted-foreground text-sm">
                                {{ selectedConversations.size }} / {{ paging.items.length }}
                                {{ t("console-common.selected") }}
                            </span>
                        </template>
                    </UCheckbox>
                </div>

                <AccessControl :codes="['ai_conversation_delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="$t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectedConversations.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedConversations.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <UTabs
                    v-model="tab"
                    :items="tabs"
                    size="xs"
                    :ui="{
                        root: 'gap-0',
                        indicator: 'bg-background dark:bg-primary',
                        leadingIcon: 'bg-black dark:bg-white',
                    }"
                ></UTabs>
            </div>
        </div>

        <!-- 列表展示 -->
        <template v-if="!paging.loading && paging.items.length > 0 && tab === 1">
            <ProScrollArea class="h-[calc(100vh-13rem)] pt-2" :shadow="false">
                <UTable
                    ref="table"
                    :data="paging.items"
                    :columns="columns"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default cursor-pointer',
                        tr: '[&:has(>td[colspan])]:hidden',
                    }"
                    @select="handleSelect"
                >
                    <template #title-cell="{ row }">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-message-circle" class="text-primary size-5" />
                            {{ row.original.title || "new Chat" }}
                        </div>
                    </template>
                    <template #userName-cell="{ row }">
                        <div class="flex items-center gap-2">
                            <UAvatar
                                v-if="row.original.user?.avatar"
                                :src="row.original.user?.avatar"
                            />
                            <UAvatar
                                v-else
                                icon="i-heroicons-user"
                                :name="row.original.user?.username"
                            />
                            <span>{{ row.original.user?.nickname }}</span>
                        </div>
                    </template>
                    <template #messageCount-cell="{ row }">
                        <UBadge color="primary" variant="subtle">
                            {{ row.original.messageCount }}
                        </UBadge>
                    </template>
                    <template #totalTokens-cell="{ row }">
                        <span class="text-primary">{{ row.original.totalTokens }}</span>
                    </template>
                    <template #totalPower-cell="{ row }">
                        <span class="text-success">{{ row.original.totalPower }}</span>
                    </template>
                    <template #action-cell="{ row }">
                        <UDropdownMenu :items="getRowItems(row)">
                            <UButton
                                icon="i-lucide-ellipsis-vertical"
                                color="neutral"
                                variant="ghost"
                                aria-label="Actions"
                            />
                        </UDropdownMenu>
                    </template>
                </UTable>
            </ProScrollArea>
        </template>

        <!-- 卡片网格 -->
        <template v-else-if="!paging.loading && paging.items.length > 0 && tab === 2">
            <ProScrollArea class="h-[calc(100vh-13rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <ConversationCard
                        v-for="conversation in paging.items"
                        :key="conversation.id"
                        :conversation="conversation"
                        :selected="selectedConversations.has(conversation.id)"
                        @select="handleConversationSelect"
                        @delete="handleDeleteConversation"
                        @view-detail="handleViewDetail"
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
            <UIcon name="i-lucide-message-circle" class="text-muted mb-4 h-16 w-16" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                {{ $t("console-ai-conversation.empty.title") }}
            </h3>
            <p class="text-accent-foreground">
                {{ $t("console-ai-conversation.empty.description") }}
            </p>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectedConversations.size }} {{ $t("console-common.selected") }}
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

        <!-- 对话详情弹窗 -->
        <ConversationDetail
            v-if="showDetailModal"
            :conversation-id="selectedConversationId"
            @close="showDetailModal = false"
        />
    </div>
</template>
