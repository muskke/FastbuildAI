<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { UpdateAgentConfigParams } from "@/models/ai-agent";

const props = defineProps<{
    modelValue: UpdateAgentConfigParams;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: UpdateAgentConfigParams): void;
}>();

const state = useVModel(props, "modelValue", emit);
const { t } = useI18n();
</script>
<template>
    <div>
        <div class="flex w-full flex-col gap-2">
            <div>
                <span>{{ t("console-ai-agent.configuration.dialogueConsumption") }}</span>
            </div>
            <UInput
                type="number"
                v-model="state.billingConfig!.price"
                min="0"
                :ui="{ base: 'pr-24' }"
                @blur="if (state.billingConfig!.price < 0) state.billingConfig!.price = 0;"
            >
                <template #trailing>
                    <div class="text-muted-foreground flex items-center justify-center gap-1">
                        <span>{{ t("console-ai-provider.model.form.power") }}</span>
                        <span>/</span>
                        <span>{{ t("console-ai-agent.dashboard.times") }}</span>
                    </div>
                </template>
            </UInput>
        </div>
    </div>
</template>
