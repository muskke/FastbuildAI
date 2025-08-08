<script lang="ts" setup>
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { UpdateAiModelRequest } from "@/models/ai-provider";
import { apiGetAiModelDetail, apiUpdateAiModel } from "@/services/console/ai-model";

const AiModelForm = defineAsyncComponent(() => import("./_components/_form.vue"));

const router = useRouter();
const message = useMessage();
const { query: URLQueryParams } = useRoute();
// 获取ID参数
const modelId = computed(() => URLQueryParams.id as string);

// 初始数据
const initialData = ref({});

/**
 * 获取AI模型详情
 */
const { lockFn: getModelDetail, isLock } = useLockFn(async () => {
    if (!modelId.value) {
        message.error(t("console-ai-provider.model.messages.missingModelId"));
        router.back();
        return;
    }

    try {
        const response = await apiGetAiModelDetail(modelId.value);
        // 转换数据格式以适配表单
        initialData.value = {
            ...response,
        };
    } catch (error) {
        console.error("Get AI model detail failed:", error);
        message.error(t("console-ai-provider.model.messages.getModelDetailFailed"));
        router.back();
    }
});

/**
 * 处理表单提交
 */
const handleSubmit = async (formData: UpdateAiModelRequest) => {
    try {
        await apiUpdateAiModel(modelId.value, {
            ...formData,
        });
        message.success(t("console-ai-provider.model.messages.updateSuccess"));
        setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("Update AI model failed:", error);
        message.error(t("console-ai-provider.model.messages.updateFailed"));
    }
};

/**
 * 处理取消操作
 */
const handleCancel = () => {
    router.back();
};

const { t } = useI18n();

// 初始化
onMounted(() => getModelDetail());
</script>

<template>
    <div class="ai-model-edit-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">
                {{ $t("console-ai-provider.model.editTitle") }}
            </h1>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLock" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-primary-500 h-8 w-8 animate-spin" />
        </div>

        <!-- 表单 -->
        <AiModelForm
            v-else
            :is-edit="true"
            :id="modelId"
            :initial-data="initialData"
            @submit-success="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>
