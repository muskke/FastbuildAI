<script lang="ts" setup>
import { ProPaginaction, ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { computed, onMounted, reactive, ref, resolveComponent } from "vue";
import { useRouter } from "vue-router";

import type { AiModelInfo, AiModelQueryRequest, ModelType } from "@/models/ai-provider";
import {
    apiBatchDeleteAiModel,
    apiBatchSetAiModelIsActive,
    apiBatchUpdateAiModel,
    apiDeleteAiModel,
    apiGetAiModelList,
    apiSetAiModelIsActive,
    apiSetDefaultModel,
} from "@/services/console/ai-model";
import { apiGetAiProviderModelTypes } from "@/services/console/ai-provider";

import BatchEdit from "./_components/batch-edit.vue";

const ModelCard = defineAsyncComponent(() => import("./_components/model-card.vue"));

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();
const { query: URLQueryParams } = useRoute();
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const { hasAccessByCodes } = useAccessControl();
const table = useTemplateRef("table");

// 列表查询参数
const searchForm = reactive<AiModelQueryRequest>({
    keyword: "",
    providerId: URLQueryParams.id as string,
    isActive: undefined,
    modelType: [],
});

// 选中的AI模型
const selectedModels = ref<Set<string>>(new Set());
// 选中的AI模型数据
const selectedModelsData = ref<Set<AiModelInfo>>(new Set());

const modelTypes = ref<ModelType[]>([]);

const tab = ref(1);
const tabs = [
    { value: 1, icon: "i-tabler-layout-grid" },
    { value: 2, icon: "i-lucide-list" },
];

const columns = ref<TableColumn<AiModelInfo>[]>([
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
                    handleModelSelect(row.original, value);
                },
                "aria-label": "Select row",
            }),
    },
    {
        accessorKey: "icon",
        header: t("console-ai-provider.model.table.icon"),
    },
    {
        accessorKey: "name",
        header: t("console-ai-provider.model.table.name"),
    },
    {
        accessorKey: "model",
        header: t("console-ai-provider.model.table.model"),
    },
    {
        accessorKey: "modelType",
        header: t("console-ai-provider.model.table.modelType"),
    },
    {
        accessorKey: "isActive",
        header: t("console-ai-provider.model.table.isActive"),
    },
    {
        accessorKey: "isDefault",
        header: t("console-ai-provider.model.table.isDefault"),
    },
    {
        accessorKey: "sortOrder",
        header: t("console-ai-provider.model.table.sortOrder"),
    },
    {
        accessorKey: "action",
        header: t("console-ai-provider.model.table.action"),
        size: 40, // 固定宽度
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            return h(UDropdownMenu, { items: getRowItems(row) }, () => {
                return h(
                    UButton,
                    {
                        icon: "i-lucide-ellipsis-vertical",
                        color: "neutral",
                        variant: "ghost",
                        class: "ml-auto",
                    },
                    () => "",
                );
            });
        },
    },
]);

const showBatchEditModal = ref(false);

// 获取行操作
const getRowItems = (row: Row<AiModelInfo>) => {
    const items = [];

    if (hasAccessByCodes(["ai-models:update"])) {
        items.push({
            label: t("console-common.edit"),
            icon: "i-lucide-edit",
            onSelect: () =>
                router.push({
                    path: useRoutePath("ai-models:update"),
                    query: { id: row.original.id, providerId: row.original.providerId },
                }),
        });
    }

    if (hasAccessByCodes(["ai-models:update"]) && !row.original.isDefault) {
        items.push({
            label: t("console-ai-provider.model.setDefault"),
            icon: "i-lucide-star",
            onSelect: () => handleSetDefault(row.original),
        });
    }

    if (hasAccessByCodes(["ai-models:delete"])) {
        if (items.length > 0) {
            items.push({
                type: "separator" as const,
                label: "",
                onSelect: () => {},
            });
        }
        items.push({
            label: t("console-common.delete"),
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => handleDeleteModel(row.original),
        });
    }

    return items;
};

// 获取批量操作
const getBatchItems = () => {
    const items = [];
    if (hasAccessByCodes(["ai-models:update"])) {
        items.push({
            label: t("console-common.batchEnable"),
            icon: "i-lucide-eye",
            color: "neutral",
            onSelect: () => handleBatchIsActiveChange(true),
        });
        items.push({
            label: t("console-common.batchDisable"),
            icon: "i-lucide-eye-off",
            color: "neutral",
            onSelect: () => handleBatchIsActiveChange(false),
        });
        items.push({
            label: t("console-common.batchEdit"),
            icon: "i-lucide-edit",
            onSelect: () => handleBatchEdit(),
        });
    }
    if (hasAccessByCodes(["ai-models:delete"])) {
        items.push({
            label: t("console-common.batchDelete"),
            icon: "i-heroicons-trash",
            color: "error",
            onSelect: () => handleBatchDelete(),
        });
    }
    return items;
};

