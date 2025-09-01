<script setup lang="ts">
import { useMessage, usePaging } from "@fastbuildai/ui";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import type { Table } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";

import TimeDisplay from "@/common/components/time-display.vue";
import type { KeyConfigRequest } from "@/models/api-key-list";
import {
    createApiKey,
    deleteApiKey,
    deleteApiKeys,
    getApiKeyList,
    updateApiKey,
    updateApiKeyStatus,
} from "@/services/console/api-key-list";

import ListEdit from "./components/listEdit.vue";

const { t } = useI18n();

const toast = useMessage();

const UCheckbox = resolveComponent("UCheckbox");

// 选中的ID
const selectedIds = ref<string[]>([]);

// 编辑弹窗
const editKey = ref(false);

// 选中的ID
const selectedKeyId = ref<string | undefined>(undefined);

const columns = computed(() => [
    {
        id: "select",
        header: ({ table }: { table: Table<any> }) =>
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
        cell: ({ row }: { row: Row<KeyConfigRequest> }) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") => {
                    row.toggleSelected(!!value);
                    handleSelect(row, value);
                },
                "aria-label": "Select row",
            }),
    },
    { accessorKey: "name", header: t("console-api-key.list.form.name") },
    {
        accessorKey: "template",
        header: t("console-api-key.list.form.keyType"),
        cell: ({ row }: { row: Row<KeyConfigRequest> }) => row.original.template.name,
    },
    { accessorKey: "remark", header: t("console-api-key.list.form.remark") },
    { accessorKey: "status", header: t("console-api-key.list.form.status") },
    {
        accessorKey: "createdAt",
        header: t("console-api-key.list.form.createdAt"),
        cell: ({ row }: { row: Row<KeyConfigRequest> }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
    { accessorKey: "action", header: t("console-api-key.list.form.action") },
]);

const ApiKeyList = ref([
    {
        id: "1",
        keyName: "名称1",
        keyType: "类型1",
        remark: "备注1",
        status: true,
        createdAt: "2025-01-01",
    },
    {
        id: "2",
        keyName: "名称2",
        keyType: "类型2",
        remark: "备注2",
        status: false,
        createdAt: "2025-01-02",
    },
]);

/**
 * 搜索表单
 */
const searchForm = reactive({
    name: "",
});

/**
 * 获取列表
 */
const { paging, getLists } = usePaging({
    fetchFun: getApiKeyList,
    params: searchForm,
});

/**
 * 获取行操作
 */
const getRowItems = (row: Row<any>): DropdownMenuItem[] => {
    return [
        {
            label: t("console-api-key.list.form.edit"),
            icon: "i-lucide-edit",
            onClick: () => {
                selectedKeyId.value = row.original.id;
                editKey.value = true;
            },
        },
        {
            label: row.original.status
                ? t("console-api-key.list.form.disable")
                : t("console-api-key.list.form.enable"),
            icon: row.original.status ? "i-lucide-eye-off" : "i-lucide-eye",
            onSelect: async () => {
                try {
                    await updateApiKeyStatus(row.original.id, {
                        status: row.original.status ? 0 : 1,
                    });
                    toast.success(
                        row.original.status
                            ? t("console-api-key.list.disableSuccess")
                            : t("console-api-key.list.enableSuccess"),
                    );
                    getLists();
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            label: t("console-api-key.list.form.delete"),
            icon: "i-lucide-trash",
            color: "error",
            onSelect() {
                handleDelete(row.original.id);
            },
        },
    ];
};

/**
 * 处理新增
 */
const handleAdd = () => {
    editKey.value = true;
};

/**
 * 删除当前行
 */
const handleDelete = async (id: string) => {
    await deleteApiKey(id);
    toast.success(t("console-api-key.list.deleteSuccess"));
    handleClose();
    getLists();
};

const handleSwitchChange = async (row: Row<KeyConfigRequest>) => {
    if (!row.original.id) {
        console.error("行数据缺少 ID");
        return;
    }
    try {
        await updateApiKeyStatus(row.original.id, { status: row.original.status });
        toast.success(
            !row.original.status
                ? t("console-api-key.list.disableSuccess")
                : t("console-api-key.list.enableSuccess"),
        );
        getLists();
    } catch (error) {
        console.error("更新状态失败:", error);
    }
};

/**
 * 处理选择
 */
const handleSelect = (row: Row<any>, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const id = row.original.id as string;
        if (selected) {
            selectedIds.value.push(id);
        } else {
            selectedIds.value = selectedIds.value.filter((item) => item !== id);
        }
        console.log(selectedIds.value);
    }
};

/**
 * 处理全选
 */
const handleSelectAll = (selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        if (selected) {
            selectedIds.value = ApiKeyList.value.map((item) => item.id);
        } else {
            selectedIds.value = [];
        }
        console.log(selectedIds.value);
    }
};

/**
 * 处理批量删除
 */
const handleBatchDelete = async () => {
    await deleteApiKeys(selectedIds.value);
    selectedIds.value = [];
    toast.success(t("console-api-key.list.deleteSuccess"));
    getLists();
};

/**
 * 提交表单
 */
const handleSubmit = async (data: KeyConfigRequest, id?: string) => {
    if (id) {
        await updateApiKey(id, data);
    } else {
        await createApiKey(data);
    }
    toast.success(t("console-api-key.list.edit.submitSuccess"));
    getLists();
    handleClose();
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
    selectedKeyId.value = undefined;
    editKey.value = false;
};

// 初始化
onMounted(() => getLists());
</script>
<template>
    <div class="flex flex-col gap-4">
        <!-- 顶部控制区域 -->
        <div class="flex items-center justify-between">
            <UInput :placeholder="t('console-api-key.list.placeholder')" />

            <div class="flex items-center gap-2">
                <UButton
                    icon="i-tabler-trash"
                    color="error"
                    variant="outline"
                    @click="handleBatchDelete"
                    >{{ t("console-api-key.list.batchDelete") }}</UButton
                >
                <UButton color="primary" icon="i-lucide-plus" @click="handleAdd">{{
                    t("console-api-key.list.add")
                }}</UButton>
            </div>
        </div>
        <!-- 列表 -->
        <div>
            <UTable
                :columns="columns"
                :data="paging.items"
                :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'border-b border-default',
                    tr: '[&:has(>td[colspan])]:hidden',
                }"
            >
                <template #status-cell="{ row }">
                    <USwitch
                        :model-value="Boolean(row.original.status)"
                        @update:model-value="(value) => (row.original.status = value ? 1 : 0)"
                        @change="handleSwitchChange(row)"
                    />
                </template>
                <template #action-cell="{ row }">
                    <UDropdownMenu :items="getRowItems(row)">
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>
        </div>

        <ListEdit v-if="editKey" :id="selectedKeyId" @close="handleClose" @submit="handleSubmit" />
    </div>
</template>
