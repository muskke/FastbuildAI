<script setup lang="ts">
import { ProModal, useLockFn, useMessage } from "@fastbuildai/ui";
import Draggable from "vuedraggable";
import { boolean, number, object, string } from "yup";

import type { FormFieldConfig } from "@/models/ai-agent";

const props = defineProps<{
    modelValue: FormFieldConfig[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: FormFieldConfig[]): void;
}>();

const variable = useVModel(props, "modelValue", emit);

const { t } = useI18n();
const isOpen = ref<boolean>(false);
const isEdit = ref<boolean>(false);
const editingIndex = ref<number>(-1);

// 表单验证规则
const formSchema = object({
    name: string().required(t("console-ai-agent.configuration.formVariableNameEmpty")),
    label: string().required(t("console-ai-agent.configuration.formVariableLabelEmpty")),
    type: string()
        .required(t("console-ai-agent.configuration.formVariableTypeEmpty"))
        .oneOf(["text", "textarea", "select"]),
    required: boolean().optional(),
});

const defaultState: FormFieldConfig = {
    name: "",
    label: "",
    type: "text",
    required: false,
    options: [],
};

// 表单数据
const state = ref<FormFieldConfig>({ ...defaultState });

// 选项相关
const showOptions = computed(() => state.value.type === "select");

/** 提交表单 */
const submitForm = async () => {
    try {
        // 检查字段名是否重复（编辑时排除当前字段）
        const existingField = variable.value.find(
            (field, index) => field.name === state.value.name && index !== editingIndex.value,
        );
        if (existingField) {
            useMessage().error(t("console-ai-agent.configuration.formVariableNameExists"));
            return;
        }

        if (isEdit.value && editingIndex.value >= 0) {
            // 编辑模式：更新现有字段
            variable.value[editingIndex.value] = state.value as FormFieldConfig;
        } else {
            // 新增模式：添加到变量列表
            variable.value.push(state.value as FormFieldConfig);
        }

        handleClose();
    } catch (error) {
        console.error("操作失败:", error);
    }
};

/** 添加选项 */
const addOption = () => {
    if (!state.value.options) {
        state.value.options = [];
    }
    state.value.options.push("");
};

/** 删除选项 */
const removeOption = (index: number) => {
    state.value.options?.splice(index, 1);
};

/** 打开新增弹窗 */
const openModal = () => {
    isEdit.value = false;
    editingIndex.value = -1;
    isOpen.value = true;
};

/** 打开编辑弹窗 */
const openEditModal = (index: number) => {
    isEdit.value = true;
    editingIndex.value = index;
    const field = variable.value[index];
    if (field) {
        state.value = JSON.parse(JSON.stringify(field));
        isOpen.value = true;
    }
};

/** 重置表单数据 */
const resetState = () => {
    state.value = defaultState;
};

/** 关闭弹窗 */
const handleClose = () => {
    isOpen.value = false;
    isEdit.value = false;
    resetState();
    editingIndex.value = -1;
};

/** 删除变量 */
const removeVariable = (index: number) => {
    variable.value.splice(index, 1);
};
</script>

