<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const context = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="bg-muted flex items-center justify-between rounded-lg p-3">
        <div class="flex flex-col gap-1">
            <span class="text-foreground text-sm font-medium">{{
                $t("console-ai-agent.configuration.context")
            }}</span>
            <span class="text-muted-foreground text-xs">
                {{ $t("console-ai-agent.configuration.contextDesc") }}
            </span>
        </div>
        <USwitch v-model="context" />
    </div>
</template>
