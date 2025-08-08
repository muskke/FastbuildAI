<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui";
import { useRouter } from "vue-router";

import type { CreateAiModelRequest } from "@/models/ai-provider";
import { apiCreateAiModel } from "@/services/console/ai-model";

const AiModelForm = defineAsyncComponent(() => import("./_components/_form.vue"));

const router = useRouter();
const message = useMessage();
const { query: URLQueryParams } = useRoute();

/**
 * 处理表单提交
 */
const handleSubmit = async (formData: CreateAiModelRequest) => {
    try {
        await apiCreateAiModel({
            ...formData,
            providerId: URLQueryParams.providerId as string,
        });
        message.success(t("console-ai-provider.model.messages.createSuccess"));
        setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("Create AI model failed:", error);
        message.error(t("console-ai-provider.model.messages.createFailed"));
    }
};

/**
 * 处理取消操作
 */
const handleCancel = () => {
    router.back();
};

const { t } = useI18n();
</script>

<template>
    <div class="ai-model-add-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">
                {{ $t("console-ai-provider.model.addTitle") }}
            </h1>
        </div>

        <AiModelForm :is-edit="false" @submit-success="handleSubmit" @cancel="handleCancel" />
    </div>
</template>
