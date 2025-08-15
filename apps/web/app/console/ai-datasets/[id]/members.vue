<script lang="tsx" setup>
import { ProPaginaction, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { useDebounceFn } from "@vueuse/core";
import { computed, h, markRaw, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { QueryTeamMemberParams, TeamMember, TeamRole } from "@/models/ai-datasets";
import {
    apiGetTeamMembers,
    apiRemoveTeamMember,
    apiTransferOwnership,
    apiUpdateTeamMemberRole,
} from "@/services/console/ai-datasets";

import AddMemberModal from "../_components/member/add.vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UInput = resolveComponent("UInput");
const UAvatar = resolveComponent("UAvatar");

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

const { params: URLQueryParams } = useRoute();
const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);

// 表格实例 Refs
const table = useTemplateRef("table");

// 列表查询参数
const searchForm = reactive<QueryTeamMemberParams>({
    datasetId: datasetId.value || "",
    username: "",
    role: undefined,
    isActive: undefined,
});

// 列表数据和状态
const showAddMemberModal = ref(false);

// 列ID到中文名称的映射
const columnLabels = computed(() => ({
    user: t("datasets.members.table.user"),
    role: t("datasets.members.table.role"),
    status: t("console-common.status"),
    joinedAt: t("datasets.members.table.joinedAt"),
    lastActiveAt: t("datasets.members.table.lastActiveAt"),
    actions: t("console-common.operation"),
}));

const { paging, getLists } = usePaging<TeamMember>({
    fetchFun: apiGetTeamMembers,
    params: searchForm,
});

// 角色映射
const roleMap = {
    owner: { label: t("datasets.members.role.owner"), color: "error" as const },
    manager: { label: t("datasets.members.role.manager"), color: "warning" as const },
    editor: { label: t("datasets.members.role.editor"), color: "primary" as const },
    viewer: { label: t("datasets.members.role.viewer"), color: "neutral" as const },
};

// 定义表格列
const columns: TableColumn<TeamMember>[] = [
    {
        accessorKey: "user",
        header: () => h("p", { class: "" }, `${columnLabels.value.user}`),
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-3" }, [
                h(UAvatar, {
                    src: row.original.user?.avatar,
                    alt: row.original.user?.username || row.original.userId,
                    size: "sm",
                }),
                h("div", undefined, [
                    h("div", { class: "flex items-center gap-2" }, [
                        h(
                            "p",
                            { class: "font-medium text-highlighted" },
                            row.original.user?.nickname ||
                                row.original.user?.username ||
                                row.original.userId,
                        ),
                        // 添加"自己"标识
                        row.original.oneself
                            ? h(UBadge, { color: "primary", variant: "subtle", size: "xs" }, () =>
                                  t("datasets.members.self"),
                              )
                            : null,
                    ]),
                    row.original.user?.email
                        ? h(
                              "p",
                              { class: "text-sm text-muted-foreground truncate max-w-xs" },
                              row.original.user.email,
                          )
                        : null,
                    row.original.note
                        ? h(
                              "p",
                              { class: "text-sm text-muted-foreground mt-1" },
                              `${t("datasets.members.note")}: ${row.original.note}`,
                          )
                        : null,
                ]),
            ]);
        },
    },
    {
        accessorKey: "role",
        header: () => h("p", { class: "" }, `${columnLabels.value.role}`),
        cell: ({ row }) => {
            const role = row.getValue("role") as keyof typeof roleMap;
            const roleInfo = roleMap[role];
            return h(UBadge, { color: roleInfo.color, variant: "subtle" }, () => roleInfo.label);
        },
    },
    {
        accessorKey: "isActive",
        header: () => h("p", { class: "" }, `${columnLabels.value.status}`),
        cell: ({ row }) => {
            const isActive = row.getValue("isActive") as boolean;
            return h(UBadge, { color: isActive ? "success" : "error", variant: "subtle" }, () =>
                isActive ? t("console-common.enabled") : t("console-common.disabled"),
            );
        },
    },
    {
        accessorKey: "joinedAt",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: columnLabels.value.joinedAt,
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
            const joinedAt = row.getValue("joinedAt") as string;
            return h("span", { class: "text-sm" }, new Date(joinedAt).toLocaleDateString());
        },
    },
    {
        accessorKey: "lastActiveAt",
        header: () => h("p", { class: "" }, `${columnLabels.value.lastActiveAt}`),
        cell: ({ row }) => {
            const lastActiveAt = row.getValue("lastActiveAt") as string | null;
            return h(
                "span",
                { class: "text-sm text-muted-foreground" },
                lastActiveAt ? new Date(lastActiveAt).toLocaleDateString() : "-",
            );
        },
    },
    {
        id: "actions",
        header: () => h("p", { class: "" }, `${columnLabels.value.actions}`),
        size: 80,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            const items = getRowItems(row);
            if (items.length === 0) {
                return null;
            }

            return h(UDropdownMenu, { items }, () => {
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
function getRowItems(row: Row<TeamMember>) {
    return [
        row.original.isCurrentUserOwner && row.original.role !== "owner"
            ? {
                  label: t("datasets.members.transferOwnership"),
                  icon: "i-lucide-crown",
                  onClick: () => {
                      handleTransferOwnership(row.original);
                  },
              }
            : null,
        row.original.canOperate && !row.original.oneself
            ? {
                  label: t("datasets.members.updateRole"),
                  icon: "i-lucide-pen-line",
                  onClick: () => {
                      handleUpdateRole(row.original);
                  },
              }
            : null,
        row.original.canOperate
            ? {
                  label: !row.original.oneself
                      ? t("datasets.members.removeMember")
                      : t("datasets.members.exit"),
                  icon: !row.original.oneself ? "i-lucide-trash" : "i-lucide-log-out",
                  color: "error",
                  onSelect() {
                      handleRemoveMember(row);
                  },
              }
            : null,
    ].filter(Boolean);
}

/**
 * 监听搜索条件变化，自动重新获取数据
 */
watch(
    () => [searchForm.username, searchForm.role, searchForm.isActive],
    () => {
        useDebounceFn(() => {
            paging.page = 1;
            getLists();
        }, 300)();
    },
    { deep: true },
);

/**
 * 添加成员
 */
const handleAddMember = async () => {
    showAddMemberModal.value = true;
};

/**
 * 更新成员角色
 */
const handleUpdateRole = async (member: TeamMember) => {
    try {
        const newRole = ref(member.role);

        const roleOptions = [
            { label: t("datasets.members.role.manager"), value: "manager" },
            { label: t("datasets.members.role.editor"), value: "editor" },
            { label: t("datasets.members.role.viewer"), value: "viewer" },
        ];

        const UpdateRoleForm = markRaw({
            setup() {
                return () =>
                    h("div", { class: "space-y-4" }, [
                        h("div", { class: "text-sm text-gray-600 mb-3" }, [
                            t("console-common.update"),
                            h(
                                "span",
                                { class: "text-red-500" },
                                member.user?.username || member.userId,
                            ),
                            t("datasets.members.roleTip"),
                        ]),
                        h("div", {}, [
                            h(
                                "label",
                                { class: "block text-sm font-medium mb-2" },
                                `${t("datasets.members.newRole")}:`,
                            ),
                            h(resolveComponent("USelectMenu"), {
                                modelValue: newRole.value,
                                "onUpdate:modelValue": (value: TeamRole) => (newRole.value = value),
                                items: roleOptions,
                                labelKey: "label",
                                valueKey: "value",
                                class: "w-full",
                            }),
                        ]),
                    ]);
            },
        });

        await useModal({
            title: t("datasets.members.updateRoleModal"),
            content: UpdateRoleForm,
            confirmText: t("console-common.update"),
            cancelText: t("console-common.cancel"),
            ui: { content: "!w-md" },
        });

        if (newRole.value !== member.role) {
            await apiUpdateTeamMemberRole({
                memberId: member.id,
                role: newRole.value,
            });
            toast.success(t("datasets.members.updateRoleSuccess"));
            getLists();
        }
    } catch (error) {
        console.error("更新角色失败:", error);
        toast.error(t("datasets.members.updateRoleFailed"));
    }
};

/**
 * 移除成员
 */
const handleRemoveMember = async (row: Row<TeamMember>) => {
    try {
        await useModal({
            color: "error",
            title: row.original.oneself
                ? t("datasets.members.confirmExit")
                : t("datasets.members.confirmRemove"),
            content: row.original.oneself
                ? t("datasets.members.confirmExitContent")
                : t("datasets.members.confirmRemoveContent"),
            confirmText: row.original.oneself
                ? t("console-common.exit")
                : t("console-common.remove"),
            ui: { content: "!w-sm" },
        });

        await apiRemoveTeamMember({ memberId: row.original.id });
        if (row.original.oneself) {
            router.push(useRoutePath("ai-datasets:list"));
            toast.success(t("datasets.members.exitSuccess"));
            return;
        }
        toast.success(t("datasets.members.removeSuccess"));
        getLists();
    } catch (error) {
        console.error("移除失败:", error);
        toast.error(t("datasets.members.removeFailed"));
    }
};

/**
 * 转移所有权
 */
const handleTransferOwnership = async (member: TeamMember) => {
    try {
        await useModal({
            color: "warning",
            title: t("datasets.members.transferOwnership"),
            content: h("div", { class: "text-sm text-gray-600" }, [
                h("p", { class: "mb-2" }, [
                    t("datasets.members.confirmTransferContent"),
                    h("span", { class: "text-red-500" }, member.user?.username || member.userId),
                    " ？",
                ]),
                h("p", { class: "text-red-500" }, t("datasets.members.confirmTransferContent2")),
            ]),
            confirmText: t("datasets.members.confirmTransfer"),
            ui: { content: "!w-sm" },
        });

        await apiTransferOwnership({
            datasetId: datasetId.value || "",
            newOwnerId: member.userId,
        });
        toast.success(t("datasets.members.confirmTransferSuccess"));
        getLists();
    } catch (error) {
        console.error("转移所有权失败:", error);
        toast.error(t("datasets.members.confirmTransferFailed"));
    }
};

onMounted(() => getLists());

definePageMeta({ layout: "full-screen" });
</script>

<template>
    <div class="flex h-full w-full flex-col px-6">
        <div class="flex flex-col justify-center gap-1 pt-4">
            <h1 class="!text-lg font-bold">{{ t("datasets.members.title") }}</h1>
            <p class="text-muted-foreground text-sm">
                {{ t("datasets.members.description") }}
            </p>
        </div>

        <!-- 搜索区域 -->
        <div class="flex w-full justify-between gap-4 py-6 backdrop-blur-sm">
            <UInput
                v-model="searchForm.username"
                :placeholder="$t('datasets.members.searchPlaceholder')"
                class="w-80"
                icon="i-lucide-search"
            />

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

                <UButton
                    :label="$t('datasets.members.addMember')"
                    leading-icon="i-lucide-plus"
                    color="primary"
                    @click="handleAddMember"
                />
            </div>
        </div>

        <!-- 表格区域 -->
        <UTable
            :loading="paging.loading"
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
                tr: 'hover:bg-elevated/50',
            }"
        />

        <!-- 分页 -->
        <div class="mt-auto flex items-center justify-end gap-3 py-4">
            <ProPaginaction
                v-model:page="paging.page"
                v-model:size="paging.pageSize"
                :total="paging.total"
                @change="getLists"
            />
        </div>

        <AddMemberModal
            v-model="showAddMemberModal"
            :dataset-id="datasetId || ''"
            @close="(refresh) => refresh && getLists()"
        />
    </div>
</template>
