<script setup lang="ts">
import type { AutoQuestionsConfig } from "@/models/ai-agent";

const props = defineProps<{
    modelValue: AutoQuestionsConfig;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: AutoQuestionsConfig): void;
}>();

const suggest = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="bg-muted rounded-lg p-3">
        <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
                <span class="text-foreground text-sm font-medium">自动追问</span>
                <span class="text-muted-foreground text-xs">
                    在智能体回复后，自动根据对话内容提供给用户3条问题建议
                </span>
            </div>

            <USwitch v-model="suggest.enabled" />
        </div>

        <div class="mt-4 space-y-2" v-if="suggest.enabled">
            <UCheckbox v-model="suggest.customRuleEnabled" label="添加自定义规则" />
            <UTextarea
                v-if="suggest.customRuleEnabled"
                v-model="suggest.customRule"
                :rows="3"
                :ui="{ root: 'w-full' }"
            />
        </div>
    </div>
</template>
