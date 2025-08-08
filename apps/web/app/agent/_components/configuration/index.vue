<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";

import type { Agent, FormFieldConfig, UpdateAgentConfigParams } from "@/models/agent";
import { apiUpdateAgentConfig } from "@/services/web/agent";

const FuncSetup = defineAsyncComponent(() => import("./func-setup.vue"));
const UserSetup = defineAsyncComponent(() => import("./user-setup.vue"));
const PreviewChat = defineAsyncComponent(() => import("../preview-chat.vue"));
const VariableInput = defineAsyncComponent(() => import("./variable-input.vue"));
const ModelConfig = defineAsyncComponent(() => import("./model-config.vue"));

const route = useRoute();
const agentId = (route.params as Record<string, string>).id;
const agents = inject<Agent>("agents");
const active = ref("0");
const components: { value: string; label: string; component: any }[] = [
    {
        value: "0",
        label: "功能配置",
        component: FuncSetup,
    },
    {
        value: "1",
        label: "界面配置",
        component: UserSetup,
    },
];

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
        useMessage().error("请先配置表单字段");
        return;
    }
    showVariableInput.value = true;
}

const { lockFn: handleUpdate, isLock } = useLockFn(async () => {
    await apiUpdateAgentConfig(agentId as string, state);
    useMessage().success("更新成功");
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
    <div class="flex h-full flex-1 flex-col p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-foreground text-lg font-medium">编排</h1>
        </div>
        <div class="flex h-full flex-1 gap-4 pt-4 pr-4">
            <div class="flex w-1/2 flex-none flex-col">
                <div class="mb-4 flex">
                    <UTabs v-model="active" :items="components" class="block w-auto" />
                </div>
                <component :is="components[Number(active)]?.component" v-model="state" />
            </div>
            <div class="flex h-full w-1/2 flex-none flex-col">
                <!-- 模型参数配置 -->

                <div class="mb-4 flex justify-end gap-3 p-0.5">
                    <ModelConfig v-model="state.modelConfig!" />

                    <UButton
                        trailingIcon="i-lucide-arrow-big-up"
                        color="primary"
                        size="lg"
                        class="flex-none gap-1 px-4"
                        :loading="isLock"
                        @click="handleUpdate"
                    >
                        更新
                    </UButton>
                </div>

                <div class="bg-muted border-default flex h-full w-full flex-col rounded-lg border">
                    <div class="flex items-center justify-between p-4">
                        <h1 class="text-foreground text-lg font-medium">调试与预览</h1>
                        <UButton
                            icon="i-lucide-settings-2"
                            color="primary"
                            variant="ghost"
                            size="lg"
                            @click="handleVariableModalOpen"
                        />
                    </div>
                    <PreviewChat :agent="state as UpdateAgentConfigParams" />
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
