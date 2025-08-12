<script setup lang="ts">
import { ProEditor, ProModal, ProUploader, useMessage } from "@fastbuildai/ui";
import { object, string } from "yup";

import type { QuickCommandConfig } from "@/models/ai-agent";

const props = defineProps<{
    modelValue: QuickCommandConfig[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: QuickCommandConfig[]): void;
}>();

const command = useVModel(props, "modelValue", emit);

const { t } = useI18n();
const isOpen = ref<boolean>(false);
const isEdit = ref<boolean>(false);
const editingIndex = ref<number>(-1);

// 表单验证规则
const formSchema = object({
    name: string().required("请输入指令名称"),
    content: string().required("请输入发送指令内容"),
    replyType: string().required("请选择回答方式"),
});

const defaultState: QuickCommandConfig = {
    avatar: "",
    name: "",
    content: "",
    replyType: "model",
    replyContent: "",
};

// 表单数据
const state = ref<QuickCommandConfig>({ ...defaultState });

/** 提交表单 */
const submitForm = async () => {
    try {
        // 检查字段名是否重复（编辑时排除当前字段）
        const existingField = command.value.find(
            (field, index) => field.name === state.value.name && index !== editingIndex.value,
        );
        if (existingField) {
            useMessage().error("字段名已存在，请使用其他名称");
            return;
        }

        if (isEdit.value && editingIndex.value >= 0) {
            // 编辑模式：更新现有字段
            command.value[editingIndex.value] = state.value as QuickCommandConfig;
        } else {
            // 新增模式：添加到变量列表
            command.value.push(state.value as QuickCommandConfig);
        }

        modalClose();
    } catch (error) {
        console.error("操作失败:", error);
        useMessage().error("操作失败");
    }
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
    const field = command.value[index];
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
const modalClose = () => {
    isOpen.value = false;
    isEdit.value = false;
    editingIndex.value = -1;
    resetState();
};

/** 删除变量 */
const removeCommand = (index: number) => {
    command.value.splice(index, 1);
    useMessage().success("变量删除成功");
};
</script>

<template>
    <div>
        <div class="bg-muted rounded-lg p-3">
            <div class="flex items-center justify-between">
                <div class="text-foreground flex items-center gap-1 text-sm font-medium">
                    快捷指令
                    <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                        <UIcon name="i-lucide-circle-help" />

                        <template #content>
                            <div class="text-background text-xs">
                                展示在对话框上方的指令按钮，用户可快速发起预设对话或指令
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
                    <span>添加</span>
                </UButton>
            </div>

            <div class="space-y-3">
                <div
                    v-for="(item, index) in command"
                    :key="item.name"
                    class="group bg-background mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
                >
                    <div class="flex flex-1 items-center gap-2">
                        <div
                            v-if="item.avatar"
                            class="bg-primary-50 border-default flex rounded-lg border border-dashed"
                        >
                            <img
                                :src="item?.avatar"
                                alt="avatar"
                                class="size-8 rounded-lg object-contain"
                            />
                        </div>
                        <span class="text-muted-foreground font-mono text-xs">{{ item.name }}</span>
                    </div>

                    <div class="block group-hover:hidden">
                        <UBadge v-if="item.replyType" color="neutral" variant="outline" size="sm">
                            {{ item.replyType === "custom" ? "自定义" : "模型" }}
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
                            @click="removeCommand(index)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加变量弹窗 -->
        <ProModal
            v-model="isOpen"
            :title="isEdit ? '编辑快捷指令' : '添加快捷指令'"
            description="展示在对话框上方的指令按钮，用户可快速发起预设对话或指令"
            :ui="{ content: 'max-w-md' }"
            @close="modalClose"
        >
            <UForm :state="state" :schema="formSchema" class="space-y-4" @submit="submitForm">
                <UFormField label="指令图标" name="avatar">
                    <ProUploader
                        v-model="state.avatar"
                        class="h-16 w-16"
                        text="上传图标"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg,.gif,.webp"
                        :maxCount="1"
                        :single="true"
                        :multiple="false"
                    />
                </UFormField>

                <UFormField label="指令名称" name="name" required>
                    <UInput v-model="state.name" placeholder="请输入" :ui="{ root: 'w-full' }" />
                </UFormField>

                <UFormField label="发送指令内容" name="content" required>
                    <UTextarea
                        v-model="state.content"
                        placeholder="请输入"
                        :ui="{ root: 'w-full' }"
                        :rows="3"
                    />
                </UFormField>

                <UFormField label="回答方式" name="type" required>
                    <div class="flex items-center gap-2">
                        <UCheckbox
                            :model-value="state.replyType === 'custom'"
                            indicator="end"
                            variant="card"
                            default-value
                            label="自定义回答"
                            @update:model-value="state.replyType = 'custom'"
                        />
                        <UCheckbox
                            :model-value="state.replyType === 'model'"
                            indicator="end"
                            variant="card"
                            default-value
                            label="模型回答"
                            @update:model-value="state.replyType = 'model'"
                        />
                    </div>
                </UFormField>

                <UFormField
                    v-if="state.replyType === 'custom'"
                    label="回答内容"
                    name="replyContent"
                    required
                >
                    <ProEditor v-model="state.replyContent" custom-class="!h-auto min-h-50" />
                </UFormField>

                <div class="mt-6 flex justify-end gap-2">
                    <UButton color="neutral" variant="soft" size="lg" @click="modalClose">
                        取消
                    </UButton>
                    <UButton color="primary" size="lg" type="submit"> 保存 </UButton>
                </div>
            </UForm>
        </ProModal>
    </div>
</template>
