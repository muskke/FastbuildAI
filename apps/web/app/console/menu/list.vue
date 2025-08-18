<script lang="ts" setup>
import { useLockFn, useMessage, useModal } from "@fastbuildai/ui";
import type { TableColumn, TabsItem } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { type ExpandedState } from "@tanstack/vue-table";
import { watch } from "vue";
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { usePermissionStore } from "@/common/stores/permission";
import type { MenuFormData } from "@/models/menu";
import { apiBatchDeleteMenu, apiDeleteMenu, apiGetMenuTree } from "@/services/console/menu";

const PopEdit = defineAsyncComponent(() => import("./edit.vue"));

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UBadge = resolveComponent("UBadge");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const toast = useMessage();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { hasAccessByCodes } = useAccessControl();

// 表格实例 Refs
const table = useTemplateRef<any>("table");
// 菜单树
const menuTree = ref<MenuFormData[]>([]);

// 计算选中的行数（适用于树形表格）
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

// 来源类型选项卡
const sourceTypeItems: TabsItem[] = [
    {
        label: t("console-system-perms.menu.systemType"),
        value: 1,
    },
    // {
    //     label: t("console-system-perms.menu.pluginType"),
    //     value: 2,
    // },
];

// 当前选中的来源类型
const activeSourceType = computed<number>({
    get() {
        return Number(route.query.sourceType) || 1;
    },
    set(sourceType) {
        router.replace({
            path: route.path,
            query: { ...route.query, sourceType },
        });
    },
});

// 展开状态管理
const expanded = ref<ExpandedState>({});

// 列ID到中文名称的映射
const columnLabels = computed<Record<string, string>>(() => ({
    select: t("console-common.select"),
    name: t("console-system-perms.menu.name"),
    path: t("console-system-perms.menu.path"),
    icon: t("console-system-perms.menu.icon"),
    type: t("console-system-perms.menu.type"),
    sort: t("console-common.sort"),
    permissionCode: t("console-system-perms.menu.permissionCode"),
    isHidden: t("console-system-perms.menu.hidden"),
    createdAt: t("console-common.createAt"),
    actions: t("console-common.operation"),
}));

