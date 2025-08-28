<script setup lang="ts">
import { ProModal } from "@fastbuildai/ui";
import { useI18n } from "vue-i18n";

import type { AiModelInfo } from "@/models";

const { t } = useI18n();

const props = defineProps<{
    models: Set<AiModelInfo>;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
    (e: "submit", models: AiModelInfo[]): void;
}>();

// 关闭弹窗
const handleClose = () => {
    emits("close");
};

// 提交
const handleSubmit = () => {
    emits("submit", models.value);
};

/**
 * 表头
 */
const columns = [
    { accessorKey: "name", header: t("console-ai-provider.model.batchEdit.name") },
    { accessorKey: "model", header: t("console-ai-provider.model.batchEdit.model") },
    { accessorKey: "maxContext", header: t("console-ai-provider.model.batchEdit.maxContext") },
    { accessorKey: "isActive", header: t("console-ai-provider.model.batchEdit.isActive") },
    { accessorKey: "billingRule", header: t("console-ai-provider.model.batchEdit.billingRule") },
];

/**
 * 深拷贝模型列表
 */
const models = computed(() => {
    if (props.models.size === 0) return [];
    return JSON.parse(JSON.stringify([...props.models])) as AiModelInfo[];
});
</script>
<template>
    <ProModal
        :model-value="true"
        :title="t('console-ai-provider.model.batchEditTitle')"
        :ui="{
            content: 'max-w-[70vw] overflow-y-auto h-fit',
        }"
        @update:model-value="(value) => !value && handleClose()"
    >
        <UForm :state="models" @submit="handleSubmit">
            <UTable
                :columns="columns"
                :data="models"
                :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'border-b border-default cursor-pointer',
                    tr: '[&:has(>td[colspan])]:hidden',
                }"
            >
                <!-- 名称 -->
                <template #name-cell="{ row }">
                    <UFormField :name="`rows.${row.index}.name`">
                        <UInput v-model="row.original.name" />
                    </UFormField>
                </template>
                <!-- 模型 -->
                <template #model-cell="{ row }">
                    <UFormField :name="`rows.${row.index}.model`">
                        <UInput v-model="row.original.model" />
                    </UFormField>
                </template>
                <!-- 最大上下文 -->
                <template #maxContext-cell="{ row }">
                    <UFormField :name="`rows.${row.index}.maxContext`">
                        <UInput v-model="row.original.maxContext" type="number" />
                    </UFormField>
                </template>
                <!-- 是否启用 -->
                <template #isActive-cell="{ row }">
                    <UFormField :name="`rows.${row.index}.isActive`">
                        <USwitch v-model="row.original.isActive" />
                    </UFormField>
                </template>
                <!-- 对话消耗 -->
                <template #billingRule-cell="{ row }">
                    <div class="flex w-full items-center gap-2">
                        <UFormField :name="`rows.${row.index}.billingRule.power`">
                            <UInput
                                v-model.number="row.original.billingRule.power"
                                type="number"
                                placeholder=""
                                size="lg"
                                :min="0"
                                class="flex-1"
                                :ui="{ base: 'pr-15' }"
                                @blur="
                                    if (row.original.billingRule.power < 0)
                                        row.original.billingRule.power = 0;
                                "
                            >
                                <template #trailing>
                                    <span class="text-muted-foreground text-sm">
                                        {{ t("console-ai-provider.model.form.power") }}
                                    </span>
                                </template>
                            </UInput>
                        </UFormField>
                        <span>/</span>
                        <UFormField :name="`rows.${row.index}.billingRule.tokens`">
                            <UInput
                                v-model.number="row.original.billingRule.tokens"
                                type="number"
                                placeholder=""
                                size="lg"
                                :min="1"
                                class="flex-1"
                                :ui="{ base: 'pr-15' }"
                                @blur="
                                    if (row.original.billingRule.tokens < 1)
                                        row.original.billingRule.tokens = 1;
                                "
                            >
                                <template #trailing>
                                    <span class="text-muted-foreground text-sm"> Tokens </span>
                                </template>
                            </UInput>
                        </UFormField>
                    </div>
                </template>
            </UTable>
            <div class="flex w-full justify-end gap-2 px-4 py-3.5">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit">
                    {{ t("console-common.save") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
