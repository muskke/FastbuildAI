<script lang="ts" setup>
import { ProScrollArea, useLockFn } from "@fastbuildai/ui";
import { useVModel } from "@vueuse/core";

import type {
    IndexingConfig,
    IndexingSegmentsResponse,
    RetrievalConfig as RetrievalConfigType,
} from "@/models/ai-datasets";
import { apiIndexingSegments } from "@/services/console/ai-datasets";

import RetrievalMethodConfig from "../retrieval-method-config/index.vue";
import SegmentMethodConfig from "../segment-method-config/index.vue";
import SegmentPreview from "../segment-preview/index.vue";

const props = defineProps<{
    indexingConfig: IndexingConfig;
    embeddingModelId: string;
    retrievalConfig: RetrievalConfigType;
    disabled: boolean;
}>();
const emits = defineEmits<{
    (e: "update:retrievalConfig", v: RetrievalConfigType): void;
    (e: "update:embeddingModelId", v: string): void;
    (e: "onStepChange", v: number): void;
    (e: "onCreate", v: void): void;
    (e: "update:indexingConfig", v: IndexingConfig): void;
}>();

const embeddingModelId = useVModel(props, "embeddingModelId", emits);
const indexingConfig = useVModel(props, "indexingConfig", emits);
const retrievalConfig = useVModel(props, "retrievalConfig", emits);

// 预览分段结果
const segmentResults = reactive<IndexingSegmentsResponse>({
    totalSegments: 0,
    fileResults: [],
    processingTime: 0,
    processedFiles: 0,
});

// 预览方法
const { lockFn: handlePreview, isLock } = useLockFn(async () => {
    try {
        const data = await apiIndexingSegments(indexingConfig.value);
        segmentResults.totalSegments = data.totalSegments;
        segmentResults.fileResults = data.fileResults;
        segmentResults.processingTime = data.processingTime;
        segmentResults.processedFiles = data.processedFiles;
    } catch (error) {
        console.error("预览失败:", error);
    }
});

// Embedding 模型选项
const EMBEDDING_MODELS = [
    { label: "text-embedding-v3", value: "e2821aab-62e8-49b0-8b6d-e614085e2834" },
    { label: "text-embedding-3-large", value: "72267900-c0e6-4e89-930c-a699a283ba00" },
    { label: "text-embedding-ada-002", value: "e2821aab-62e8-49b0-8b6d-e614085e2834" },
];
</script>

<template>
    <div class="segmentation-configurator mx-auto h-full max-w-7xl">
        <div class="grid h-full grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- 左侧：配置区域 -->
            <ProScrollArea class="table h-full pr-2" :shadow="false">
                <!-- 分段设置 -->
                <section class="space-y-2">
                    <h5 class="text-foreground text-sm font-medium">
                        {{ $t("datasets.create.stepTwo.segmentation") }}
                    </h5>
                    <SegmentMethodConfig
                        v-model="indexingConfig"
                        :is-previewing="isLock"
                        :on-preview-segments="handlePreview"
                    />
                </section>

                <!-- Embedding 模型 -->
                <section class="mt-4 space-y-4">
                    <h5 class="text-foreground text-sm font-medium">
                        {{ $t("datasets.create.stepTwo.embeddingModel") }}
                    </h5>
                    <ModelSelect
                        :button-ui="{
                            variant: 'outline',
                            color: 'neutral',
                            ui: { base: 'w-full' },
                        }"
                        :defaultSelected="false"
                        capability="chat"
                        :supportedModelTypes="['text-embedding']"
                        placeholder="选择嵌入模型"
                        @change="(e) => (embeddingModelId = e.id)"
                    />
                </section>

                <!-- 检索设置 -->
                <section class="mt-4 space-y-4" :class="{ 'cursor-not-allowed': disabled }">
                    <h5 class="text-foreground text-sm font-medium">
                        {{ $t("datasets.settings.retrievalMethod") }}
                    </h5>
                    <RetrievalMethodConfig
                        v-model="retrievalConfig"
                        :class="{ 'pointer-events-none opacity-70': disabled }"
                    />
                </section>

                <!-- 创建按钮 -->
                <section class="flex justify-end gap-4 py-4">
                    <UButton size="lg" variant="outline" @click="emits('onStepChange', -1)">
                        {{ $t("datasets.create.previousStep") }}
                    </UButton>
                    <UButton size="lg" @click="emits('onCreate')">
                        {{ $t("datasets.create.saveAndCreate") }}
                    </UButton>
                </section>
            </ProScrollArea>

            <!-- 右侧：预览区域 -->
            <SegmentPreview :is-previewing="isLock" :results="segmentResults" />
        </div>
    </div>
</template>
