<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";

import type { Agent, FormFieldConfig, UpdateAgentConfigParams } from "@/models/ai-agent";
import { apiUpdateAgentConfig } from "@/services/console/ai-agent";

const FuncSetup = defineAsyncComponent(() => import("./func-setup.vue"));
const UserSetup = defineAsyncComponent(() => import("./user-setup.vue"));
const BillingSetup = defineAsyncComponent(() => import("./billing-setup.vue"));
const PreviewChat = defineAsyncComponent(() => import("../preview-chat.vue"));
const VariableInput = defineAsyncComponent(() => import("./variable-input.vue"));
const ModelConfig = defineAsyncComponent(() => import("./model-config.vue"));

const route = useRoute();
const { t } = useI18n();
const agentId = (route.params as Record<string, string>).id;
const agents = inject<Agent>("agents");
const active = ref("0");
const components: { value: string; label: string; component: any }[] = [
    {
        value: "0",
        label: t("console-ai-agent.configuration.func"),
        component: FuncSetup,
    },
    {
        value: "1",
        label: t("console-ai-agent.configuration.user"),
        component: UserSetup,
    },
    {
        value: "2",
        label: t("console-ai-agent.configuration.billingSetup"),
        component: BillingSetup,
    },
];
const previewChatRef = useTemplateRef<InstanceType<typeof PreviewChat>>("previewChatRef");

const showVariableInput = ref(false);
const state = reactive<UpdateAgentConfigParams>({
    name: "",
    description: "",
    avatar: "",
    chatAvatar: "",
    rolePrompt: "",
    showContext: true,
    showReference: true,
    enableFeedback: true,
    enableWebSearch: false,
    billingConfig: {
        price: 0,
    },
    modelConfig: {
        id: "",
        options: {},
    },
    datasetIds: [],
    openingStatement: "你好，我是智能体默认开场白，你可以在界面配置中修改我",
    openingQuestions: [
        "我打算去北京旅游，有什么推荐的路线吗？",
        "预算大约2万，能帮我规划一下行程吗？",
        "我对历史文化很感兴趣，有合适的目的地推荐吗？",
    ],
    isPublic: false,
    quickCommands: [],
    autoQuestions: {
        enabled: false,
        customRuleEnabled: false,
        customRule: "",
    },
    formFields: [],
    formFieldsInputs: {},
});

function handleVariableModalOpen() {
    if (state.formFields!.length === 0) {
        useMessage().error(t("console-ai-agent.configuration.variableInputDesc"));
        return;
    }
    showVariableInput.value = true;
}

const { lockFn: handleUpdate, isLock } = useLockFn(async () => {
    await apiUpdateAgentConfig(agentId as string, state);
    useMessage().success(t("common.message.updateSuccess"));
    refreshNuxtData(`agent-detail-${agentId as string}`);
});

onMounted(() => {
    (Reflect.ownKeys(state) as Array<keyof UpdateAgentConfigParams>).forEach((key) => {
        if (unref(agents) && Object.prototype.hasOwnProperty.call(unref(agents), key)) {
            state[key] = (unref(agents)?.[key] as never) ?? state[key];
        }
    });
});
</script>

<template>
    <div class="flex h-full min-h-0 flex-1 flex-col p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-foreground text-lg font-medium">
                {{ $t("console-ai-agent.menu.arrange") }}
            </h1>
        </div>
        <div class="flex h-full min-h-0 flex-1 gap-4 pt-4 pr-4">
            <div class="flex h-full min-h-0 w-1/2 flex-none flex-col">
                <div class="mb-4 flex">
                    <UTabs v-model="active" :items="components" class="block w-auto" />
                </div>
                <component :is="components[Number(active)]?.component" v-model="state" />
            </div>
            <div class="flex h-full min-h-0 w-1/2 flex-none flex-col">
                <!-- 模型参数配置 -->
                <div class="mb-4 flex justify-end gap-3 p-0.5">
                    <ModelConfig v-model="state.modelConfig!" />

                    <AccessControl :codes="['ai-agent:update']">
                        <UButton
                            trailingIcon="i-lucide-arrow-big-up"
                            color="primary"
                            size="lg"
                            class="flex-none gap-1 px-4"
                            :loading="isLock"
                            @click="handleUpdate"
                        >
                            {{ $t("console-ai-agent.configuration.saveConfig") }}
                        </UButton>
                    </AccessControl>
                </div>

                <div
                    class="bg-muted border-default flex h-full min-h-0 w-full flex-col rounded-lg border"
                >
                    <div class="flex items-center justify-between p-4">
                        <h1 class="text-foreground text-lg font-medium">
                            {{ $t("console-ai-agent.configuration.debugPreview") }}
                        </h1>
                        <div>
                            <!-- 清除记录 -->
                            <UButton
                                icon="i-lucide-refresh-cw"
                                color="primary"
                                variant="ghost"
                                size="lg"
                                @click="previewChatRef?.clearRecord()"
                            />
                            <UButton
                                icon="i-lucide-settings-2"
                                color="primary"
                                variant="ghost"
                                size="lg"
                                @click="handleVariableModalOpen"
                            />
                        </div>
                    </div>
                    <PreviewChat :agent="state as UpdateAgentConfigParams" ref="previewChatRef" />
                </div>
            </div>
        </div>

        <VariableInput
            v-model="showVariableInput"
            v-model:inputs="state.formFieldsInputs as Record<string, any>"
            :formFields="state.formFields as FormFieldConfig[]"
        />
    </div>
</template>
