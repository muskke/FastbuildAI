<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { refreshNuxtData } from "nuxt/app";

import type { Dataset, RetrievalMode, UpdateDatasetParams } from "@/models/ai-datasets";
import { apiUpdateDataset } from "@/services/console/ai-datasets";

import RetrievalMethodConfig from "../_components/create/retrieval-method-config/index.vue";

const { params: URLQueryParams } = useRoute();
const toast = useMessage();
const { t } = useI18n();
const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);

const datasets = inject<Dataset>("datasets");

const formData = reactive<UpdateDatasetParams>({
    name: "",
    description: "",
    retrievalConfig: {
        retrievalMode: "hybrid",
        strategy: "weighted_score",
        topK: 3,
        scoreThreshold: 0.5,
        scoreThresholdEnabled: false,
        weightConfig: {
            semanticWeight: 0.5,
            keywordWeight: 0.5,
        },
        rerankConfig: {
            enabled: false,
            modelId: "",
        },
    },
    embeddingModelId: "",
});

const { lockFn: handleSubmit, isLock } = useLockFn(async () => {
    try {
        await apiUpdateDataset(datasetId.value as string, formData);
        refreshNuxtData(`dataset-detail-${datasetId.value}`);
        toast.success(`${t("console-common.messages.saveSuccess")}`);
    } catch (error) {
        console.error(error);
        toast.error(`${t("console-common.messages.saveFailed")} (error as Error).message`);
    }
});

onMounted(() => {
    (Reflect.ownKeys(formData) as Array<keyof UpdateDatasetParams>).forEach((key) => {
        if (unref(datasets) && Object.prototype.hasOwnProperty.call(unref(datasets), key)) {
            formData[key] = (unref(datasets)?.[key] as never) ?? formData[key];
        }
    });
});
</script>

<template>
    <div class="data-source-selector inline-block p-6">
        <div class="mb-8">
            <h5 class="text-foreground mb-1 text-lg font-medium">
                {{ $t("datasets.settings.name") }}
            </h5>
            <p class="text-muted text-sm">
                {{ $t("datasets.settings.description") }}
            </p>
        </div>

        <div class="space-y-8">
            <div class="flex flex-col space-y-8">
                <UFormField
                    :label="$t('datasets.common.name')"
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex',
                        label: 'text-accent-foreground font-medium width180',
                        container: 'flex-1',
                    }"
                    required
                >
                    <UInput
                        v-model="formData.name"
                        :placeholder="$t('datasets.settings.nameInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex  ',
                        labelWrapper: 'items-stretch ',
                        label: 'text-accent-foreground width180 pt-2',
                        container: 'flex-1',
                    }"
                    :label="$t('datasets.common.description')"
                    required
                >
                    <UTextarea
                        v-model="formData.description"
                        :placeholder="$t('datasets.settings.descriptionInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <UFormField
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width180 pt-2',
                    container: 'flex-1',
                }"
                :label="$t('datasets.create.stepTwo.embeddingModel')"
                required
            >
                <!-- <UInput
                    v-model="formData.embeddingModelId"
                    placeholder="请输入向量模型ID"
                    :ui="{ root: 'w-full' }"
                /> -->
                <ModelSelect
                    :modelValue="formData.embeddingModelId"
                    :button-ui="{
                        variant: 'outline',
                        color: 'neutral',
                        ui: { base: 'w-full' },
                    }"
                    :supportedModelTypes="['text-embedding']"
                    :defaultSelected="false"
                    capability="chat"
                    placeholder="选择嵌入模型"
                    @change="(e) => (formData.embeddingModelId = e.id)"
                />
            </UFormField>

            <USeparator />

            <UFormField
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width180 pt-2',
                    container: 'flex-1',
                }"
                :label="$t('datasets.settings.retrievalMethod')"
                required
            >
                <RetrievalMethodConfig v-model="formData.retrievalConfig" />
            </UFormField>

            <USeparator />

            <UFormField
                label=" "
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width180 pt-2',
                    container: 'flex-1 flex gap-4 items-center',
                }"
            >
                <UButton
                    trailing-icon="i-lucide-arrow-right"
                    :label="$t('console-common.save')"
                    size="lg"
                    :loading="isLock"
                    @click="handleSubmit"
                />
            </UFormField>
        </div>
    </div>
</template>
