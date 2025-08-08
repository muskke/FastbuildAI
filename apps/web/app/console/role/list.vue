<script lang="ts" setup>
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { h, onMounted, reactive, ref, resolveComponent } from "vue";
import { useRouter } from "vue-router";

import type { RoleFormData, RoleQueryRequest } from "@/models/role";
import { apiBatchDeleteRole, apiDeleteRole, apiGetRoleList } from "@/services/console/role";

const AssignPermissions = defineAsyncComponent(() => import("./assign-permissions.vue"));
const PopEdit = defineAsyncComponent(() => import("./edit.vue"));

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const TimeDisplay = resolveComponent("TimeDisplay");

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();

// 表格实例 Refs
const table = useTemplateRef("table");
// 列表查询参数
const searchForm = reactive<RoleQueryRequest>({
    name: "",
    description: "",
});

// 列ID到中文名称的映射
const columnLabels = computed<Record<string, string>>(() => ({
    select: t("console-common.select"),
    name: t("console-system-perms.role.name"),
    description: t("console-system-perms.role.describe"),
    status: t("console-common.status"),
    createdAt: t("console-common.createAt"),
    actions: t("console-common.operation"),
}));

// 定义表格列
const columns: TableColumn<RoleFormData>[] = [
    {
        id: "select",
        header: ({ table }) =>
            h(UCheckbox, {
                modelValue: table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : table.getIsAllPageRowsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                    table.toggleAllPageRowsSelected(!!value),
                ariaLabel: "Select all",
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                    row.toggleSelected(!!value),
                ariaLabel: "Select row",
            }),
    },
    {
        accessorKey: "name",
        header: () => h("p", { class: "" }, `${columnLabels.value.name}`),
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-3" }, [
                h("div", undefined, [h("p", { class: "" }, `@${row.original.name}`)]),
            ]);
        },
    },

    {
        accessorKey: "description",
        header: () => h("p", { class: "" }, `${columnLabels.value.description}`),
        cell: ({ row }) => {
            const description = row.getValue("description") as string;
            return h("div", { class: "max-w-xs truncate" }, description);
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
        size: 40, // 固定宽度
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            return h(
                "div",
                { class: "flex items-center gap-1" },
                [
                    hasAccessByCodes(["role:update"])
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
                    hasAccessByCodes(["role:permissions"])
                        ? h(UButton, {
                              icon: "i-lucide-shield-check",
                              color: "primary",
                              variant: "ghost",
                              size: "xs",
                              label: t("console-system-perms.role.permissions"),
                              onClick: () => {
                                  currentId.value = row.original.id!;
                                  showAssignPermissions.value = true;
                              },
                          })
                        : null,
                    hasAccessByCodes(["role:delete"])
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

/**
 * 获取表格数据
 */
const { paging, getLists } = usePaging({
    fetchFun: apiGetRoleList,
    params: searchForm,
});

/**
 * 打开弹窗编辑
 */
const showPopEdit = ref(false);
const showAssignPermissions = ref(false);
const currentId = ref<string | null>(null);

/** 关闭弹窗 */
function handlePopClose(refresh = false) {
    showPopEdit.value = false;
    if (refresh) {
        getLists();
    }
}

/** 关闭分配权限弹窗 */
function handleAssignPermissionsClose(refresh = false) {
    showAssignPermissions.value = false;
    if (refresh) {
        getLists();
    }
}

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-system-perms.role.deleteTitle"),
            description: t("console-system-perms.role.deleteMsg"),
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteRole({
                ids: id as string[],
            });
        } else {
            await apiDeleteRole(id);
        }
        // 刷新列表
        getLists();
        toast.success(t("console-system-perms.role.success"));
    } catch (error) {
        console.error("删除失败:", error);
        toast.error(t("console-system-perms.role.error"));
    }
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="role-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-4">
            <UInput
                v-model="searchForm.name"
                :placeholder="t('console-system-perms.role.nameInput')"
                @change="getLists"
            />

            <UInput
                v-model="searchForm.description"
                :placeholder="t('console-system-perms.role.descriptionInput')"
                :ui="{ root: 'max-w-xs w-full' }"
                @change="getLists"
            />

            <div class="flex items-end gap-2 md:ml-auto">
                <AccessControl :codes="['role:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="!table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                        @click="
                            handleDelete(
                                table?.tableApi
                                    ?.getFilteredSelectedRowModel()
                                    .rows.map((row: any) => row.original.id) as string[],
                            )
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
                            .filter((column) => column.getCanHide())
                            .map((column) => ({
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

                <AccessControl :codes="['role:create']">
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
                        {{ t("console-system-perms.role.add") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="paging.loading"
            :data="paging.items"
            :columns="columns"
            class="h-[calc(100vh-13rem)] shrink-0"
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

        <!-- 弹窗编辑组件 -->
        <PopEdit v-if="showPopEdit" :id="currentId" @close="handlePopClose" />

        <!-- 分配权限组件 -->
        <AssignPermissions
            v-if="showAssignPermissions"
            :id="currentId"
            @close="handleAssignPermissionsClose"
        />
    </div>
</template>
