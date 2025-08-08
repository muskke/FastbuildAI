<script lang="ts" setup>
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import ProDateRangePicker from "@fastbuildai/ui/components/pro-date-range-picker.vue";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { h, onMounted, reactive, ref, resolveComponent } from "vue";
import { useRouter } from "vue-router";

import type { Dataset } from "@/models/datasets";
import { apiDeleteDataset, apiGetDatasetList } from "@/services/console/datasets";

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UBadge = resolveComponent("UBadge");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();

// 表格实例 Refs
const table = useTemplateRef("table");

// 列表查询参数
const searchForm = reactive({
    keyword: "",
    startTime: "",
    endTime: "",
});

// 列ID到中文名称的映射
const columnLabels = computed<Record<string, string>>(() => ({
    select: t("console-common.select"),
    name: t("datasets.common.name"),
    description: t("datasets.common.description"),
    storageSize: t("datasets.dataset.table.storageSize"),
    retrievalMode: t("datasets.common.retrievalMode"),
    documentCount: t("datasets.common.documentCount"),
    chunkCount: t("datasets.common.chunkCount"),
    createdAt: t("console-common.createAt"),
    actions: t("console-common.operation"),
}));

// 定义表格列
const columns: TableColumn<Dataset>[] = [
    {
        id: "select",
        header: ({ table }) =>
            h(UCheckbox, {
                modelValue: table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : table.getIsAllPageRowsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") => {
                    table.toggleAllPageRowsSelected(!!value);
                },
                ariaLabel: "Select all",
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") => {
                    row.toggleSelected(!!value);
                },
                ariaLabel: "Select row",
            }),
    },
    {
        accessorKey: "name",
        header: () => h("p", { class: "" }, `${columnLabels.value.name}`),
        cell: ({ row }) => {
            const name = row.getValue("name") as string;
            return h("div", { class: "flex-1 grid" }, [
                h("div", { class: "font-medium truncate" }, name),
            ]);
        },
    },
    {
        accessorKey: "description",
        header: () => h("p", { class: "" }, `${columnLabels.value.description}`),
        cell: ({ row }) => {
            const description = row.getValue("description") as string;
            return h("div", { class: "max-w-xs truncate text-gray-600" }, description || "-");
        },
    },
    {
        accessorKey: "storageSize",
        header: () => h("p", { class: "" }, `${columnLabels.value.storageSize}`),
        cell: ({ row }) => {
            const storageSize = row.original?.storageSize * 1;
            return h(
                UBadge,
                {
                    color: "neutral",
                    variant: "subtle",
                    class: "capitalize",
                },
                () => formatFileSize(storageSize),
            );
        },
    },
    {
        accessorKey: "retrievalMode",
        header: () => h("p", { class: "" }, `${columnLabels.value.retrievalMode}`),
        cell: ({ row }) => {
            const retrievalMode = row.getValue("retrievalMode") as string;
            const modeMap: Record<string, { label: string; color: string }> = {
                vector: { label: t("datasets.retrieval.vector"), color: "primary" },
                fullText: { label: t("datasets.retrieval.fullText"), color: "info" },
                hybrid: { label: t("datasets.retrieval.hybrid"), color: "success" },
            };
            const modeInfo = modeMap[retrievalMode] || { label: retrievalMode, color: "neutral" };
            return h(
                UBadge,
                {
                    color: modeInfo.color,
                    variant: "subtle",
                    class: "capitalize",
                },
                () => modeInfo.label,
            );
        },
    },
    {
        accessorKey: "documentCount",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.documentCount}`),
        cell: ({ row }) => {
            const documentCount = row.getValue("documentCount") as number;
            return h("div", { class: "text-center" }, documentCount || 0);
        },
    },
    {
        accessorKey: "chunkCount",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.chunkCount}`),
        cell: ({ row }) => {
            const chunkCount = row.getValue("chunkCount") as number;
            return h("div", { class: "text-center" }, chunkCount || 0);
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: columnLabels.value.createdAt,
                icon: isSorted
                    ? isSorted === "asc"
                        ? "i-lucide-arrow-up-narrow-wide"
                        : "i-lucide-arrow-down-wide-narrow"
                    : "i-lucide-arrow-up-down",
                class: "-mx-2.5",
                onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
            });
        },
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
    {
        id: "actions",
        header: () => h("p", { class: "" }, `${columnLabels.value.actions}`),
        size: 80, // 固定宽度
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            if (getRowItems(row).length === 0) return "";
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
];

