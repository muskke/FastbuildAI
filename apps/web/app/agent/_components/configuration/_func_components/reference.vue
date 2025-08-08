<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const reference = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="bg-muted flex items-center justify-between rounded-lg p-3">
        <div class="flex flex-col gap-1">
            <span class="text-foreground text-sm font-medium">引用来源</span>
            <span class="text-muted-foreground text-xs">
                当回答引用了文档后，可查看回答对应的文档来源
            </span>
        </div>
        <USwitch v-model="reference" />
    </div>
</template>
