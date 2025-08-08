<script lang="ts" setup>
import { useLockFn } from "@fastbuildai/ui";
import { useMessage } from "@fastbuildai/ui";
import { defineAsyncComponent, ref } from "vue";

import type { CreateDatasetParams, Dataset } from "@/models/datasets";
import {
    apiCreateDataset,
    apiCreateDocument,
    apiCreateEmptyDataset,
} from "@/services/web/datasets";

import { useStep } from "./useStep";

const TopBar = defineAsyncComponent(() => import("./top-bar/index.vue"));
const StepOne = defineAsyncComponent(() => import("./step-one/index.vue"));
const StepTwo = defineAsyncComponent(() => import("./step-two/index.vue"));
const StepThree = defineAsyncComponent(() => import("./step-three/index.vue"));

const props = defineProps<{
    /** 知识库 Id */
    id?: string;
    /** 知识库详情 */
    datasetsDetail?: Dataset;
}>();

const router = useRouter();
const { t } = useI18n();
const { step, STEPS, nextStep, changeStep } = useStep();

const datasets = reactive<CreateDatasetParams>({
    // 分段配置
    indexingConfig: {
        documentMode: "normal",
        parentContextMode: "paragraph",
        segmentation: {
            segmentIdentifier: "\\n\\n",
            maxSegmentLength: 1024,
            segmentOverlap: 50,
        },
        subSegmentation: {
            segmentIdentifier: "\\n",
            maxSegmentLength: 512,
        },
        preprocessingRules: {
            replaceConsecutiveWhitespace: false,
            removeUrlsAndEmails: false,
        },
        fileIds: [],
    },
    name: "",
    description: "",
    // 嵌入模型
    embeddingModelId: "",
    // 检索配置
    retrievalConfig: {
        retrievalMode: "hybrid",
        strategy: "weighted_score",
        topK: 3,
        scoreThreshold: 0.5,
        scoreThresholdEnabled: false,
        weightConfig: {
            semanticWeight: 0.7,
            keywordWeight: 0.3,
        },
        rerankConfig: {
            enabled: false,
            modelId: "",
        },
    },
});
const datasetsId = ref<string>(props.id ?? "");

const { lockFn: handleCreate } = useLockFn(async () => {
    try {
        // if create documents or create dataset 判断是否创建文档或者创建知识库
        if (props.id) {
            const { indexingConfig } = datasets;
            const params = {
                indexingConfig,
                datasetId: props.id,
                embeddingModelId: datasets.embeddingModelId,
            };
            await apiCreateDocument(params);
            refreshNuxtData(`dataset-detail-${props.id}`);
        } else {
            const result = await apiCreateDataset(datasets);
            datasetsId.value = result.id as string;
        }
        nextStep();
    } catch (error) {
        console.log("创建错误 => ", error);
    }
});

const toast = useMessage();

// 创建空知识库
const handleCreateEmpty = async () => {
    if (!datasets.name || !datasets.name.trim()) {
        toast.error(t("datasets.settings.nameInput"));
        return;
    }
    if (!datasets.description || !datasets.description.trim()) {
        toast.error(t("datasets.settings.descriptionInput"));
        return;
    }
    try {
        const result = await apiCreateEmptyDataset({
            name: datasets.name,
            description: datasets.description,
        });
        // 跳转到新知识库详情页
        router.replace(`/datasets/${result.id}/documents`);
    } catch (error) {
        toast.error(t("console-common.failed"));
        console.error("创建空知识库失败", error);
    }
};

onMounted(() => {
    if (!props.id && !props.datasetsDetail?.id) {
        return false;
    }
    const datasetsDetail = props.datasetsDetail;
    (Reflect.ownKeys(datasets) as Array<keyof CreateDatasetParams>).forEach((key) => {
        if (datasetsDetail && Object.prototype.hasOwnProperty.call(datasetsDetail, key)) {
            datasets[key] = (datasetsDetail?.[key] as never) ?? datasets[key];
        }
    });
    datasets.indexingConfig.fileIds = [];
});
</script>

<template>
    <div class="create-dataset-container flex h-full flex-col">
        <div class="sticky top-0 z-10 flex px-4 py-2">
            <UButton
                class="absolute top-1/2 left-2 -translate-y-[50%]"
                variant="link"
                color="neutral"
                :label="$t('datasets.dataset.title')"
                leading-icon="i-lucide-chevron-left"
                @click="
                    router.replace(!!props.id ? `/datasets/${props.id}/documents` : '/datasets')
                "
            />
            <TopBar :steps="STEPS" :activeIndex="step" />
        </div>

        <div class="container mx-auto h-full px-4 py-2">
            <!-- 步骤1 选择知识库数据 -->
            <div v-show="step === 1" class="flex h-full min-h-0 w-full">
                <StepOne
                    v-model:fileIds="datasets.indexingConfig.fileIds"
                    v-model:name="datasets.name"
                    v-model:description="datasets.description"
                    :disabled="!!props.id"
                    @onStepChange="nextStep"
                    @createEmpty="handleCreateEmpty"
                />
            </div>
            <!-- 步骤2 分段与配置模型 -->
            <div v-show="step === 2" class="flex h-full min-h-0 w-full">
                <StepTwo
                    v-model:indexingConfig="datasets.indexingConfig"
                    v-model:embeddingModelId="datasets.embeddingModelId"
                    v-model:retrievalConfig="datasets.retrievalConfig"
                    :disabled="!!props.id"
                    @onStepChange="changeStep"
                    @onCreate="handleCreate"
                />
            </div>
            <!-- 步骤3 完成知识库创建 -->
            <div v-if="step === 3" class="flex h-full min-h-0 w-full">
                <StepThree
                    :datasetsId="datasetsId"
                    :createData="datasets"
                    :isAddDocument="!!props.id"
                    :fileIds="datasets.indexingConfig.fileIds"
                />
            </div>
        </div>
    </div>
</template>
