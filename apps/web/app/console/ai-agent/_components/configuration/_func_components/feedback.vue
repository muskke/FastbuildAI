<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const feedback = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="bg-muted flex items-center justify-between rounded-lg p-3">
        <div class="flex flex-col gap-1">
            <span class="text-foreground text-sm font-medium">反馈按钮</span>
            <span class="text-muted-foreground text-xs"> 在前台显示反馈按钮，允许用户反馈 </span>
        </div>
        <USwitch v-model="feedback" />
    </div>
</template>
