<script setup lang="ts">
import { ProModal, ProSlider, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { array, object, string } from "yup";

import type { AiProviderInfo, CreateAiProviderRequest, ModelType } from "@/models/ai-provider";
import {
    apiCreateAiProvider,
    apiGetAiProviderDetail,
    apiGetAiProviderModelTypes,
    apiUpdateAiProvider,
} from "@/services/console/ai-provider";

const toast = useMessage();
const route = useRoute();

const props = defineProps<{
    id?: string | null;
}>();
const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

// 获取ID从query参数或props
const providerId = computed(() => props.id || (route.query.id as string) || null);

// 获取国际化函数
const { t } = useI18n();

const modelTypes = ref<string[]>([]);
const allModelTypes = ref<ModelType[]>([]);

const detail = ref<AiProviderInfo | null>(null);

const formData = reactive<CreateAiProviderRequest>({
    provider: "",
    name: "",
    apiKey: "",
    baseUrl: "",
    websiteUrl: "",
    iconUrl: "",
    description: "",
    isActive: true,
    sortOrder: 0,
    supportedModelTypes: [],
});

// 表单验证规则
const providerSchema = object({
    provider: string().required(t("console-ai-provider.form.providerRequired")),
    name: string().required(t("console-ai-provider.form.nameRequired")),
    apiKey: string().required(t("console-ai-provider.form.apiKeyRequired")),
    supportedModelTypes: array().min(1, t("console-ai-provider.form.supportedModelTypesRequired")),
});

//获取所有模型类型
const { data: modelTypesData } = await useAsyncData("model-types", () =>
    apiGetAiProviderModelTypes(),
);
allModelTypes.value = modelTypesData.value || [];

// 获取供应商详情
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        const data: AiProviderInfo = await apiGetAiProviderDetail(providerId.value as string);
        detail.value = data;

        modelTypes.value = data.supportedModelTypes;
        Object.keys(formData).forEach((key) => {
            const typedKey = key as keyof typeof formData;
            const value = data[typedKey as keyof AiProviderInfo];
            if (value !== undefined) {
                // 检查值是否为对象且非空，或者是其他类型的值
                if (typeof value === "object" && value !== null) {
                    if (Object.keys(value).length > 0) {
                        formData[typedKey as keyof typeof formData] = value as never;
                    }
                } else {
                    // 处理原始类型（string, number, boolean等）
                    formData[typedKey as keyof typeof formData] = value as never;
                }
            }
        });
    } catch (error) {
        console.error("获取供应商详情失败:", error);
        toast.error(t("console-ai-provider.messages.fetchFailed"));
    }
});

// 提交表单
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    try {
        if (providerId.value) {
            await apiUpdateAiProvider(providerId.value, formData);
            toast.success(t("console-ai-provider.messages.updateSuccess"));
        } else {
            await apiCreateAiProvider(formData);
            toast.success(t("console-ai-provider.messages.createSuccess"));
        }
        emits("close", true);
    } catch (error) {
        console.error("提交失败:", error);
        toast.error(
            providerId.value
                ? t("console-ai-provider.messages.updateFailed")
                : t("console-ai-provider.messages.createFailed"),
        );
    }
});

const handleClose = () => {
    emits("close");
};

onMounted(async () => providerId.value && (await fetchDetail()));
</script>

<template>
    <ProModal
        :model-value="true"
        :title="providerId ? t('console-ai-provider.editTitle') : t('console-ai-provider.addTitle')"
        :description="
            providerId
                ? t('console-ai-provider.form.editDescription')
                : t('console-ai-provider.form.addDescription')
        "
        :ui="{
            content: 'max-w-2xl overflow-y-auto h-[60vh]',
        }"
        @update:model-value="(value) => !value && handleClose()"
    >
        <div v-if="detailLoading" class="flex items-center justify-center" style="height: 400px">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>

        <UForm v-else :state="formData" :schema="providerSchema" @submit="submitForm">
            <!-- 基本信息 -->
            <div class="pb-2">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                        :label="t('console-ai-provider.form.provider')"
                        name="provider"
                        required
                    >
                        <UInput
                            :disabled="detail?.isBuiltIn"
                            v-model="formData.provider"
                            :placeholder="t('console-ai-provider.form.providerPlaceholder')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>

                    <UFormField :label="t('console-ai-provider.form.name')" name="name" required>
                        <UInput
                            v-model="formData.name"
                            :placeholder="t('console-ai-provider.form.namePlaceholder')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>

                    <UFormField
                        :label="t('console-ai-provider.form.proxyUrl')"
                        name="baseUrl"
                        :description="t('console-ai-provider.form.proxyUrlDescription')"
                    >
                        <UInput
                            v-model="formData.baseUrl"
                            :placeholder="t('console-ai-provider.form.baseUrlPlaceholder')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>

                    <UFormField :label="t('console-ai-provider.form.sortOrder')" name="sortOrder">
                        <UInput
                            v-model="formData.sortOrder"
                            type="number"
                            :placeholder="t('console-ai-provider.form.sortOrderPlaceholder')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>

                    <UFormField :label="t('console-ai-provider.form.iconUrl')" name="iconUrl">
                        <ProUploader
                            v-model="formData.iconUrl"
                            class="h-24 w-24"
                            text="上传图标"
                            icon="i-lucide-upload"
                            accept=".jpg,.png,.svg,.ico"
                            :maxCount="1"
                            :single="true"
                            :multiple="false"
                        />
                    </UFormField>

                    <div class="space-y-4">
                        <UFormField
                            :label="t('console-ai-provider.form.websiteUrl')"
                            name="websiteUrl"
                        >
                            <UInput
                                v-model="formData.websiteUrl"
                                :placeholder="t('console-ai-provider.form.websiteUrlPlaceholder')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>

                        <UFormField :label="t('console-ai-provider.form.isActive')" name="isActive">
                            <USwitch
                                v-model="formData.isActive"
                                unchecked-icon="i-lucide-x"
                                checked-icon="i-lucide-check"
                                size="lg"
                                :label="
                                    formData.isActive
                                        ? t('console-ai-provider.form.isActiveEnabled')
                                        : t('console-ai-provider.form.isActiveDisabled')
                                "
                            />
                        </UFormField>
                    </div>
                </div>
            </div>

            <!-- API配置 -->
            <div class="pb-2">
                <UFormField :label="t('console-ai-provider.form.apiKey')" name="apiKey" required>
                    <UInput
                        v-model="formData.apiKey"
                        type="password"
                        :placeholder="t('console-ai-provider.form.apiKeyPlaceholder')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 模型类型 -->
            <div class="pb-2">
                <UFormField
                    :label="t('console-ai-provider.form.modelType')"
                    name="supportedModelTypes"
                    required
                >
                    <UInputMenu
                        :disabled="detail?.isBuiltIn"
                        v-model="formData.supportedModelTypes"
                        multiple
                        value-key="value"
                        :items="allModelTypes"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 描述 -->
            <div class="pb-2">
                <UFormField :label="t('console-ai-provider.form.description')" name="description">
                    <UTextarea
                        v-model="formData.description"
                        :placeholder="t('console-ai-provider.form.descriptionPlaceholder')"
                        :rows="3"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 操作按钮 -->
            <div class="bottom-0 z-10 flex justify-end gap-2 py-4">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit" :loading="isLock">
                    {{ providerId ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
