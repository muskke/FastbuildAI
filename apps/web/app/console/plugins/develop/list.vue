<script lang="ts" setup>
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { useDebounceFn } from "@vueuse/core";
import { h, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { useRouter } from "vue-router";

import type { PluginItem } from "@/models/plugin";
import { apiGetPluginList, apiPostPluginDelete } from "@/services/console/plugin";

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 表格实例 Refs
const table = useTemplateRef("table");

// 列表查询参数
const searchForm = reactive({
    name: "",
});

// 列表数据和状态
const loading = ref(false);

// 列ID到中文名称的映射
const columnLabels = computed(() => ({
    select: t("console-common.select"),
    plugin: t("console-plugins.develop.pluginInfo"),
    packName: t("console-plugins.develop.pluginPackName"),
    version: t("console-plugins.develop.version"),
    status: t("console-plugins.develop.status.label"),
    pluginHome: t("console-plugins.develop.pluginHome"),
    createdAt: t("console-common.createAt"),
    actions: t("console-common.operation"),
}));

const { paging, getLists } = usePaging<PluginItem>({
    fetchFun: apiGetPluginList,
    params: searchForm,
});

// 定义表格列
const columns: TableColumn<PluginItem>[] = [
    {
        accessorKey: "plugin",
        header: () => h("p", { class: "" }, `${columnLabels.value.plugin}`),
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-3" }, [
                h(UAvatar, {
                    src: row.original.icon,
                    size: "lg",
                }),
                h("div", undefined, [
                    h("p", { class: "font-medium text-highlighted" }, row.original.name),
                    h(
                        "p",
                        { class: "text-sm text-muted-foreground truncate max-w-xs" },
                        row.original.description,
                    ),
                ]),
            ]);
        },
    },
    {
        accessorKey: "packName",
        header: () => h("p", { class: "" }, `${columnLabels.value.packName}`),
        cell: ({ row }) => {
            const packName = row.getValue("packName") as string;
            return h(
                "code",
                { class: "text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" },
                packName,
            );
        },
    },
    {
        accessorKey: "version",
        header: () => h("p", { class: "" }, `${columnLabels.value.version}`),
        cell: ({ row }) => {
            const version = row.getValue("version") as string;
            return h(UBadge, { color: "primary", variant: "subtle" }, () => `v${version}`);
        },
    },
    {
        accessorKey: "status",
        header: () => h("p", { class: "" }, `${columnLabels.value.status}`),
        cell: ({ row }) => {
            const needRestart = row.original.needRestart;
            return h(
                UBadge,
                { color: needRestart ? "warning" : "success", variant: "subtle" },
                () =>
                    needRestart
                        ? t("console-plugins.develop.needRestart")
                        : t("console-plugins.develop.noNeedRestart"),
            );
        },
    },
    {
        accessorKey: "pluginHome",
        header: () => h("p", { class: "" }, `${columnLabels.value.pluginHome}`),
        cell: ({ row }) => {
            const packName = row.getValue("packName") as string;
            return h(
                UButton,
                { color: "primary", variant: "link", target: "_blank", to: `/${packName}` },
                () => `${t("console-common.view")}`,
            );
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
function getRowItems(row: Row<PluginItem>) {
    return [
        {
            label: t("console-common.edit"),
            icon: "i-lucide-pen-line",
            onClick: () => {
                router.push({
                    path: "/console/plugins/develop/edit",
                    query: { id: row.original.id },
                });
            },
        },
        {
            label: t("console-common.delete"),
            icon: "i-lucide-trash",
            color: "error",
            onSelect() {
                handleDelete(row.original.id);
            },
        },
    ].filter(Boolean);
}

/**
 * 监听搜索条件变化，自动重新获取数据
 */
watch(
    () => [searchForm.name],
    () => {
        useDebounceFn(() => {
            paging.page = 1;
            getLists();
        }, 300)();
    },
    { deep: true },
);
/**
 * 删除数据
 */
const handleDelete = async (id: string) => {
    try {
        await useModal({
            color: "error",
            title: t("console-plugins.develop.messages.deleteTitle"),
            content: t("console-plugins.develop.messages.deleteMsg"),
            confirmText: t("console-common.delete"),
            ui: {
                content: "!w-sm",
            },
        });

        await apiPostPluginDelete(id);
        toast.success(t("console-plugins.develop.messages.deleteSuccess"));
        getLists();
    } catch (error) {
        console.error("删除失败:", error);
        toast.error(t("console-plugins.develop.messages.deleteError"));
    }
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="plugin-develop-list-container">
        <!-- 页面标题 -->
        <!-- <div class="mb-6">
            <h1 class="text-secondary-foreground text-2xl font-bold">
                {{ $t("console-plugins.develop.title") }}
            </h1>
            <p class="text-muted-foreground mt-1 text-sm">
                {{ $t("console-plugins.develop.description") }}
            </p>
        </div> -->

        <!-- 搜索区域 -->
        <div class="mb-4 flex flex-wrap gap-4">
            <UInput
                v-model="searchForm.name"
                :placeholder="$t('console-plugins.develop.keywordInput')"
                icon="i-lucide-search"
            />

            <!-- <USelectMenu
                v-model="searchForm.status"
                :items="statusOptions"
                value-key="value"
                :placeholder="$t('console-plugins.develop.statusInput')"
                :ui="{ base: 'w-44' }"
            /> -->

            <div class="flex items-end gap-2 md:ml-auto">
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

                <UButton
                    icon="i-heroicons-plus"
                    color="primary"
                    @click="router.push('/console/plugins/develop/add')"
                >
                    {{ $t("console-plugins.develop.buttons.add") }}
                </UButton>
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="loading"
            :data="paging.items"
            :columns="columns"
            class="shrink-0"
            ref="table"
            selectable
            :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
            }"
        />

        <!-- 分页 -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
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
