<script lang="ts" setup>
import { ProPaginaction, useLockFn, useMessage, usePaging } from "@fastbuildai/ui";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { useDebounceFn } from "@vueuse/core";
import { h, onMounted, reactive, resolveComponent, watch } from "vue";

import type {
    AgentAnnotation,
    AnnotationReviewStatus,
    QueryAgentAnnotationParams,
} from "@/models/agent";
import {
    apiDeleteAgentAnnotation,
    apiGetAgentAnnotationList,
    apiReviewAgentAnnotation,
} from "@/services/web/agent";

import AgentAnnotationModal from "./annotation-modal.vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UInput = resolveComponent("UInput");
const TimeDisplay = resolveComponent("TimeDisplay");

const props = defineProps<{
    agentId: string;
}>();

const toast = useMessage();

// 表格实例 Refs
const table = useTemplateRef("table");

// 模态框相关状态
const modalOpen = ref(false);
const editingAnnotationId = ref<string | null>(null);

// 列表查询参数
const searchForm = reactive<QueryAgentAnnotationParams>({
    agentId: props.agentId,
    keyword: "",
    enabled: undefined,
    reviewStatus: undefined,
});

// 审核状态映射
const reviewStatusOptions = [
    { value: undefined as AnnotationReviewStatus | undefined, label: "全部状态" },
    { value: "pending" as AnnotationReviewStatus, label: "待审核" },
    { value: "approved" as AnnotationReviewStatus, label: "已通过" },
    { value: "rejected" as AnnotationReviewStatus, label: "已拒绝" },
];

// 获取审核状态的显示信息
const getReviewStatusDisplay = (status: AnnotationReviewStatus) => {
    switch (status) {
        case "pending":
            return { label: "待审核", color: "warning" };
        case "approved":
            return { label: "已通过", color: "success" };
        case "rejected":
            return { label: "已拒绝", color: "red" };
        default:
            return { label: "未知", color: "neutral" };
    }
};

// 列ID到中文名称的映射
const columnLabels = computed(() => ({
    question: "标注问题",
    answer: "标注答案",
    hitCount: "命中次数",
    enabled: "启用状态",
    reviewStatus: "审核状态",
    reviewer: "审核人",
    createdAt: "创建时间",
    actions: "操作",
}));

// 分页查询标注列表
const { paging, getLists } = usePaging<AgentAnnotation>({
    fetchFun: apiGetAgentAnnotationList,
    params: searchForm,
});

// 审核标注
const { lockFn: reviewAnnotation } = useLockFn(
    async (id: string, reviewStatus: AnnotationReviewStatus) => {
        try {
            await apiReviewAgentAnnotation(id, { reviewStatus });
            toast.success(`标注${reviewStatus === "approved" ? "通过" : "拒绝"}成功`);
            getLists();
        } catch (error) {
            console.error("审核标注失败:", error);
            toast.error("审核标注失败");
        }
    },
);

// 删除标注
const { lockFn: deleteAnnotation } = useLockFn(async (id: string) => {
    try {
        await apiDeleteAgentAnnotation(id);
        toast.success("标注删除成功");
        getLists();
    } catch (error) {
        console.error("删除标注失败:", error);
        toast.error("删除标注失败");
    }
});

