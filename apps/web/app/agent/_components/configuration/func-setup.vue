<script setup lang="ts">
import type { FormFieldConfig, UpdateAgentConfigParams } from "@/models/agent";

const Context = defineAsyncComponent(() => import("./_func_components/context.vue"));
const Datasets = defineAsyncComponent(() => import("./_func_components/datasets.vue"));
const Feedback = defineAsyncComponent(() => import("./_func_components/feedback.vue"));
const Prompt = defineAsyncComponent(() => import("./_func_components/prompt.vue"));
const Reference = defineAsyncComponent(() => import("./_func_components/reference.vue"));
const Variable = defineAsyncComponent(() => import("./_func_components/variable.vue"));

const props = defineProps<{
    modelValue: UpdateAgentConfigParams;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: UpdateAgentConfigParams): void;
}>();

const state = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="space-y-4">
        <!-- 角色设定提示词区域 -->
        <Prompt v-model="state.rolePrompt as string" />

        <!-- 角色设定变量修改区域 -->
        <Variable v-model="state.formFields as FormFieldConfig[]" />

        <!-- 角色设定知识库修改区域 -->
        <Datasets v-model="state.datasetIds as string[]" />

        <!-- 对话上下文 -->
        <Context v-model="state.showContext as boolean" />

        <!-- 引用来源 -->
        <Reference v-model="state.showReference as boolean" />

        <!-- 反馈按钮 -->
        <Feedback v-model="state.enableFeedback as boolean" />
    </div>
</template>
