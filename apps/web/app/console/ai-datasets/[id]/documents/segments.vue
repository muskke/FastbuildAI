<script lang="ts" setup>
import { ProPaginaction, ProScrollArea, usePaging, usePollingTask } from "@fastbuildai/ui";
import type { DropdownMenuItem } from "@nuxt/ui";
import { useDebounceFn } from "@vueuse/core";
import { useAsyncData } from "nuxt/app";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { DatasetDocument, DatasetSegment, QuerySegmentParams } from "@/models/ai-datasets";
import {
    apiBatchSetSegmentEnabled,
    apiGetAllDocumentList,
    apiGetSegmentList,
    apiSetSegmentEnabled,
} from "@/services/console/ai-datasets";

import { useDocumentActions, useSegmentActions, useSelection } from "../useDatasets";

const router = useRouter();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();
const { params: URLQueryParams, query: URLQuery } = useRoute();

const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);
const documentId = computed({
    get: () => (URLQuery as Record<string, string>).documentId,
    set: (value) => {
        router.replace({
            query: { documentId: value },
        });
        searchForm.documentId = value;
        getLists();
    },
});

// 文档操作
const { deleteDocument, renameDocument } = useDocumentActions();
// 分段操作
const { deleteSegments, createSegment, editSegment } = useSegmentActions();

// 获取文档列表
const { data: documentLists, refresh: refreshDocumentLists } = await useAsyncData(() =>
    apiGetAllDocumentList(datasetId.value as string),
);

// 分段查询参数
const searchForm = reactive<QuerySegmentParams>({
    keyword: "",
    documentId: documentId.value,
    datasetId: datasetId.value,
    status: undefined,
});

// 是否折叠
const isCollapsed = ref(true);

// 分页查询分段
const { paging, getLists, resetParams } = usePaging<DatasetSegment>({
    fetchFun: apiGetSegmentList,
    params: searchForm,
});

// 使用封装的轮询函数
const { start: startPolling, clear: stopPolling } = usePollingTask(
    async (stopFn) => {
        await getLists();

        if (!paging.needPolling) {
            stopFn();
        }
    },
    {
        interval: 1000,
    },
);

// 监听轮询状态
watch(
    () => paging.needPolling,
    (needPolling) => {
        if (needPolling) {
            startPolling();
        } else {
            stopPolling();
        }
    },
    { immediate: true },
);

// 分段选择
const {
    selected: selectedSegments,
    isAll: isAllSelected,
    isIndeterminate,
    toggle: toggleSegmentSelection,
    toggleAll: toggleAllSelection,
    clear: clearSelection,
} = useSelection(
    computed(() => (paging?.items as DatasetSegment[]) || []),
    (item: DatasetSegment) => item.id,
);

// 分段状态映射
const statusMap = {
    processing: { label: t("console-common.processing"), color: "warning" },
    completed: { label: t("console-common.completed"), color: "success" },
    failed: { label: t("console-common.failed"), color: "error" },
    pending: { label: t("console-common.pending"), color: "neutral" },
} as const;

// 分段状态选项
const statusOptions = [
    { label: t("console-common.all"), value: undefined },
    { label: t("console-common.processing"), value: "processing" },
    { label: t("console-common.completed"), value: "completed" },
    { label: t("console-common.failed"), value: "failed" },
    { label: t("console-common.pending"), value: "pending" },
];

// 监听搜索条件变化，自动重新获取数据
watch(
    () => [searchForm.keyword, searchForm.documentId, searchForm.status],
    () => {
        useDebounceFn(() => {
            paging.page = 1;
            getLists();
        }, 300)();
    },
    { deep: false, immediate: false },
);

// 删除分段
const handleDelete = async (ids: string | string[]) => {
    await deleteSegments(ids, getLists);
    clearSelection();
};

// 新增分段
const handleCreate = async () => {
    await createSegment(searchForm.documentId as string, getLists);
};

// 编辑分段
const handleEdit = async (segment: DatasetSegment) => {
    await editSegment(segment, getLists);
};

// 删除文档
const handleDocumentDelete = async () => {
    await deleteDocument(searchForm.documentId as string, getLists);
    router.back();
};

