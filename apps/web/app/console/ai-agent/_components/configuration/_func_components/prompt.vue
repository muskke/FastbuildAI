<script setup lang="ts">
const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const prompt = useVModel(props, "modelValue", emit);
</script>

<template>
    <ChatPrompt
        v-model="prompt"
        :rows="3"
        :placeholder="
            $t('console-ai-agent.configuration.rolePromptPlaceholder', { label: '{{label}}' })
        "
    >
        <template #panel-top>
            <div class="bg-muted flex w-full items-center justify-between rounded-lg p-2">
                <div class="text-foreground flex items-center gap-1 text-sm font-medium">
                    {{ $t("console-ai-agent.configuration.rolePrompt") }}
                    <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                        <UIcon name="i-lucide-circle-help" />

                        <template #content>
                            <div class="text-background text-xs">
                                {{ $t("console-ai-agent.configuration.rolePromptDesc") }}
                                <div>
                                    {{ $t("console-ai-agent.configuration.rolePromptSupport") }}
                                    <br />
                                    <span
                                        v-text="
                                            $t(
                                                'console-ai-agent.configuration.rolePromptExampleTitle',
                                                {
                                                    label: '{{userName}}、{{userType}}、{{company}}',
                                                },
                                            )
                                        "
                                    ></span>
                                    <br />
                                    {{
                                        $t("console-ai-agent.configuration.rolePromptExampleTitle2")
                                    }}
                                    <br />
                                    <span
                                        v-text="
                                            $t('console-ai-agent.configuration.rolePromptExample', {
                                                label: '{{domain}}',
                                            })
                                        "
                                    ></span>
                                </div>
                            </div>
                        </template>
                    </UTooltip>
                </div>
            </div>
        </template>
        <template #panel-left>
            <div class="text-muted-foreground bg-muted rounded-lg px-2 py-1 text-xs">
                {{ prompt?.length }}
            </div>
        </template>
        <template #panel-right>
            <div></div>
        </template>
    </ChatPrompt>
</template>
