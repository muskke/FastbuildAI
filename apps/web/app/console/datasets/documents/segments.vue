<script lang="ts" setup>
import { ProPaginaction, ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { useDebounceFn } from "@vueuse/core";
import { useAsyncData } from "nuxt/app";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSelection } from "@/app/datasets/[id]/useDatasets";
import type { DatasetSegment, QuerySegmentParams } from "@/models/datasets";
import {
    apiBatchSetSegmentEnabled,
    apiDeleteSegment,
    apiGetDocumentList,
    apiGetSegmentList,
    apiSetSegmentEnabled,
} from "@/services/console/datasets";

const router = useRouter();
const route = useRoute();
const toast = useMessage();
const { t } = useI18n();

const datasetId = computed(() => (route.query as Record<string, string>).datasetId);
const documentId = ref<string | undefined>((route.query as Record<string, string>).documentId);

// 获取文档列表
const { data: documentLists, refresh: refreshDocumentLists } = await useAsyncData(() =>
    apiGetDocumentList(datasetId.value as string, { page: 1, pageSize: 100 }),
);

// 分段查询参数
const searchForm = reactive<QuerySegmentParams>({
    keyword: "",
    documentId: documentId.value,
    datasetId: datasetId.value,
    status: undefined,
});

// 分页查询分段
const { paging, getLists } = usePaging<DatasetSegment>({
    fetchFun: (params) => apiGetSegmentList(documentId.value as string, params),
    params: searchForm,
});

// 分段状态映射
const statusMap = {
    processing: { label: t("console-common.processing"), color: "warning" },
    completed: { label: t("console-common.completed"), color: "success" },
    failed: { label: t("console-common.failed"), color: "error" },
    pending: { label: t("console-common.pending"), color: "neutral" },
};

// 分段状态选项
const statusOptions = [
    { label: t("console-common.all"), value: null },
    { label: t("console-common.processing"), value: "processing" },
    { label: t("console-common.completed"), value: "completed" },
    { label: t("console-common.failed"), value: "failed" },
    { label: t("console-common.pending"), value: "pending" },
];

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

// 批量删除分段
const handleBatchDelete = async () => {
    await useModal({
        title: t("datasets.segments.delete.title"),
        description: t("datasets.segments.delete.desc"),
        color: "error",
    });
    // 逐个调用删除接口（如有批量接口可替换）
    await Promise.all(Array.from(selectedSegments.value).map((id) => apiDeleteSegment(id)));
    toast.success(t("datasets.segments.delete.success"));
    clearSelection();
    getLists();
};

// 批量启用/禁用分段
async function handleBatchSetEnabled(enabled: number) {
    await apiBatchSetSegmentEnabled(Array.from(selectedSegments.value), enabled);
    clearSelection();
    getLists();
    toast.success(
        enabled ? t("console-common.batchEnableSuccess") : t("console-common.batchDisableSuccess"),
    );
}

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
const handleDelete = async (id: string) => {
    await useModal({
        title: t("datasets.segments.delete.title"),
        description: t("datasets.segments.delete.desc"),
        color: "error",
    });
    await apiDeleteSegment(id);
    toast.success(t("datasets.segments.delete.success"));
    getLists();
};

// 启用/禁用分段
async function handleToggleEnabled(segment: DatasetSegment) {
    await apiSetSegmentEnabled(segment.id, segment.enabled ? 0 : 1);
    getLists();
    toast.success(segment.enabled ? t("console-common.disabled") : t("console-common.enabled"));
}