const { paging, getLists } = usePaging({
    fetchFun: apiGetAiModelList,
    params: searchForm,
});

/**
 * 获取模型类型
 */
const getModelTypes = async () => {
    const res = await apiGetAiProviderModelTypes();
    modelTypes.value = res;
};

onMounted(async () => {
    await getModelTypes();
});

/**
 * 处理AI模型选择
 */
const handleModelSelect = (model: AiModelInfo, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const modelId = model.id as string;
        if (selected) {
            selectedModels.value.add(modelId);
            selectedModelsData.value.add(model);
        } else {
            selectedModels.value.delete(modelId);
            selectedModelsData.value.delete(model);
        }
    }
};

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    table.value?.tableApi.toggleAllPageRowsSelected(!!value);
    if (isSelected) {
        paging.items.forEach((model: AiModelInfo) => {
            if (model.id) {
                selectedModels.value.add(model.id as string);
                selectedModelsData.value.add(model);
            }
        });
    } else {
        selectedModels.value.clear();
        selectedModelsData.value.clear();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-ai-provider.model.messages.deleteTitle"),
            description: t("console-ai-provider.model.messages.deleteMsg"),
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteAiModel(id);
        } else {
            await apiDeleteAiModel(id);
        }

        // 清空选中状态
        selectedModels.value.clear();

        // 刷新列表
        getLists();
        toast.success(t("console-ai-provider.model.messages.success"));
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

/**
 * 处理删除AI模型
 */
const handleDeleteModel = (model: AiModelInfo) => {
    if (model.id) {
        handleDelete(model.id);
    }
};

/**
 * 批量删除选中模型
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectedModels.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};

/**
 * 设置默认模型
 */
const handleSetDefault = async (model: AiModelInfo) => {
    try {
        await apiSetDefaultModel(model.id as string);
        toast.success(t("console-ai-provider.model.messages.setDefaultSuccess"));
        getLists();
    } catch (error) {
        console.error("Set default failed:", error);
    }
};

/**
 * 计算选中状态
 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every(
            (model: AiModelInfo) => model.id && selectedModels.value.has(model.id as string),
        )
    );
});

/**
 * 处理状态筛选变化
 */
const handleIsActiveChange = async (modelId: string, isActive: boolean) => {
    try {
        await apiSetAiModelIsActive(modelId, isActive);
        toast.success(
            isActive
                ? t("console-ai-provider.model.messages.isActiveEnabled")
                : t("console-ai-provider.model.messages.isActiveDisabled"),
        );

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Toggle model active failed:", error);
    }
};

/**
 * 批量设置AI模型状态
 */
const handleBatchIsActiveChange = async (isActive: boolean) => {
    const selectedIds = Array.from(selectedModels.value);
    if (selectedIds.length === 0) return;
    try {
        await apiBatchSetAiModelIsActive(selectedIds, isActive);
        toast.success(
            isActive
                ? t("console-ai-provider.model.messages.isActiveEnabled")
                : t("console-ai-provider.model.messages.isActiveDisabled"),
        );
        selectedModels.value.clear();
        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Toggle model active failed:", error);
    }
};

/**
 * 批量编辑AI模型
 */
const handleBatchEdit = () => {
    showBatchEditModal.value = true;
};

const handleClose = () => {
    showBatchEditModal.value = false;
};