<template>
    <div>
        <div class="bg-muted rounded-lg p-3">
            <div class="flex items-center justify-between">
                <div class="text-foreground flex items-center gap-1 text-sm font-medium">
                    {{ $t("console-ai-agent.configuration.formVariable") }}
                    <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                        <UIcon name="i-lucide-circle-help" />

                        <template #content>
                            <div class="text-background text-xs">
                                {{ $t("console-ai-agent.configuration.formVariableDesc") }}
                                <br />
                                {{ $t("console-ai-agent.configuration.formVariableDesc2") }}
                            </div>
                        </template>
                    </UTooltip>
                </div>

                <UButton
                    size="sm"
                    color="primary"
                    variant="ghost"
                    class="flex items-center"
                    @click="openModal"
                >
                    <UIcon name="i-lucide-plus" />
                    <span>{{ $t("console-common.add") }}</span>
                </UButton>
            </div>

            <div class="space-y-3">
                <div
                    v-for="(item, index) in variable"
                    :key="item.name"
                    class="group bg-background mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
                >
                    <div class="flex flex-1 items-center gap-2">
                        <span class="text-foreground text-sm font-medium">{{ item.label }}</span>
                        <span class="text-muted-foreground font-mono text-xs">{{ item.name }}</span>
                    </div>

                    <div class="block group-hover:hidden">
                        <UBadge v-if="item.required" color="error" variant="outline" size="sm">
                            {{ $t("console-ai-agent.configuration.required") }}
                        </UBadge>
                        <UBadge color="neutral" variant="outline" size="sm" class="ml-1">
                            {{ item.type }}
                        </UBadge>
                    </div>
                    <div class="hidden items-center group-hover:flex">
                        <UButton
                            size="xs"
                            color="primary"
                            variant="ghost"
                            icon="i-lucide-edit"
                            @click="openEditModal(index)"
                        />
                        <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-lucide-trash"
                            @click="removeVariable(index)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加变量弹窗 -->
        <ProModal
            v-model="isOpen"
            :title="
                isEdit
                    ? $t('console-ai-agent.configuration.formVariableEditTitle')
                    : $t('console-ai-agent.configuration.formVariableAddTitle')
            "
            :description="t('console-ai-agent.configuration.formVariableTitleDesc')"
            :ui="{ content: 'max-w-md' }"
            @close="handleClose"
        >
            <UForm :state="state" :schema="formSchema" class="space-y-4" @submit="submitForm">
                <UFormField
                    :label="t('console-ai-agent.configuration.formVariableType')"
                    name="type"
                    required
                >
                    <div class="flex items-center gap-2">
                        <UCheckbox
                            :model-value="state.type === 'text'"
                            indicator="end"
                            variant="card"
                            default-value
                            :label="t('console-ai-agent.configuration.formVariableTypeText')"
                            @update:model-value="state.type = 'text'"
                        />
                        <UCheckbox
                            :model-value="state.type === 'textarea'"
                            indicator="end"
                            variant="card"
                            default-value
                            :label="t('console-ai-agent.configuration.formVariableTypeTextarea')"
                            @update:model-value="state.type = 'textarea'"
                        />
                        <UCheckbox
                            :model-value="state.type === 'select'"
                            indicator="end"
                            variant="card"
                            default-value
                            :label="t('console-ai-agent.configuration.formVariableTypeSelect')"
                            @update:model-value="state.type = 'select'"
                        />
                    </div>
                </UFormField>

                <UFormField
                    :label="t('console-ai-agent.configuration.formVariableName')"
                    name="name"
                    required
                >
                    <UInput
                        v-model="state.name"
                        :placeholder="
                            t('console-ai-agent.configuration.formVariableNamePlaceholder')
                        "
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    :label="t('console-ai-agent.configuration.formVariableLabel')"
                    name="label"
                    required
                >
                    <UInput
                        v-model="state.label"
                        :placeholder="
                            t('console-ai-agent.configuration.formVariableLabelPlaceholder')
                        "
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <!-- 选项配置（仅当类型为select时显示） -->
                <div v-if="showOptions" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">{{
                            $t("console-ai-agent.configuration.formVariableOptions")
                        }}</label>
                        <UButton size="xs" color="primary" variant="ghost" @click="addOption">
                            <UIcon name="i-lucide-plus" />
                            {{ $t("console-ai-agent.configuration.formVariableOptionsAdd") }}
                        </UButton>
                    </div>

                    <div class="space-y-2" v-if="state.options?.length">
                        <Draggable
                            class="draggable cursor-move"
                            v-model="state.options"
                            animation="300"
                            handle=".drag-move"
                            itemKey="id"
                        >
                            <template v-slot:item="{ element: item, index }">
                                <div class="mt-2 flex items-center gap-2">
                                    <UInput
                                        icon="i-lucide-grip-vertical"
                                        v-model="state.options[index]"
                                        :placeholder="
                                            t(
                                                'console-ai-agent.configuration.formVariableOptionsLabel',
                                            )
                                        "
                                        :ui="{ root: 'flex-1', leadingIcon: 'drag-move' }"
                                    />
                                    <UButton
                                        size="xs"
                                        color="error"
                                        variant="ghost"
                                        icon="i-lucide-trash"
                                        @click="removeOption(index)"
                                    />
                                </div>
                            </template>
                        </Draggable>
                    </div>
                </div>

                <UFormField label=" " name="required">
                    <UCheckbox
                        v-model="state.required"
                        :label="t('console-ai-agent.configuration.required')"
                    />
                </UFormField>

                <div class="mt-6 flex justify-end gap-2">
                    <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                        {{ $t("console-common.cancel") }}
                    </UButton>
                    <UButton color="primary" size="lg" type="submit">
                        {{ $t("console-common.save") }}
                    </UButton>
                </div>
            </UForm>
        </ProModal>
    </div>
</template>