// 定义表格列
const columns: TableColumn<AgentAnnotation>[] = [
    {
        accessorKey: "question",
        header: () => h("p", { class: "" }, `${columnLabels.value.question}`),
        cell: ({ row }) => {
            return h("div", { class: "flex items-start gap-3" }, [
                h(UIcon, {
                    name: "i-lucide-help-circle",
                    class: "text-primary size-5 mt-0.5 flex-shrink-0",
                }),
                h(
                    "p",
                    {
                        class: "font-medium text-highlighted line-clamp-2 max-w-sm",
                        title: row.original.question,
                    },
                    row.original.question,
                ),
            ]);
        },
    },
    {
        accessorKey: "answer",
        header: () => h("p", { class: "" }, `${columnLabels.value.answer}`),
        cell: ({ row }) => {
            return h("div", { class: "flex-1 grid" }, [
                h(
                    "p",
                    {
                        class: "text-sm text-muted-foreground truncate",
                        title: row.original.answer,
                    },
                    row.original.answer,
                ),
            ]);
        },
    },
    {
        accessorKey: "hitCount",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.hitCount}`),
        cell: ({ row }) => {
            const hitCount = row.original.hitCount || 0;
            const badgeColor = hitCount > 10 ? "success" : hitCount > 5 ? "warning" : "neutral";
            return h(
                "div",
                { class: "flex items-center justify-center flex-none" },
                h(UBadge, { color: badgeColor, variant: "subtle" }, () => hitCount.toString()),
            );
        },
    },
    {
        accessorKey: "enabled",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.enabled}`),
        cell: ({ row }) => {
            return h(
                "div",
                { class: "flex items-center justify-center flex-none" },
                h(
                    UBadge,
                    {
                        color: row.original.enabled ? "success" : "neutral",
                        variant: "subtle",
                    },
                    () => (row.original.enabled ? "启用" : "禁用"),
                ),
            );
        },
    },
    {
        accessorKey: "reviewStatus",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.reviewStatus}`),
        cell: ({ row }) => {
            const display = getReviewStatusDisplay(row.original.reviewStatus);
            return h(
                "div",
                { class: "flex items-center justify-center flex-none" },
                h(
                    UBadge,
                    {
                        color: display.color,
                        variant: "subtle",
                    },
                    () => display.label,
                ),
            );
        },
    },
    {
        accessorKey: "reviewer",
        header: () => h("p", { class: "whitespace-nowrap" }, `${columnLabels.value.reviewer}`),
        cell: ({ row }) => {
            const reviewer = row.original.reviewer;
            if (!reviewer) {
                return h(
                    "div",
                    { class: "flex items-center flex-none" },
                    h("span", { class: "text-muted-foreground text-sm" }, "未审核"),
                );
            }
            return h(
                "div",
                { class: "flex items-center justify-center flex-none" },
                h("div", { class: "flex items-center gap-2" }, [
                    reviewer.avatar
                        ? h("img", {
                              src: reviewer.avatar,
                              class: "w-6 h-6 rounded-full",
                              alt: reviewer.nickname || reviewer.username,
                          })
                        : h(UIcon, {
                              name: "i-lucide-user",
                              class: "w-6 h-6 text-muted-foreground",
                          }),
                    h(
                        "span",
                        { class: "text-sm font-medium" },
                        reviewer.nickname || reviewer.username,
                    ),
                ]),
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
        accessorKey: "actions",
        header: () => h("p", { class: "text-center" }, `${columnLabels.value.actions}`),
        cell: ({ row }) => {
            const actions = [
                h(UButton, {
                    color: "neutral",
                    variant: "ghost",
                    size: "xs",
                    icon: "i-lucide-edit",
                    onClick: () => handleEdit(row.original.id),
                }),
            ];

            // 如果是待审核状态，显示审核按钮
            if (row.original.reviewStatus === "pending") {
                actions.push(
                    h(UButton, {
                        color: "green",
                        variant: "ghost",
                        size: "xs",
                        icon: "i-lucide-check",
                        onClick: () => reviewAnnotation(row.original.id, "approved"),
                    }),
                    h(UButton, {
                        color: "red",
                        variant: "ghost",
                        size: "xs",
                        icon: "i-lucide-x",
                        onClick: () => reviewAnnotation(row.original.id, "rejected"),
                    }),
                );
            }

            actions.push(
                h(UButton, {
                    color: "red",
                    variant: "ghost",
                    size: "xs",
                    icon: "i-lucide-trash-2",
                    onClick: () => handleDelete(row.original.id),
                }),
            );

            return h("div", { class: "flex items-center justify-center gap-1" }, actions);
        },
    },
];

// 监听搜索条件变化，自动重新获取数据
watch(
    () => [searchForm.keyword, searchForm.enabled, searchForm.reviewStatus],
    () => {
        useDebounceFn(() => {
            paging.page = 1;
            getLists();
        }, 300)();
    },
    { deep: true },
);

// 处理新增标注
const handleCreate = () => {
    editingAnnotationId.value = null;
    modalOpen.value = true;
};

// 处理编辑标注
const handleEdit = (id: string) => {
    editingAnnotationId.value = id;
    modalOpen.value = true;
};

// 处理删除标注
const handleDelete = (id: string) => {
    deleteAnnotation(id);
};

// 处理模态框关闭
const handleModalClose = (refresh?: boolean) => {
    modalOpen.value = false;
    editingAnnotationId.value = null;
    if (refresh) {
        getLists();
    }
};

// 监听 agentId 变化，重新获取数据
watch(
    () => props.agentId,
    (newAgentId) => {
        searchForm.agentId = newAgentId;
        paging.page = 1;
        getLists();
    },
);

// 初始化
onMounted(() => {
    getLists();
});
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <!-- 搜索区域 -->
        <div class="flex h-full flex-1 flex-col">
            <div class="flex w-full justify-between gap-4 py-4 backdrop-blur-sm">
                <div class="flex items-center gap-2">
                    <UInput
                        v-model="searchForm.keyword"
                        placeholder="搜索标注问题或答案..."
                        class="w-80"
                        icon="i-lucide-search"
                    />
                    <UDropdownMenu
                        :items="[
                            {
                                label: '全部状态',
                                type: 'radio' as const,
                                checked: searchForm.enabled === undefined,
                                onSelect: () => (searchForm.enabled = undefined),
                            },
                            {
                                label: '已启用',
                                type: 'radio' as const,
                                checked: searchForm.enabled === true,
                                onSelect: () => (searchForm.enabled = true),
                            },
                            {
                                label: '已禁用',
                                type: 'radio' as const,
                                checked: searchForm.enabled === false,
                                onSelect: () => (searchForm.enabled = false),
                            },
                        ]"
                        :content="{ align: 'start' }"
                    >
                        <UButton
                            :label="
                                searchForm.enabled === undefined
                                    ? '全部状态'
                                    : searchForm.enabled
                                      ? '已启用'
                                      : '已禁用'
                            "
                            color="neutral"
                            variant="outline"
                            trailing-icon="i-lucide-chevron-down"
                        />
                    </UDropdownMenu>

                    <!-- 审核状态过滤器 -->
                    <UDropdownMenu
                        :items="
                            reviewStatusOptions.map((option) => ({
                                label: option.label,
                                type: 'radio' as const,
                                checked: searchForm.reviewStatus === option.value,
                                onSelect: () => (searchForm.reviewStatus = option.value),
                            }))
                        "
                        :content="{ align: 'start' }"
                    >
                        <UButton
                            :label="
                                reviewStatusOptions.find(
                                    (opt) => opt.value === searchForm.reviewStatus,
                                )?.label || '全部状态'
                            "
                            color="neutral"
                            variant="outline"
                            trailing-icon="i-lucide-chevron-down"
                        />
                    </UDropdownMenu>
                </div>

                <div class="flex items-center gap-2 md:ml-auto">
                    <UButton
                        label="新增标注"
                        color="primary"
                        variant="solid"
                        leading-icon="i-lucide-plus"
                        @click="handleCreate"
                    />

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
                            label="显示列"
                            color="neutral"
                            variant="outline"
                            trailing-icon="i-lucide-chevron-down"
                        />
                    </UDropdownMenu>

                    <UButton
                        label="刷新"
                        color="neutral"
                        variant="outline"
                        leading-icon="i-lucide-refresh-cw"
                        @click="getLists"
                    />
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="flex h-full flex-1 flex-col">
                <div class="table h-full">
                    <UTable
                        :loading="paging.loading"
                        :data="paging.items"
                        :columns="columns"
                        class="h-full"
                        ref="table"
                        sticky
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
                </div>
            </div>

            <!-- 分页 -->
            <div class="flex items-center justify-end gap-3 py-4">
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

        <!-- 标注新增/编辑模态框 -->
        <AgentAnnotationModal
            v-if="modalOpen"
            :agent-id="agentId"
            :annotation-id="editingAnnotationId"
            @close="handleModalClose"
        />
    </div>
</template>