// 定义表格列
const columns: TableColumn<MenuFormData>[] = [
    {
        id: "expander",
        header: ({ table }) => {
            return h(UButton, {
                variant: "ghost",
                color: "neutral",
                icon: table.getExpandedDepth() ? "i-lucide-minus-square" : "i-lucide-plus-square",
                size: "xs",
                onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    table.toggleAllRowsExpanded(!table.getExpandedDepth());
                },
            });
        },
        enableHiding: false,
        cell: ({ row }) => {
            return row.getCanExpand()
                ? h(UButton, {
                      variant: "ghost",
                      color: "neutral",
                      icon: row.getIsExpanded() ? "i-lucide-minus" : "i-lucide-plus",
                      size: "xs",
                      onClick: (e: MouseEvent) => {
                          e.stopPropagation();
                          row.toggleExpanded();
                      },
                  })
                : null;
        },
    },
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
            const depth = row.depth;

            const indentElements = [];

            if (depth > 0) {
                // 添加连接线图标
                indentElements.push(
                    h("div", { style: { width: `${depth * 16}px` }, class: "flex-shrink-0" }),
                    h(UIcon, {
                        name: "i-lucide-corner-down-right",
                        class: "text-gray-400 flex-shrink-0 mr-1",
                    }),
                );
            }

            if (row.original.icon) {
                indentElements.push(
                    h(UIcon, {
                        name: `${row.original.icon}`,
                        class: "text-primary size-5 flex-shrink-0 mr-2",
                    }),
                );
            }

            indentElements.push(h("span", { class: "truncate" }, t(row.original.name)));

            return h("div", { class: "flex items-center" }, indentElements);
        },
    },
    {
        accessorKey: "path",
        header: () => h("p", { class: "" }, `${columnLabels.value.path}`),
        cell: ({ row }) => {
            const path = row.getValue("path") as string;
            return h("div", { class: "max-w-xs truncate" }, path || "-");
        },
    },
    {
        accessorKey: "type",
        header: () => h("p", { class: "" }, `${columnLabels.value.type}`),
        cell: ({ row }) => {
            const type = row.getValue("type") as number;
            const typeMap: Record<number, { label: string; color: string }> = {
                0: { label: t("console-common.menuType.group"), color: "neutral" },
                1: { label: t("console-common.menuType.catalogue"), color: "warning" },
                2: { label: t("console-common.menuType.menu"), color: "info" },
                3: { label: t("console-common.menuType.button"), color: "neutral" },
            };
            const typeInfo = typeMap[type] || { label: "-", color: "neutral" };
            return h(
                UBadge,
                {
                    color: typeInfo.color,
                    variant: "subtle",
                    class: "capitalize",
                },
                () => typeInfo.label,
            );
        },
    },
    {
        accessorKey: "isHidden",
        header: () => h("p", { class: "" }, `${columnLabels.value.isHidden}`),
        cell: ({ row }) => {
            const isHidden = row.getValue("isHidden") as number;
            return h(
                UBadge,
                {
                    color: isHidden ? "error" : "success",
                    variant: "subtle",
                },
                () =>
                    !isHidden
                        ? t("console-system-perms.menu.yes")
                        : t("console-system-perms.menu.no"),
            );
        },
    },
    {
        accessorKey: "permissionCode",
        header: () => h("p", { class: "" }, `${columnLabels.value.permissionCode}`),
        cell: ({ row }) => {
            const permissionCode = row.getValue("permissionCode") as string;
            return h("div", { class: "max-w-xs truncate" }, permissionCode || "-");
        },
    },
    {
        accessorKey: "sort",
        header: () => h("p", { class: "" }, `${columnLabels.value.sort}`),
        cell: ({ row }) => {
            const sort = row.getValue("sort") as number;
            return h("div", {}, sort || "0");
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
function getRowItems(row: Row<MenuFormData>) {
    return [
        hasAccessByCodes(["menu:add"])
            ? {
                  label: t("console-common.add"),
                  icon: "i-lucide-plus-circle",
                  color: "success",
                  onClick: () => {
                      currentId.value = null;
                      parentId.value = row.original.id as string;
                      showPopEdit.value = true;
                  },
              }
            : null,
        hasAccessByCodes(["menu:edit"])
            ? {
                  label: t("console-common.edit"),
                  icon: "i-lucide-pen-line",
                  onClick: () => {
                      currentId.value = row.original.id!;
                      showPopEdit.value = true;
                  },
              }
            : null,
        hasAccessByCodes(["menu:delete"])
            ? {
                  label: t("console-common.delete"),
                  icon: "i-lucide-trash",
                  color: "error",
                  onSelect() {
                      handleDelete(row.original.id as string);
                  },
              }
            : null,
    ].filter(Boolean);
}

const { lockFn: fetchMenuTree, isLock } = useLockFn(async () => {
    try {
        // 根据来源类型筛选菜单
        menuTree.value = await apiGetMenuTree(activeSourceType.value);
    } catch (error) {
        console.log("get menu-tree api error --->", error);
    }
});

/** 打开弹窗编辑 */
const showPopEdit = ref(false);
const currentId = ref<string | null>(null);
const parentId = ref<string | null>(null);

/**
 * 刷新侧边菜单
 * @description 重新加载权限数据，刷新侧边菜单
 */
const refreshSidebarMenu = () => {
    const permissionStore = usePermissionStore();
    permissionStore.loadPermissions();
};

/** 关闭弹窗 */
const handlePopClose = (refresh = false) => {
    showPopEdit.value = false;
    currentId.value = "";
    if (refresh) {
        fetchMenuTree();
        // 刷新侧边菜单
        refreshSidebarMenu();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-system-perms.menu.deleteTitle"),
            description: t("console-system-perms.menu.deleteMsg"),
            color: "error",
            confirmText: t("console-common.delete"),
            cancelText: t("console-common.cancel"),
        });

        let data;
        if (Array.isArray(id)) {
            // 批量删除
            data = await apiBatchDeleteMenu({ ids: id });
        } else {
            // 单个删除
            data = await apiDeleteMenu(id);
        }

        if (data.success) {
            fetchMenuTree();
            toast.success(t("console-system-perms.menu.success"));
        } else {
            toast.error(data.message);
        }
        // 刷新侧边菜单
        refreshSidebarMenu();
    } catch (error) {
        console.error("删除失败:", error);
        toast.error(t("console-system-perms.menu.error"));
    }
};

// 监听来源类型变化，重新获取菜单树
watch(
    () => activeSourceType.value,
    () => {
        fetchMenuTree();
    },
);

// 初始化
onMounted(() => fetchMenuTree());
</script>

<template>
    <div class="menu-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-4">
            <div class="itemc-end flex justify-end">
                <UTabs v-model="activeSourceType" :items="sourceTypeItems" class="block w-auto" />
            </div>

            <div class="flex items-end gap-2 md:ml-auto">
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

                <AccessControl :codes="['menu:add']">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="
                            () => {
                                currentId = null;
                                parentId = null;
                                showPopEdit = true;
                            }
                        "
                    >
                        {{ t("console-system-perms.menu.add") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="isLock"
            :data="menuTree"
            :columns="columns"
            class="shrink-0"
            ref="table"
            selectable
            :expanded="expanded"
            :getSubRows="(row) => row.children"
            :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                tr: '[&:has(>td[colspan])]:hidden',
            }"
        />
        <!-- 弹窗编辑组件 -->
        <PopEdit
            v-if="showPopEdit"
            :id="currentId"
            :parent-id="parentId"
            :source-type="activeSourceType || 1"
            @close="handlePopClose"
        />
    </div>
</template>
@/common/stores/permission
