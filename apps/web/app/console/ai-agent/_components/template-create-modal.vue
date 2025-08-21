<script setup lang="ts">
import { ProModal, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { Agent } from "@/models/ai-agent";
import { apiCreateAgentFromTemplate } from "@/services/console/ai-agent";

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    /** 选中的模板 */
    template: Agent;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

const isOpen = ref(true);

// 表单数据
const formData = reactive({
    name: "",
    description: "",
    avatar: "",
});

// 表单校验规则
const schema = object({
    name: string().required(t("console-ai-agent.create.namePlaceholder")),
    description: string().required(t("console-ai-agent.create.descriptionPlaceholder")),
});

// 提交表单
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    try {
        await apiCreateAgentFromTemplate({
            templateId: props.template.id,
            name: formData.name,
            description: formData.description,
            avatar: formData.avatar,
        });

        toast.success(t("console-ai-agent.template.create.success"));
        emits("close", true);
    } catch (error) {
        console.error(t("console-ai-agent.template.create.failed"), error);
        toast.error((error as Error).message);
    }
});

// 关闭弹窗
const handleClose = () => {
    emits("close");
};

// 组件挂载时初始化数据
onMounted(() => {
    if (props.template) {
        formData.avatar = props.template.avatar || "";
        formData.name = props.template.name;
        formData.description = props.template.description || "";
    }
});
</script>

<template>
    <ProModal
        v-model="isOpen"
        :title="t('console-ai-agent.template.create.title', { name: template?.name })"
        :description="t('console-ai-agent.template.create.description')"
        :ui="{ content: 'max-w-lg' }"
        @close="handleClose"
    >
        <!-- 表单内容 -->
        <UForm :schema="schema" :state="formData" class="space-y-4" @submit="submitForm">
            <div class="flex flex-col gap-4">
                <UFormField :label="$t('console-ai-agent.create.avatar')" name="avatar">
                    <ProUploader
                        v-model="formData.avatar"
                        class="h-24 w-24"
                        :text="$t('console-ai-agent.create.avatarUpload')"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg,.gif,.webp"
                        :maxCount="1"
                        :single="true"
                        :multiple="false"
                    />
                    <template #hint> {{ $t("console-ai-agent.create.avatarDefault") }} </template>
                </UFormField>

                <UFormField :label="$t('console-ai-agent.create.name')" name="name" required>
                    <UInput
                        v-model="formData.name"
                        :placeholder="$t('console-ai-agent.create.namePlaceholder')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    :label="$t('console-ai-agent.create.description')"
                    name="description"
                    required
                >
                    <UTextarea
                        v-model="formData.description"
                        :placeholder="$t('console-ai-agent.create.descriptionPlaceholder')"
                        :rows="6"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ $t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" :loading="isLock" type="submit">
                    {{ $t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
