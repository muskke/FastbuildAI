<script setup lang="ts">
import { ProModal, ProScrollArea } from "@fastbuildai/ui";

interface ChatContextItem {
    role: "system" | "user" | "assistant";
    content: string;
}

interface Props {
    modelValue: boolean;
    context?: ChatContextItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const context = computed(() => props.context || []);
</script>

<template>
    <ProModal
        v-model="isOpen"
        title="对话上下文"
        description="显示当前对话的完整上下文信息"
        :ui="{ content: 'max-w-xl overflow-y-auto' }"
    >
        <ProScrollArea class="h-[60vh]">
            <div class="space-y-4">
                <div
                    v-for="(item, index) in context"
                    :key="index"
                    class="border-default border-b pb-4 last:border-b-0"
                >
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0">
                            <div
                                class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
                                :class="{
                                    'bg-blue-100 text-blue-800': item.role === 'system',
                                    'bg-green-100 text-green-800': item.role === 'user',
                                    'bg-purple-100 text-purple-800': item.role === 'assistant',
                                }"
                            >
                                {{
                                    item.role === "system" ? "S" : item.role === "user" ? "U" : "A"
                                }}
                            </div>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="text-foreground text-sm font-medium">
                                    {{
                                        item.role === "system"
                                            ? "系统"
                                            : item.role === "user"
                                              ? "用户"
                                              : "助手"
                                    }}
                                </span>
                                <span class="text-muted-foreground text-xs">
                                    {{ index + 1 }}
                                </span>
                            </div>
                            <div
                                class="text-accent-foreground text-sm break-words whitespace-pre-wrap"
                            >
                                {{ item.content }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProScrollArea>
    </ProModal>
</template>
