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
        :rows="5"
        placeholder="在这里写你的角色提示词 输入{{xxx}}使用变量。"
    >
        <template #panel-top>
            <div class="bg-muted flex w-full items-center justify-between rounded-lg p-2">
                <div class="text-foreground flex items-center gap-1 text-sm font-medium">
                    角色设定
                    <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                        <UIcon name="i-lucide-circle-help" />

                        <template #content>
                            <div class="text-background text-xs">
                                定义智能体的身份、性格、专业领域和行为准则
                                <div>
                                    支持表单变量替换
                                    <br />
                                    <span
                                        v-text="'例如：{{userName}}、{{userType}}、{{company}}'"
                                    ></span>
                                    <br />
                                    示例：
                                    <br />
                                    <span
                                        v-text="
                                            '你是一位{{domain}}领域的专家，拥有丰富的经验和专业知识，请为用户提供准确、详细的解答。'
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