// 设置操作列固定在右侧
const columnPinning = ref({
    left: [],
    right: ["action"],
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter(
        (model: AiModelInfo) => model.id && selectedModels.value.has(model.id as string),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

/**
 * 批量编辑提交
 */
const handleBatchEditSubmit = async (value: AiModelInfo[]) => {
    const models = value.map((model) => {
        return {
            id: model.id,
            name: model.name,
            model: model.model,
            maxContext: model.maxContext,
            isActive: model.isActive,
            billingRule: model.billingRule,
        };
    });
    await apiBatchUpdateAiModel(models);
    selectedModelsData.value.clear();
    selectedModels.value.clear();
    getLists();
    showBatchEditModal.value = false;
};

// 初始化
onMounted(async () => getLists());
</script>

<template>
    <div class="ai-model-list-container pb-5">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">
                {{ $t("console-ai-provider.model.title") }}
            </h1>
        </div>

        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('console-ai-provider.model.keywordInput')"
                @change="getLists"
            />

            <USelect
                v-model="searchForm.isActive"
                :items="[
                    { label: t('console-common.all'), value: undefined },
                    { label: t('console-common.active'), value: true },
                    { label: t('console-common.inactive'), value: false },
                ]"
                label-key="label"
                value-key="value"
                :placeholder="t('console-ai-provider.model.statusFilter')"
                @change="getLists"
            />
            <USelect
                v-model="searchForm.modelType"
                :items="modelTypes"
                multiple
                label-key="label"
                value-key="value"
                class="max-w-60 min-w-36"
                :placeholder="t('console-ai-provider.model.modelTypeFilter')"
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
                        {{ selectedModels.size }} / {{ paging.items.length }}
                        {{ t("console-common.selected") }}
                    </span>
                </div>

                <UDropdownMenu
                    v-if="
                        hasAccessByCodes(['ai-models:delete']) ||
                        hasAccessByCodes(['ai-models:update'])
                    "
                    size="lg"
                    :items="getBatchItems()"
                    :content="{
                        align: 'start',
                        side: 'bottom',
                        sideOffset: 8,
                    }"
                >
                    <UButton
                        color="neutral"
                        variant="outline"
                        :label="t('console-common.batchOperation')"
                        icon="i-lucide-list-checks"
                        :disabled="selectedModels.size === 0"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedModels.size }}</UKbd>
                        </template>
                    </UButton>
                </UDropdownMenu>

                <AccessControl :codes="['ai-models:create']">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="
                            router.push({
                                path: useRoutePath('ai-models:create'),
                                query: { providerId: searchForm.providerId },
                            })
                        "
                    >
                        {{ t("console-ai-provider.model.add") }}
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
                    @update:model-value="selectedModels.clear()"
                ></UTabs>
            </div>
        </div>

        <!-- 列表网格 -->
        <template v-if="!paging.loading && paging.items.length > 0 && tab === 2">
            <ProScrollArea class="h-[calc(100vh-17rem)]" :shadow="false">
                <UTable
                    ref="table"
                    :columns="columns"
                    :data="paging.items"
                    :loading="paging.loading"
                    v-model:column-pinning="columnPinning"
                    @page-change="getLists"
                    @page-size-change="getLists"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default',
                        tr: '[&:has(>td[colspan])]:hidden',
                    }"
                >
                    <template #icon-cell="{ row }">
                        <div
                            class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        >
                            <UIcon name="i-lucide-brain" class="h-5 w-5" />
                        </div>
                    </template>
                    <template #name-cell="{ row }">
                        <div class="max-w-40 truncate">
                            {{ row.original.name }}
                        </div>
                    </template>
                    <template #model-cell="{ row }">
                        <div class="max-w-40 truncate">
                            {{ row.original.model }}
                        </div>
                    </template>
                    <template #modelType-cell="{ row }">
                        <UBadge variant="soft" color="neutral">
                            {{ row.original.modelType?.toLocaleUpperCase().replaceAll("-", " ") }}
                        </UBadge>
                    </template>
                    <template #isActive-cell="{ row }">
                        <USwitch
                            v-model="row.original.isActive"
                            @update:model-value="
                                handleIsActiveChange(row.original.id, row.original.isActive)
                            "
                        />
                    </template>
                    <template #isDefault-cell="{ row }">
                        <UBadge v-if="row.original.isDefault" variant="soft" color="success">
                            {{ t("console-common.default") }}
                        </UBadge>
                        <div v-else>-</div>
                    </template>
                </UTable>
            </ProScrollArea>
        </template>

        <!-- 卡片网格 -->
        <template v-else-if="!paging.loading && paging.items.length > 0 && tab === 1">
            <ProScrollArea class="h-[calc(100vh-17rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <ModelCard
                        v-for="model in paging.items"
                        :key="model.id"
                        :model="model"
                        :provider-id="URLQueryParams.id as string"
                        :selected="selectedModels.has(model.id as string)"
                        @select="handleModelSelect"
                        @delete="handleDeleteModel"
                        @set-default="handleSetDefault"
                    />
                </div>
            </ProScrollArea>
        </template>

        <!-- 加载状态 -->
        <div
            v-else-if="paging.loading"
            class="flex h-[calc(100vh-17rem)] items-center justify-center"
        >
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground">{{ $t("console-common.loading") }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[calc(100vh-17rem)] flex-col items-center justify-center">
            <UIcon name="i-lucide-brain" class="text-muted-foreground mb-4 h-16 w-16" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                {{ $t("console-common.noData") }}
            </h3>
            <p class="text-accent-foreground">
                {{ $t("console-ai-provider.model.noModels") }}
            </p>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectedModels.size }} {{ $t("console-common.selected") }}
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

        <!-- 批量编辑 -->
        <BatchEdit
            v-if="showBatchEditModal"
            :models="selectedModelsData"
            @close="handleClose"
            @submit="handleBatchEditSubmit"
        />
    </div>
</template>