// 文档切换
watch(documentId, (val) => {
    searchForm.documentId = val;
    getLists();
});

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <div class="sticky top-0 z-10 backdrop-blur-sm">
            <div class="flex w-full justify-between gap-4 py-4">
                <div class="flex w-full items-center gap-2">
                    <UButton
                        variant="ghost"
                        color="neutral"
                        class="rounded-full"
                        leading-icon="i-lucide-chevron-left"
                        @click="router.back()"
                    />
                    <h1 class="flex-none text-lg font-bold">{{ $t("datasets.segments.title") }}</h1>
                    <USelect
                        v-model="documentId"
                        :items="
                            documentLists?.items?.map((item: any) => ({
                                label: item.fileName,
                                value: item.id,
                            })) || []
                        "
                        label-key="label"
                        value-key="value"
                        variant="none"
                        class="flex-1 truncate"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <UCheckbox
                        :ui="{
                            label: 'flex items-center gap-2',
                        }"
                        :model-value="isAllSelected"
                        :indeterminate="isIndeterminate"
                        @update:model-value="toggleAllSelection"
                    >
                        <template #label>
                            <span class="flex-none font-semibold">{{
                                $t("console-common.selectAll")
                            }}</span>
                        </template>
                    </UCheckbox>
                    <AccessControl :codes="['datasets:segments-delete']">
                        <UButton
                            v-if="selectedSegments.size > 0"
                            color="error"
                            variant="subtle"
                            :label="$t('console-common.batchDelete')"
                            icon="i-heroicons-trash"
                            @click="handleBatchDelete"
                        >
                            <template #trailing>
                                <UKbd>{{ selectedSegments.size }}</UKbd>
                            </template>
                        </UButton>
                    </AccessControl>
                    <AccessControl :codes="['datasets:segment-enabled']">
                        <UButton
                            v-if="selectedSegments.size > 0"
                            color="success"
                            variant="subtle"
                            :label="$t('console-common.batchEnable')"
                            icon="i-heroicons-arrow-up-tray"
                            @click="handleBatchSetEnabled(1)"
                        />
                        <UButton
                            v-if="selectedSegments.size > 0"
                            color="error"
                            variant="subtle"
                            :label="$t('console-common.batchDisable')"
                            icon="i-heroicons-arrow-down-tray"
                            @click="handleBatchSetEnabled(0)"
                        />
                    </AccessControl>
                    <USelectMenu
                        v-model="searchForm.status"
                        :items="statusOptions"
                        :placeholder="$t('console-common.status')"
                        class="w-30"
                        value-key="value"
                    />
                    <UInput
                        v-model="searchForm.keyword"
                        :placeholder="$t('datasets.segments.searchPlaceholder')"
                        class="w-50"
                        icon="i-lucide-search"
                    />
                </div>
            </div>
        </div>
        <div
            v-if="!paging.loading && paging.items.length === 0"
            class="bg-background flex h-[calc(100vh-10rem)] items-center justify-center"
        >
            <div class="text-center">
                <UIcon
                    name="i-lucide-file-text"
                    class="text-muted-foreground mx-auto mb-4 h-12 w-12"
                />
                <p class="text-muted-foreground text-sm">
                    {{ $t("console-common.noSegmentData") }}
                </p>
            </div>
        </div>
        <div class="flex-1 px-2" v-else>
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
                <div class="hover:bg-elevated/50 w-full rounded-lg p-3 transition-all duration-200">
                    <div class="mb-1 flex items-start justify-between">
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1 text-xs font-medium">
                                <UIcon name="i-lucide-grip" class="size-3" />
                                Chunks #{{ segment.chunkIndex }}
                            </div>
                            <div class="text-xs">{{ segment.contentLength }} character</div>
                            <template v-if="segment.status === 'failed'">
                                <UTooltip :text="segment?.error" :delay-duration="0">
                                    <UBadge
                                        :color="
                                            statusMap[segment.status as keyof typeof statusMap]
                                                ?.color || 'neutral'
                                        "
                                        variant="subtle"
                                        size="sm"
                                    >
                                        {{
                                            statusMap[segment.status as keyof typeof statusMap]
                                                ?.label || segment.status
                                        }}
                                    </UBadge>
                                </UTooltip>
                            </template>
                            <template v-else>
                                <UBadge
                                    :color="
                                        statusMap[segment.status as keyof typeof statusMap]
                                            ?.color || 'neutral'
                                    "
                                    variant="subtle"
                                    size="sm"
                                >
                                    {{
                                        statusMap[segment.status as keyof typeof statusMap]
                                            ?.label || segment.status
                                    }}
                                </UBadge>
                            </template>
                        </div>
                        <div class="flex items-center gap-2">
                            <AccessControl :codes="['datasets:segment-delete']">
                                <UButton
                                    icon="i-lucide-trash"
                                    color="error"
                                    variant="ghost"
                                    size="sm"
                                    @click="handleDelete(segment.id)"
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                />
                            </AccessControl>

                            <AccessControl :codes="['datasets:segment-enabled']">
                                <USwitch
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    :model-value="segment.enabled === 1"
                                    color="success"
                                    @update:model-value="() => handleToggleEnabled(segment)"
                                />
                            </AccessControl>

                            <div class="flex items-center gap-2">
                                <UChip
                                    :color="segment.enabled === 0 ? 'error' : 'success'"
                                    standalone
                                    inset
                                >
                                    <span class="mr-2 text-xs">
                                        {{
                                            segment.enabled === 0
                                                ? $t("datasets.common.disabled")
                                                : $t("datasets.common.enabled")
                                        }}
                                    </span>
                                </UChip>
                            </div>
                        </div>
                    </div>
                    <div
                        class="text-foreground text-xs leading-normal tracking-wide whitespace-pre-wrap"
                    >
                        {{ segment.content }}
                    </div>
                </div>
            </div>
        </div>
        <div class="sticky bottom-0 flex items-center justify-end p-4 backdrop-blur-sm">
            <ProPaginaction
                v-model:page="paging.page"
                v-model:size="paging.pageSize"
                :total="paging.total"
                @change="getLists"
            />
        </div>
    </div>
</template>
