<script setup lang="ts">
import { ProEditor } from "@fastbuildai/ui";
const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const content = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="bg-muted rounded-lg p-3">
        <div class="text-foreground mb-2 flex items-center gap-1 text-sm font-medium">
            开场白
            <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                <UIcon name="i-lucide-circle-help" />
                <template #content>
                    <div class="text-background py-1 text-xs">
                        编辑器工具如果被遮住则使用鼠标按住左右拖地即可查看剩余工具
                    </div>
                </template>
            </UTooltip>
        </div>

        <div class="grid h-auto w-full">
            <ProEditor v-model="content" custom-class="!h-auto min-h-50" />
        </div>
    </div>
</template>