// 操作栏
function getRowItems(row: TableRow<Dataset>) {
    return [
        hasAccessByCodes(["datasets:detail"])
            ? {
                  label: t("datasets.list.viewDocuments"),
                  icon: "i-lucide-eye",
                  onSelect: () => handleRowClick(row),
              }
            : null,
        hasAccessByCodes(["datasets:delete"])
            ? {
                  label: t("console-common.delete"),
                  icon: "i-lucide-trash",
                  color: "error",
                  onSelect: () => handleDelete(row.original.id),
              }
            : null,
    ].filter(Boolean);
}

/**
 * 获取表格数据
 */
const { paging, getLists } = usePaging({
    fetchFun: apiGetDatasetList,
    params: searchForm,
});

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("datasets.list.delete.title"),
            description: t("datasets.list.delete.desc"),
            color: "error",
            confirmText: t("console-common.delete"),
            cancelText: t("console-common.cancel"),
        });

        if (Array.isArray(id)) {
            // 批量删除
            const promises = id.map((datasetId) => apiDeleteDataset(datasetId));
            await Promise.all(promises);
        } else {
            // 单个删除
            await apiDeleteDataset(id);
        }

        getLists();
        toast.success(t("datasets.list.delete.success"));
    } catch (error) {
        console.error("删除失败:", error);
        toast.error(t("datasets.list.delete.failed"));
    }
};

// 点击表格行跳转文档
const handleRowClick = (row: TableRow<Dataset>) => {
    if (!hasAccessByCodes(["datasets:detail"])) return;
    router.push({
        path: useRoutePath("datasets:documents"),
        query: { datasetId: row.original.id },
    });
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="datasets-list-container">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-4">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('datasets.list.searchPlaceholder')"
                icon="i-lucide-search"
                class="w-48"
                @change="getLists"
            />
            <ProDateRangePicker
                v-model:start="searchForm.startTime"
                v-model:end="searchForm.endTime"
                :show-time="true"
                :ui="{ root: 'w-auto sm:w-xs' }"
                @change="getLists"
            />

            <div class="flex items-end gap-2 md:ml-auto">
                <AccessControl :codes="['datasets:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="!table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                        @click="
                            () => {
                                const selectedIds = table?.tableApi
                                    ?.getFilteredSelectedRowModel()
                                    .rows.map((row: any) => row.original.id) as string[];
                                if (selectedIds && selectedIds.length > 0) {
                                    handleDelete(selectedIds);
                                }
                            }
                        "
                    >
                        <template #trailing>
                            <UKbd>
                                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                            </UKbd>
                        </template>
                    </UButton>
                </AccessControl>
                <UDropdownMenu
                    :items="
                        table?.tableApi
                            ?.getAllColumns()
                            .filter((column: any) => column.getCanHide())
                            .map((column: any) => ({
                                label: columnLabels[column?.id] || column.columnDef.header,
                                type: 'checkbox' as const,
                                checked: column.getIsVisible(),
                                onUpdateChecked(checked: boolean) {
                                    table?.tableApi
                                        ?.getColumn(column.id)
                                        ?.toggleVisibility(!!checked);
                                },
                                onSelect(e?: Event) {
                                    e?.preventDefault();
                                },
                            }))
                    "
                    :content="{ align: 'end' }"
                >
                    <UButton
                        :label="t('console-common.showColumns')"
                        color="neutral"
                        variant="outline"
                        trailing-icon="i-lucide-chevron-down"
                    />
                </UDropdownMenu>
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="paging.loading"
            :data="paging.items"
            :columns="columns"
            class="h-[calc(100vh-12.5rem)] shrink-0"
            ref="table"
            selectable
            :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                tr: '[&:has(>td[colspan])]:hidden',
            }"
            :onSelect="handleRowClick"
        />

        <!-- 分页 -->
        <div class="mt-auto flex items-center justify-between gap-3 pt-4">
            <div class="text-muted text-sm">
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} /
                {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }}
                {{ t("console-common.selected") }}.
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
    </div>
</template>
