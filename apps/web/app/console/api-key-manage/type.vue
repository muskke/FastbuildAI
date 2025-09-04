<script setup lang="ts">
import { ProPaginaction, useMessage, usePaging } from "@fastbuildai/ui";
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";
import { useI18n } from "vue-i18n";

import TimeDisplay from "@/common/components/time-display.vue";
import type { KeyTemplateFormData, KeyTemplateRequest } from "@/models/key-templates";
import {
    createApiKeyTemplate,
    deleteApiKeyTemplate,
    getApiKeyTemplateList,
    importApiKeyTemplate,
    updateApiKeyTemplate,
    updateApiKeyTemplateStatus,
} from "@/services/console/api-key-type";

import ApiEdit from "./components/typeEdit.vue";

const { t } = useI18n();

const toast = useMessage();

const columns = computed(() => [
    { accessorKey: "icon", header: t("console-api-key.type.form.icon") },
    { accessorKey: "name", header: t("console-api-key.type.form.name") },
    { accessorKey: "isActived", header: t("console-api-key.type.form.isActived") },
    {
        accessorKey: "createdAt",
        header: t("console-api-key.type.form.createdAt"),
        cell: ({ row }: { row: Row<KeyTemplateRequest> }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
    { accessorKey: "action", header: t("console-api-key.type.form.action") },
]);

// 搜索表单
const searchForm = reactive({
    name: "",
});

/**
 * 编辑弹窗
 */
const editKey = ref(false);
/**
 * 是否是导入
 */
const isJsonImport = ref(false);

/**
 * 选中的ID
 */
const selectedKeyId = ref<string | undefined>(undefined);

/**
 * 获取行操作
 */
const getRowItems = (row: Row<KeyTemplateRequest>): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [];

    items.push({
        label: t("console-api-key.type.form.edit"),
        icon: "i-lucide-edit",
        onClick: () => {
            editKey.value = true;
            selectedKeyId.value = row.original.id;
        },
    });

    items.push({
        label: t("console-api-key.type.form.delete"),
        icon: "i-lucide-trash",
        color: "error",
        onSelect() {
            if (!row.original.id) {
                console.error("行数据缺少 ID");
                return;
            }
            handleDelete(row.original.id);
        },
    });

    return items;
};

const handleSwitchChange = async (row: Row<KeyTemplateRequest>) => {
    if (!row.original.id) {
        console.error("行数据缺少 ID");
        return;
    }
    try {
        await updateApiKeyTemplateStatus(row.original.id, { isEnabled: row.original.isEnabled });
        toast.success(
            !row.original.isEnabled
                ? t("console-api-key.type.disableSuccess")
                : t("console-api-key.type.enableSuccess"),
        );
        getLists();
    } catch (error) {
        console.error("更新状态失败:", error);
    }
};

/**
 * 提交表单
 */
const handleSubmit = async (value: KeyTemplateFormData, id?: string) => {
    try {
        if (id) {
            await updateApiKeyTemplate(id, value);
        } else {
            await createApiKeyTemplate(value);
        }
        toast.success(t("console-api-key.type.edit.submitSuccess"));
        getLists();
        handleClose();
    } catch (error) {
        console.error("表单提交失败:", error);
    }
};

// JSON导入
const jsonSubmitForm = async (value: string) => {
    try {
        await importApiKeyTemplate({ jsonData: value });
        toast.success(t("console-api-key.type.edit.submitSuccess"));
        getLists();
        handleClose();
    } catch (error) {
        console.error("JSON导入失败:", error);
    }
};

// 获取列表
const { paging, getLists } = usePaging({
    fetchFun: getApiKeyTemplateList,
    params: searchForm,
});

/**
 * 删除
 */
const handleDelete = async (id: string) => {
    try {
        await deleteApiKeyTemplate(id);
        toast.success(t("console-api-key.type.deleteSuccess"));
        getLists();
    } catch (error) {
        console.error("删除失败:", error);
    }
};

/**
 * 打开编辑弹窗
 */
const handleOpenEdit = (isImport: boolean = false) => {
    editKey.value = true;
    isJsonImport.value = isImport;
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
    editKey.value = false;
    selectedKeyId.value = undefined;
    isJsonImport.value = false;
};

// 初始化
onMounted(() => getLists());
</script>
<template>
    <div class="flex h-full flex-col gap-4">
        <!-- 顶部控制区域 -->
        <div class="flex items-center justify-between">
            <UInput v-model="searchForm.name" placeholder="请输入名称..." @change="getLists" />
            <UDropdownMenu
                size="lg"
                :items="[
                    {
                        label: t('console-ai-mcp-server.quickCreateTitle'),
                        icon: 'i-heroicons-plus',
                        color: 'primary',
                        onSelect: () => handleOpenEdit(),
                    },
                    {
                        label: t('console-ai-mcp-server.importTitle'),
                        icon: 'i-lucide-file-json-2',
                        color: 'primary',
                        onSelect: () => handleOpenEdit(true),
                    },
                ]"
            >
                <UButton color="primary" icon="i-lucide-plus">
                    {{ t("console-api-key.type.addType") }}
                </UButton>
            </UDropdownMenu>
        </div>
        <!-- 列表 -->
        <div class="flex-1 overflow-y-auto">
            <UTable
                sticky
                class="h-full"
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
                <template #icon-cell="{ row }">
                    <UAvatar
                        :src="row.original.icon"
                        :alt="row.original.name"
                        size="md"
                        :ui="{ image: 'rounded-lg', fallback: 'text-inverted font-medium' }"
                        :class="[row.original.icon ? '' : 'bg-primary']"
                    />
                </template>
                <template #type-cell="{ row }">
                    {{
                        row.original.type === "system"
                            ? t("console-api-key.type.form.system")
                            : t("console-api-key.type.form.custom")
                    }}
                </template>
                <template #isActived-cell="{ row }">
                    <USwitch
                        :model-value="Boolean(row.original.isEnabled)"
                        @update:model-value="(value) => (row.original.isEnabled = value ? 1 : 0)"
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

        <!-- 分页 -->
        <div class="bg-background flex items-center justify-end gap-3 py-4">
            <div class="flex items-center gap-1.5">
                <ProPaginaction
                    v-model:page="paging.page"
                    v-model:size="paging.pageSize"
                    :total="paging.total"
                    @change="getLists"
                />
            </div>
        </div>

        <ApiEdit
            v-if="editKey"
            :id="selectedKeyId"
            :is-json-import="isJsonImport"
            @close="handleClose"
            @json-submit="jsonSubmitForm"
            @submit="handleSubmit"
        />
    </div>
</template>