// 重命名文档
const handleRename = async () => {
    const document = documentLists.value?.find(
        (item) => item.id === searchForm.documentId,
    ) as DatasetDocument;
    await renameDocument(document, getLists);
    refreshDocumentLists();
};

// 切换分段启用状态
async function handleToggleEnabled(segment: DatasetSegment) {
    await apiSetSegmentEnabled(segment.id, segment.enabled ? 0 : 1);
    getLists();
}

// 批量切换分段启用状态
async function handleBatchSetEnabled(enabled: number) {
    await apiBatchSetSegmentEnabled(Array.from(selectedSegments.value), enabled);
    clearSelection();
    getLists();
}

// 获取当前选中的文档信息
const currentDocument = computed(() => {
    return documentLists.value?.find((item) => item.id === searchForm.documentId);
});

// 初始化
onMounted(() => getLists());

// 设置layout
definePageMeta({ layout: "full-screen" });
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <div class="flex items-center justify-between gap-1 py-4 pl-4">
            <div class="flex w-full items-center">
                <UButton
                    variant="ghost"
                    color="neutral"
                    class="rounded-full"
                    leading-icon="i-lucide-chevron-left"
                    @click="router.replace(`/console/ai-datasets/${datasetId}/documents`)"
                />

                <USelect
                    v-model="searchForm.documentId"
                    :items="
                        documentLists?.map((item) => ({
                            label: item.fileName,
                            value: item.id,
                        })) || []
                    "
                    label-key="label"
                    value-key="value"
                    variant="none"
                />
            </div>

            <div class="flex items-center gap-2">
                <UButton
                    color="primary"
                    variant="outline"
                    icon="i-lucide-plus"
                    :label="t('datasets.segments.createSegment')"
                    @click="handleCreate"
                />

                <UDropdownMenu
                    :items="
                        [
                            hasAccessByCodes(['ai-datasets-documents:rename'])
                                ? {
                                      label: t('datasets.segments.rename'),
                                      icon: 'i-lucide-pen-line',
                                      onClick: () => {
                                          handleRename();
                                      },
                                  }
                                : null,
                            hasAccessByCodes(['ai-datasets-documents:delete'])
                                ? {
                                      label: t('console-common.delete'),
                                      icon: 'i-lucide-trash',
                                      color: 'error',
                                      onSelect: () => {
                                          handleDocumentDelete();
                                      },
                                  }
                                : null,
                        ].filter(Boolean) as DropdownMenuItem[]
                    "
                >
                    <UButton icon="i-lucide-ellipsis-vertical" color="primary" variant="outline" />
                </UDropdownMenu>
            </div>
        </div>

        <div class="pl-4">
            <USeparator />
        </div>

        <div class="bg-background mb-2 flex w-full justify-between gap-4 py-4 pl-6">
            <div class="flex items-center gap-3">
                <UCheckbox
                    :model-value="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @update:model-value="toggleAllSelection"
                />
                <span class="text-sm font-semibold"
                    >{{ paging.total }} {{ t("datasets.segments.segment") }}</span
                >

                <UButton
                    v-if="selectedSegments.size > 0"
                    color="error"
                    variant="subtle"
                    :label="t('console-common.batchDelete')"
                    icon="i-heroicons-trash"
                    @click="handleDelete(Array.from(selectedSegments))"
                >
                    <template #trailing>
                        <UKbd>{{ selectedSegments.size }}</UKbd>
                    </template>
                </UButton>
                <UButton
                    v-if="selectedSegments.size > 0"
                    color="success"
                    variant="subtle"
                    :label="t('console-common.batchEnable')"
                    icon="i-heroicons-arrow-up-tray"
                    @click="handleBatchSetEnabled(1)"
                />
                <UButton
                    v-if="selectedSegments.size > 0"
                    color="error"
                    variant="subtle"
                    :label="t('console-common.batchDisable')"
                    icon="i-heroicons-arrow-down-tray"
                    @click="handleBatchSetEnabled(0)"
                />
            </div>

            <div class="flex items-center gap-2 md:ml-auto">
                <USelectMenu
                    v-model="searchForm.status as string"
                    :items="statusOptions"
                    :placeholder="t('console-common.status')"
                    class="w-30"
                    value-key="value"
                />

                <UInput
                    v-model="searchForm.keyword"
                    :placeholder="t('datasets.segments.searchPlaceholder')"
                    class="w-50"
                    icon="i-lucide-search"
                />

                <USeparator orientation="vertical" class="h-5" />

                <UTooltip
                    :text="
                        isCollapsed
                            ? t('datasets.segments.expandAll')
                            : t('datasets.segments.collapseAll')
                    "
                    :delayDuration="0"
                >
                    <UButton
                        variant="soft"
                        :icon="isCollapsed ? 'i-lucide-list-plus' : 'i-lucide-list-x'"
                        @click="isCollapsed = !isCollapsed"
                    />
                </UTooltip>
            </div>
        </div>

        <ClientOnly>
            <div
                v-if="!paging.loading && paging.items.length === 0"
                class="bg-background flex h-full items-center justify-center"
            >
                <div class="text-center">
                    <UIcon
                        name="i-lucide-file-text"
                        class="text-muted-foreground mx-auto mb-4 h-12 w-12"
                    />
                    <p class="text-muted-foreground text-sm">
                        {{ t("datasets.segments.noData") }}
                    </p>
                </div>
            </div>
        </ClientOnly>

        <!-- 主要内容区域：分段列表 + 文档信息面板 -->
        <div class="flex h-full flex-1">
            <!-- 左侧：分段列表 -->
            <ProScrollArea class="table h-full w-full px-6">
                <div
                    v-for="(segment, segmentIndex) in paging.items"
                    :key="segment.id"
                    class="group relative mb-2 flex items-stretch gap-4"
                >
                    <div class="pt-3">
                        <UCheckbox
                            :model-value="selectedSegments.has(segment.id)"
                            @update:model-value="() => toggleSegmentSelection(segment.id)"
                        />
                    </div>

                    <div
                        class="hover:bg-elevated/50 w-full rounded-lg p-3 transition-all duration-200"
                    >
                        <div class="mb-1 flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1 text-xs font-medium">
                                    <UIcon name="i-lucide-grip" class="size-3" />
                                    Chunks #{{ segmentIndex + 1 }}
                                </div>
                                <div class="text-xs">{{ segment.contentLength }} character</div>
                                <template v-if="segment.status === 'failed'">
                                    <UTooltip :text="segment?.error" :delay-duration="0">
                                        <UBadge
                                            :color="statusMap[segment.status]?.color || 'neutral'"
                                            variant="subtle"
                                            size="sm"
                                        >
                                            {{ statusMap[segment.status]?.label || segment.status }}
                                        </UBadge>
                                    </UTooltip>
                                </template>
                                <template v-else>
                                    <UBadge
                                        :color="statusMap[segment.status]?.color || 'neutral'"
                                        variant="subtle"
                                        size="sm"
                                    >
                                        {{ statusMap[segment.status]?.label || segment.status }}
                                    </UBadge>
                                </template>
                            </div>

                            <div class="flex items-center gap-2">
                                <UButton
                                    icon="i-lucide-pen-line"
                                    color="neutral"
                                    variant="ghost"
                                    size="sm"
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="handleEdit(segment)"
                                />
                                <UButton
                                    icon="i-lucide-trash"
                                    color="error"
                                    variant="ghost"
                                    size="sm"
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="handleDelete(segment.id)"
                                />

                                <USwitch
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    :model-value="segment.enabled === 1"
                                    color="success"
                                    @update:model-value="() => handleToggleEnabled(segment)"
                                />

                                <div class="flex items-center gap-2">
                                    <UChip
                                        :color="segment.enabled === 0 ? 'error' : 'success'"
                                        standalone
                                        inset
                                    >
                                        <span class="mr-2 text-xs">
                                            {{
                                                segment.enabled === 0
                                                    ? t("datasets.common.disabled")
                                                    : t("datasets.common.enabled")
                                            }}
                                        </span>
                                    </UChip>
                                </div>
                            </div>
                        </div>

                        <div
                            class="text-foreground text-xs leading-normal tracking-wide whitespace-pre-wrap"
                            :class="{ 'line-clamp-2': isCollapsed }"
                        >
                            {{ segment.content }}
                        </div>
                    </div>
                </div>

                <div v-if="paging.loading && paging.items.length === 0" class="p-4">
                    <div v-for="item in 20" :key="item" class="mb-6">
                        <div class="mb-3 flex">
                            <USkeleton class="size-3" />
                            <USkeleton class="ml-1 h-3 w-12" />
                            <USkeleton class="ml-6 h-3 w-12" />
                        </div>
                        <div class="grid gap-2">
                            <USkeleton class="h-3 w-full" />
                            <USkeleton class="h-3 w-full" />
                        </div>
                    </div>
                </div>
            </ProScrollArea>

            <!-- 右侧：文档信息面板 -->
            <div class="w-100 overflow-hidden pl-6" v-if="paging.items.length">
                <div class="mb-4">
                    <h3 class="text-foreground text-lg font-semibold">
                        {{ t("datasets.documents.table.fileName") }}
                    </h3>
                </div>

                <div v-if="currentDocument" class="space-y-4">
                    <!-- 文件基本信息 -->
                    <div class="space-y-4">
                        <div class="items-centsr flex gap-2">
                            <UButton
                                icon="i-lucide-file-text"
                                color="neutral"
                                variant="outline"
                                size="sm"
                            />
                            <span class="text-foreground truncate font-medium">
                                {{ currentDocument.fileName }}
                            </span>
                        </div>

                        <div class="space-y-4 text-xs">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >{{ t("datasets.documents.table.fileSize") }}:</span
                                >
                                <span class="text-foreground">
                                    {{ formatFileSize(currentDocument.fileSize) }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">
                                    {{ t("datasets.documents.table.fileType") }}:
                                </span>
                                <span class="text-foreground">{{ currentDocument.fileType }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">
                                    {{ t("datasets.documents.table.chunkCount") }}:
                                </span>
                                <span class="text-foreground">
                                    {{ currentDocument.chunkCount }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">
                                    {{ t("datasets.documents.table.characterCount") }}:
                                </span>
                                <span class="text-foreground">
                                    {{ formatCompactNumber(currentDocument.characterCount) }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">
                                    {{ t("datasets.documents.table.createdAt") }}:
                                </span>
                                <span class="text-foreground">
                                    <TimeDisplay
                                        :datetime="currentDocument.createdAt"
                                        mode="datetime"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 处理状态 -->
                    <div class="flex items-center justify-between">
                        <h4 class="text-foreground text-xs font-medium">
                            {{ t("console-common.status") }}
                        </h4>
                        <div class="flex items-center gap-2">
                            <UBadge
                                :color="statusMap[currentDocument.status]?.color || 'neutral'"
                                variant="subtle"
                            >
                                {{
                                    statusMap[currentDocument.status]?.label ||
                                    currentDocument.status
                                }}
                            </UBadge>
                            <span
                                v-if="currentDocument.progress !== undefined"
                                class="text-muted-foreground text-sm"
                            >
                                {{ currentDocument.progress }}%
                            </span>
                        </div>
                    </div>

                    <!-- 错误信息 -->
                    <div v-if="currentDocument.error" class="flex flex-col">
                        <h4 class="text-foreground text-xs font-medium">
                            {{ t("console-common.error") }}
                        </h4>
                        <div class="bg-muted mt-2 rounded-md p-3">
                            <p class="text-error text-xs">
                                {{ currentDocument.error || "-" }}
                            </p>
                        </div>
                    </div>

                    <!-- 文档ID -->
                    <div class="space-y-2">
                        <h4 class="text-foreground text-xs font-medium">文档 ID</h4>
                        <div class="bg-muted rounded-md p-2">
                            <p class="text-muted-foreground font-mono text-xs break-all">
                                {{ currentDocument.id }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-else class="flex items-center justify-center py-8">
                    <div class="text-center">
                        <UIcon
                            name="i-lucide-file-text"
                            class="text-muted-foreground mx-auto mb-2 h-8 w-8"
                        />
                        <p class="text-muted-foreground text-sm">
                            {{ t("console-common.noData") }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end py-2 pl-4">
            <ProPaginaction
                v-model:page="paging.page"
                v-model:size="paging.pageSize"
                :total="paging.total"
                @change="getLists"
            />
        </div>
    </div>
</template>
