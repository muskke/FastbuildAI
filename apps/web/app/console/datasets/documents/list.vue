<script lang="ts" setup>
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { useDebounceFn } from "@vueuse/core";
import { computed, h, onMounted, reactive, resolveComponent, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { DatasetDocument, QueryDocumentParams } from "@/models/datasets";
import { apiDeleteDocument, apiGetDocumentList } from "@/services/console/datasets";

// 组件
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UInput = resolveComponent("UInput");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const router = useRouter();
const route = useRoute();
const toast = useMessage();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();

// 表格实例 Refs
const table = useTemplateRef("table");

// 获取 datasetId
const datasetId = computed(() => (route.query as Record<string, string>).datasetId);

// 列表查询参数
const searchForm = reactive<QueryDocumentParams>({
    keyword: "",
    status: null,
    datasetId: datasetId.value,
});

// 分页查询文档
const { paging, getLists } = usePaging<DatasetDocument>({
    fetchFun: (params) => apiGetDocumentList(datasetId.value as string, params),
    params: searchForm,
});

// 文件类型图标映射
const fileTypeIcons = {
    pdf: "i-lucide-file-text",
    doc: "i-lucide-file-text",
    docx: "i-lucide-file-text",
    txt: "i-lucide-file-text",
    md: "i-lucide-file-text",
    csv: "i-lucide-file-spreadsheet",
    xlsx: "i-lucide-file-spreadsheet",
    xls: "i-lucide-file-spreadsheet",
    default: "i-lucide-file",
};

// 状态映射
const statusMap = {
    processing: { label: t("console-common.processing"), color: "warning" as const },
    completed: { label: t("console-common.completed"), color: "success" as const },
    failed: { label: t("console-common.failed"), color: "error" as const },
    pending: { label: t("console-common.pending"), color: "neutral" as const },
    error: { label: t("datasets.documents.error"), color: "error" as const },
} as const;

// 列ID到中文名称的映射
const columnLabels = computed(() => ({
    select: t("console-common.select"),
    fileName: t("datasets.documents.table.fileName"),
    fileSize: t("datasets.documents.table.fileSize"),
    status: t("console-common.status"),
    process: t("datasets.documents.table.progress"),
    enabled: t("console-common.status"),
    characterCount: t("datasets.documents.table.characterCount"),
    chunkCount: t("datasets.documents.table.chunkCount"),
    createdAt: t("datasets.documents.table.createdAt"),
    actions: t("console-common.operation"),
}));

// 定义表格列
const columns: TableColumn<DatasetDocument>[] = [
    {
        accessorKey: "fileName",
        header: () => h("p", { class: "" }, `${columnLabels.value.fileName}`),
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-3" }, [
                h(UIcon, {
                    name:
                        fileTypeIcons[row.original.fileType as keyof typeof fileTypeIcons] ||
                        fileTypeIcons.default,
                    class: "text-primary size-5",
                }),
                h("div", { class: "flex-1 grid" }, [
                    h(
                        "p",
                        { class: "font-medium text-highlighted truncate" },
                        row.original.fileName,
                    ),
                ]),
            ]);
        },
    },
    {
        accessorKey: "fileSize",
        header: () => h("p", { class: "" }, `${columnLabels.value.fileSize}`),
        cell: ({ row }) => {
            const fileSize = row.getValue("fileSize") as number;
            return h("span", { class: "text-sm" }, formatFileSize(fileSize));
        },
    },
    {
        accessorKey: "enabled",
        header: () => h("p", { class: "" }, `${columnLabels.value.enabled}`),
        cell: ({ row }) => {
            const enabled = row.getValue("enabled") as boolean;
            const statusInfo = enabled
                ? { label: t("console-common.enabled"), color: "success" as const }
                : { label: t("console-common.disabled"), color: "error" as const };
            return h(
                UBadge,
                { color: statusInfo.color, variant: "subtle" },
                () => statusInfo.label,
            );
        },
    },
    {
        accessorKey: "characterCount",
        header: () =>
            h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.characterCount}`),
        cell: ({ row }) => {
            const characterCount = row.original.characterCount || 0;

            return h(
                "span",
                { class: "text-sm text-primary" },
                `${formatCompactNumber(characterCount)}`,
            );
        },
    },
    {
        accessorKey: "chunkCount",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.chunkCount}`),
        cell: ({ row }) => {
            const chunkCount = row.getValue("chunkCount") as number;
            return h(UBadge, { color: "primary", variant: "subtle" }, () => chunkCount.toString());
        },
    },

    {
        accessorKey: "status",
        header: () => h("p", { class: "" }, `${columnLabels.value.status}`),
        cell: ({ row }) => {
            const status = row.getValue("status") as keyof typeof statusMap;
            const statusInfo = statusMap[status];
            // 如果失败则显示错误信息
            if (status === "failed") {
                return h(
                    resolveComponent("UTooltip"),
                    {
                        text: row.original?.error,
                        delayDuration: 0,
                    },
                    {
                        default: () =>
                            h(
                                UBadge,
                                { color: statusInfo.color, variant: "subtle" },
                                () => statusInfo.label,
                            ),
                    },
                );
            }
            return h(
                UBadge,
                { color: statusInfo.color, variant: "subtle" },
                () => statusInfo.label,
            );
        },
    },
    {
        accessorKey: "progress",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.process}`),
        cell: ({ row }) => {
            const progress = row.original.progress || 0;

            return h("span", { class: "text-sm text-primary" }, `${progress}%`);
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
        size: 80,
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
function getRowItems(row: Row<DatasetDocument>) {
    return [
        hasAccessByCodes(["datasets:segments"])
            ? {
                  label: t("datasets.documents.viewSegments"),
                  icon: "i-lucide-list",
                  onSelect: () => handleRowClick(row),
              }
            : null,
        hasAccessByCodes(["datasets:document-delete"])
            ? {
                  label: t("console-common.delete"),
                  icon: "i-lucide-trash",
                  color: "error",
                  onSelect: () => handleDelete(row.original.id),
              }
            : null,
    ].filter(Boolean);
}

// 搜索防抖
watch(
    () => [searchForm.keyword, searchForm.fileType],
    () => {
        useDebounceFn(() => {
            paging.page = 1;
            getLists();
        }, 300)();
    },
    { deep: true },
);

// 删除文档
const handleDelete = async (id: string) => {
    await useModal({
        title: t("datasets.documents.delete.title"),
        description: t("datasets.documents.delete.desc"),
        color: "error",
    });
    await apiDeleteDocument(id);
    toast.success(t("console-common.deleteSuccess"));
    getLists();
};

const handleRowClick = (row: TableRow<DatasetDocument>) => {
    router.push({
        path: useRoutePath("datasets:segments"),
        query: { documentId: row.original.id, datasetId: datasetId.value },
    });
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <div class="flex items-center gap-2">
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="text-lg font-bold">{{ $t("datasets.documents.title") }}</h1>
        </div>

        <!-- 搜索区域 -->
        <div class="flex w-full justify-between gap-4 py-6 backdrop-blur-sm">
            <div class="flex items-center gap-2">
                <UInput
                    v-model="searchForm.keyword"
                    :placeholder="$t('datasets.documents.searchPlaceholder')"
                    icon="i-lucide-search"
                    @change="getLists"
                />
                <USelect
                    v-model="searchForm.status"
                    :items="[
                        { label: t('console-common.all'), value: null },
                        { label: t('console-common.pending'), value: 'pending' },
                        { label: t('console-common.processing'), value: 'processing' },
                        { label: t('console-common.completed'), value: 'completed' },
                        { label: t('console-common.failed'), value: 'failed' },
                    ]"
                    label-key="label"
                    value-key="value"
                    :placeholder="t('console-common.status')"
                    class="w-32"
                    @change="getLists"
                />
            </div>

            <div class="flex items-center gap-2 md:ml-auto">
                <UDropdownMenu
                    :items="
                        table?.tableApi
                            ?.getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => ({
                                label:
                                    columnLabels[column.id as keyof typeof columnLabels] ||
                                    column.columnDef.header,
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
                        :label="$t('console-common.showColumns')"
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
            class="h-[calc(100vh-17rem)] shrink-0"
            ref="table"
            selectable
            :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                tr: 'hover:bg-elevated/50',
            }"
            :onSelect="handleRowClick"
        />

        <!-- 分页 -->
        <div class="mt-auto flex items-center justify-end gap-3 py-4">
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
