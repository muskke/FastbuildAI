<script lang="ts" setup>
import { useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { ProPaginaction } from "@fastbuildai/ui";
import type { TabsItem } from "@nuxt/ui";
import { computed, onMounted, reactive, ref } from "vue";

import type { DatasetSegment } from "@/models/datasets";
import {
    apiBatchDeleteSegments,
    apiDeleteSegment,
    apiGetAllDataRecords,
} from "@/services/console/datasets";
import { apiBatchSetSegmentEnabled, apiSetSegmentEnabled } from "@/services/console/datasets";

const toast = useMessage();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeStatus = computed<string>({
    get() {
        return (route.query?.status as string) || "all";
    },
    set(status) {
        searchForm.status = status;
        getLists();
        router.replace({
            path: route.path,
            query: { ...route.query, status },
        });
    },
});

const searchForm = reactive({
    keyword: "",
    status: activeStatus.value,
});

// 分段状态映射
const statusMap = {
    processing: { label: t("console-common.processing"), color: "warning" },
    completed: { label: t("console-common.completed"), color: "success" },
    failed: { label: t("console-common.failed"), color: "error" },
    pending: { label: t("console-common.pending"), color: "neutral" },
};
const statusItems: TabsItem[] = [
    { label: t("console-common.all"), value: "all" },
    { label: t("console-common.completed"), value: "completed" },
    { label: t("console-common.pending"), value: "pending" },
    { label: t("console-common.processing"), value: "processing" },
    { label: t("console-common.failed"), value: "failed" },
];

const selectedRecords = ref<Set<string>>(new Set());

const { paging, getLists } = usePaging({
    fetchFun: apiGetAllDataRecords,
    params: searchForm,
});

function handleRecordSelect(record: DatasetSegment, selected: boolean) {
    if (record.id) {
        if (selected) {
            selectedRecords.value.add(record.id);
        } else {
            selectedRecords.value.delete(record.id);
        }
    }
}

function handleSelectAll(value: boolean | "indeterminate") {
    if (value === true) {
        paging.items.forEach((item: DatasetSegment) => {
            if (item.id) selectedRecords.value.add(item.id);
        });
    } else {
        selectedRecords.value.clear();
    }
}

const isAllSelected = computed(
    () =>
        paging.items.length > 0 &&
        paging.items.every((item: DatasetSegment) => selectedRecords.value.has(item.id)),
);
const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter((item: DatasetSegment) =>
        selectedRecords.value.has(item.id),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

async function handleBatchDelete() {
    await useModal({
        title: t("datasets.dataRecord.batch.deleteTitle"),
        description: t("datasets.dataRecord.batch.deleteDesc", {
            count: selectedRecords.value.size,
        }),
        color: "error",
    });
    await apiBatchDeleteSegments(Array.from(selectedRecords.value));
    selectedRecords.value.clear();
    getLists();
    toast.success(t("datasets.dataRecord.batch.deleteSuccess"));
}

async function handleDelete(id: string) {
    await useModal({
        title: t("datasets.dataRecord.delete.title"),
        description: t("datasets.dataRecord.delete.desc"),
        color: "error",
    });
    await apiDeleteSegment(id);
    toast.success(t("datasets.dataRecord.delete.success"));
    getLists();
}

async function handleToggleEnabled(record: DatasetSegment) {
    await apiSetSegmentEnabled(record.id, record.enabled ? 0 : 1);
    selectedRecords.value.clear();
    getLists();
    toast.success(record.enabled ? t("console-common.disabled") : t("console-common.enabled"));
}

async function handleBatchSetEnabled(enabled: number) {
    await apiBatchSetSegmentEnabled(Array.from(selectedRecords.value), enabled);
    selectedRecords.value.clear();
    getLists();
    toast.success(
        enabled ? t("console-common.batchEnableSuccess") : t("console-common.batchDisableSuccess"),
    );
}

onMounted(() => getLists());
</script>

<template>
    <div class="data-list-container flex h-full flex-col pb-5">
        <div class="flex flex-col justify-center gap-1 pb-4">
            <h1 class="!text-lg font-bold">{{ $t("datasets.dataRecord.title") }}</h1>
            <p class="text-muted-foreground text-sm">{{ $t("datasets.dataRecord.desc") }}</p>
        </div>
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UTabs v-model="activeStatus" :items="statusItems" class="block w-auto" />
            <div class="flex items-center gap-2 md:ml-auto">
                <UCheckbox
                    :model-value="isAllSelected ? true : isIndeterminate ? 'indeterminate' : false"
                    @update:model-value="handleSelectAll"
                />
                <span class="text-accent-foreground text-sm">
                    {{ selectedRecords.size }} / {{ paging.items.length }}
                    {{ $t("console-common.selected") }}
                </span>

                <AccessControl :codes="['datasets:segments-delete']">
                    <UButton
                        v-if="selectedRecords.size > 0"
                        color="error"
                        variant="subtle"
                        :label="$t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectedRecords.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedRecords.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <AccessControl :codes="['datasets:segment-enabled']">
                    <UButton
                        v-if="selectedRecords.size > 0"
                        color="success"
                        variant="subtle"
                        :label="$t('console-common.batchEnable')"
                        icon="i-heroicons-arrow-up-tray"
                        :disabled="selectedRecords.size === 0"
                        @click="handleBatchSetEnabled(1)"
                    />
                    <UButton
                        v-if="selectedRecords.size > 0"
                        color="error"
                        variant="subtle"
                        :label="$t('console-common.batchDisable')"
                        icon="i-heroicons-arrow-down-tray"
                        :disabled="selectedRecords.size === 0"
                        @click="handleBatchSetEnabled(0)"
                    />
                </AccessControl>
                <UInput
                    v-model="searchForm.keyword"
                    :placeholder="$t('datasets.dataRecord.searchPlaceholder')"
                    class="w-80"
                    @change="getLists"
                />
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
        <div class="flex-1" v-else>
            <div
                v-for="(record, idx) in paging.items"
                :key="record.id"
                class="group relative mb-2 flex items-stretch gap-4"
            >
                <div class="pt-3">
                    <UCheckbox
                        :model-value="selectedRecords.has(record.id)"
                        @update:model-value="
                            () => handleRecordSelect(record, !selectedRecords.has(record.id))
                        "
                    />
                </div>
                <div class="hover:bg-elevated/50 w-full rounded-lg p-3 transition-all duration-200">
                    <div class="mb-1 flex items-start justify-between">
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1 text-xs font-medium">
                                <UIcon name="i-lucide-grip" class="size-3" />
                                Chunks #{{ record.chunkIndex }}
                            </div>
                            <div class="text-xs">{{ record.contentLength }} character</div>
                            <template v-if="record.status === 'failed'">
                                <UTooltip :text="record?.error" :delay-duration="0">
                                    <UBadge
                                        :color="
                                            statusMap[record.status as keyof typeof statusMap]
                                                ?.color || 'neutral'
                                        "
                                        variant="subtle"
                                        size="sm"
                                    >
                                        {{
                                            statusMap[record.status as keyof typeof statusMap]
                                                ?.label || record.status
                                        }}
                                    </UBadge>
                                </UTooltip>
                            </template>
                            <template v-else>
                                <UBadge
                                    :color="
                                        statusMap[record.status as keyof typeof statusMap]?.color ||
                                        'neutral'
                                    "
                                    variant="subtle"
                                    size="sm"
                                >
                                    {{
                                        statusMap[record.status as keyof typeof statusMap]?.label ||
                                        record.status
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
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="handleDelete(record.id)"
                                />
                            </AccessControl>

                            <AccessControl :codes="['datasets:segment-enabled']">
                                <USwitch
                                    class="opacity-0 transition-opacity group-hover:opacity-100"
                                    :model-value="record.enabled === 1"
                                    color="success"
                                    @update:model-value="() => handleToggleEnabled(record)"
                                />
                            </AccessControl>

                            <div class="flex items-center gap-2">
                                <UChip
                                    :color="record.enabled === 0 ? 'error' : 'success'"
                                    standalone
                                    inset
                                >
                                    <span class="mr-2 text-xs">
                                        {{
                                            record.enabled === 0
                                                ? $t("datasets.common.disabled")
                                                : $t("datasets.common.enabled")
                                        }}
                                    </span>
                                </UChip>
                            </div>
                        </div>
                    </div>
                    <div
                        class="text-foreground line-clamp-2 text-xs leading-normal tracking-wide whitespace-pre-wrap"
                    >
                        {{ record.content || record.description }}
                    </div>
                    <div class="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                        <TimeDisplay :datetime="record.createdAt" mode="date" />
                        <div class="text-primary text-xs">
                            {{ record.metadata?.fileName || record.title }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="paging.total > 0"
            class="sticky bottom-0 z-10 flex items-center justify-end gap-3 py-4 backdrop-blur-sm"
        >
            <ProPaginaction
                v-model:page="paging.page"
                v-model:size="paging.pageSize"
                :total="paging.total"
                @change="getLists"
            />
        </div>
    </div>
</template>
