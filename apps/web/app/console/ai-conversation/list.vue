<script setup lang="ts">
import { ProDateRangePicker, ProPaginaction } from "@fastbuildai/ui";
import { useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";

import type { AiConversation } from "@/models/ai-conversation";
import {
    apiBatchDeleteConversations,
    apiDeleteConversation,
    apiGetConversationList,
} from "@/services/console/ai-conversation";

const ConversationCard = defineAsyncComponent(() => import("./_components/conversation-card.vue"));
const ConversationDetail = defineAsyncComponent(() => import("./detail.vue"));

// 路由实例
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数
const searchForm = reactive({
    keyword: "",
    modelId: "",
    startDate: "",
    endDate: "",
});

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

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
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
            toast.success(t("console-ai-conversation.delete.batchSuccess"));
        } else {
            await apiDeleteConversation(id);
            toast.success(t("console-ai-conversation.delete.success"));
        }

        // 清空选中状态
        selectedConversations.value.clear();

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error(t("console-ai-conversation.delete.failed"));
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

            <ModelSelect
                v-model="searchForm.modelId"
                :default-selected="false"
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
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
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
