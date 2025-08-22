<script lang="ts" setup>
import { useLockFn, useMessage, useModal } from "@fastbuildai/ui";
import type { TableColumn, TabsItem } from "@nuxt/ui";
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import type { MicropageFormData } from "@/models/decorate";
import {
    apiBatchDeleteMicropage,
    apiDeleteMicropage,
    apiGetMicropageList,
} from "@/services/console/decorate";

const PopEdit = defineAsyncComponent(() => import("./edit.vue"));

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const toast = useMessage();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { hasAccessByCodes } = useAccessControl();

// 表格实例 Refs
const table = useTemplateRef<any>("table");
// 微页面列表
const micropageList = ref<MicropageFormData[]>([]);

// 来源类型选项卡
const sourceTypeItems = computed<TabsItem[]>(() => [
    {
        label: t("console-decorate.micropage.list.sourceTypePC"),
        value: "web",
    },
]);

// 计算选中的行数
const selectedRowsCount = computed<number>(() => {
    if (!table.value?.tableApi) return 0;
    const selectedModel = table.value.tableApi.getSelectedRowModel();
    return selectedModel?.flatRows?.length || 0;
});

// 获取选中的行ID数组
const getSelectedIds = (): string[] => {
    if (!table.value?.tableApi) return [];
    const selectedModel = table.value.tableApi.getSelectedRowModel();
    return selectedModel?.flatRows?.map((row: any) => row.original.id) || [];
};

// 列ID到中文名称的映射
const columnLabels = computed<Record<string, string>>(() => ({
    select: t("console-common.select"),
    name: t("console-decorate.micropage.list.columns.name"),
    createdAt: t("console-common.createAt"),
    actions: t("console-common.operation"),
}));

// 定义表格列
const columns: TableColumn<MicropageFormData>[] = [
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
            return h("div", { class: "flex items-center" }, [
                h("span", { class: "truncate font-medium" }, row.original.name),
            ]);
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
        size: 120, // 固定宽度，增加一些空间给多个按钮
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            return h(
                "div",
                { class: "flex items-center gap-1" },
                [
                    hasAccessByCodes(["decorate-micropage:detail"])
                        ? h(UButton, {
                              icon: "i-lucide-brush",
                              color: "primary",
                              variant: "ghost",
                              size: "xs",
                              label: t("console-decorate.micropage.list.actions.design"),
                              onClick: () => {
                                  router.push({
                                      path: useRoutePath("decorate-micropage:detail"),
                                      query: { id: row.original.id as string },
                                  });
                              },
                          })
                        : null,
                    hasAccessByCodes(["decorate-micropage:update"])
                        ? h(UButton, {
                              icon: "i-lucide-pen-line",
                              color: "primary",
                              variant: "ghost",
                              size: "xs",
                              label: t("console-common.edit"),
                              onClick: () => {
                                  currentId.value = row.original.id!;
                                  showPopEdit.value = true;
                              },
                          })
                        : null,
                    hasAccessByCodes(["decorate-micropage:delete"])
                        ? h(UButton, {
                              icon: "i-lucide-trash",
                              color: "error",
                              variant: "ghost",
                              size: "xs",
                              label: t("console-common.delete"),
                              onClick: () => {
                                  handleDelete(row.original.id as string);
                              },
                          })
                        : null,
                ].filter(Boolean),
            );
        },
    },
];

const { lockFn: fetchMicropageList, isLock } = useLockFn(async () => {
    try {
        const result = await apiGetMicropageList();
        micropageList.value = result || [];
    } catch (error) {
        console.log("get micropage-list api error --->", error);
    }
});

/** 打开弹窗编辑 */
const showPopEdit = ref(false);
const currentId = ref<string | null>(null);

/** 关闭弹窗 */
const handlePopClose = (refresh = false) => {
    showPopEdit.value = false;
    currentId.value = "";
    if (refresh) {
        fetchMicropageList();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-common.confirm"),
            description: Array.isArray(id)
                ? t("console-decorate.micropage.list.batchDeleteMessage")
                : t("console-decorate.micropage.list.confirmDeleteMessage"),
            color: "error",
            confirmText: t("console-common.delete"),
            cancelText: t("console-common.cancel"),
        });

        let data: { success: boolean; message: string } | undefined;
        if (Array.isArray(id)) {
            // 批量删除
            data = await apiBatchDeleteMicropage({ ids: id });
        } else {
            // 单个删除
            data = await apiDeleteMicropage(id);
        }

        if (data?.success) {
            fetchMicropageList();
            table.value?.tableApi?.resetRowSelection();
            toast.success(t("console-common.messages.success"));
        } else {
            toast.error(data?.message || t("console-common.messages.failed"));
        }
    } catch (error) {
        console.error("删除失败:", error);
    }
};

// 初始化
onMounted(() => fetchMicropageList());
</script>

<template>
    <div class="micropage-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-4">
            <div class="itemc-end flex justify-end"></div>

            <div class="flex items-end gap-2 md:ml-auto">
                <AccessControl :codes="['decorate-micropage:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="!selectedRowsCount"
                        @click="
                            () => {
                                const selectedIds = getSelectedIds();
                                if (selectedIds && selectedIds.length > 0) {
                                    handleDelete(selectedIds);
                                }
                            }
                        "
                    >
                        <template #trailing>
                            <UKbd>
                                {{ selectedRowsCount }}
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

                <AccessControl :codes="['decorate-micropage:create']">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="
                            () => {
                                currentId = null;
                                showPopEdit = true;
                            }
                        "
                    >
                        {{ t("console-decorate.micropage.list.addMicropage") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="isLock"
            :data="micropageList"
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
        <!-- 弹窗编辑组件 -->
        <PopEdit v-if="showPopEdit" :id="currentId" @close="handlePopClose" />
    </div>
</template>
