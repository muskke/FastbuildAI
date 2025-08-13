<script lang="ts" setup>
import { ProSlider } from "@fastbuildai/ui";
import { useVModel } from "@vueuse/core";

import type { RetrievalConfig } from "@/models/ai-datasets";

const ModelSelect = defineAsyncComponent(() => import("@/common/components/model-select.vue"));

const props = defineProps<{
    modelValue: RetrievalConfig;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: RetrievalConfig];
}>();

const retrievalConfig = useVModel(props, "modelValue", emit);

// 权重自动联动：只允许调整语义权重，关键词权重自动 = 1 - 语义权重
function handleSemanticChange(val: number) {
    if (retrievalConfig.value.retrievalMode === "hybrid" && retrievalConfig.value.weightConfig) {
        let semantic = Number(val ?? 0);
        if (semantic < 0) semantic = 0;
        if (semantic > 1) semantic = 1;
        retrievalConfig.value.weightConfig.semanticWeight = semantic;
        retrievalConfig.value.weightConfig.keywordWeight = +(1 - semantic).toFixed(2);
    }
}

function handleKeywordChange(val: number) {
    if (retrievalConfig.value.retrievalMode === "hybrid" && retrievalConfig.value.weightConfig) {
        let keyword = Number(val ?? 0);
        if (keyword < 0) keyword = 0;
        if (keyword > 1) keyword = 1;
        retrievalConfig.value.weightConfig.keywordWeight = keyword;
        retrievalConfig.value.weightConfig.semanticWeight = +(1 - keyword).toFixed(2);
    }
}
</script>

<template>
    <div>
        <!-- 向量检索参数 -->
        <div v-if="retrievalConfig.retrievalMode === 'vector'" class="space-y-4">
            <USwitch
                v-model="retrievalConfig.rerankConfig!.enabled"
                :label="$t('datasets.retrieval.rerank')"
            />

            <!-- 重排模型选择（向量检索） -->
            <ModelSelect
                :modelValue="retrievalConfig.rerankConfig!.modelId"
                :button-ui="{
                    variant: 'outline',
                    color: 'neutral',
                    ui: { base: 'w-full' },
                    class: 'bg-background',
                }"
                :supportedModelTypes="['rerank']"
                :defaultSelected="false"
                capability="chat"
                placeholder="选择重排模型"
                @change="(e) => (retrievalConfig.rerankConfig!.modelId = e.id)"
            />

            <div class="grid grid-cols-2 gap-4">
                <UFormField label="Top K">
                    <ProSlider
                        v-model.number="retrievalConfig.topK"
                        type="number"
                        :max="10"
                        :step="1"
                        :min="1"
                        :placeholder="$t('datasets.retrieval.topKPlaceholder')"
                    />
                </UFormField>
                <UFormField label="">
                    <template #label>
                        <UTooltip
                            :text="$t('datasets.retrieval.scoreThreshold')"
                            :delay-duration="0"
                        >
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span>{{ $t("datasets.retrieval.scoreThreshold") }}</span>
                                    <UIcon name="i-lucide-circle-help" class="size-4" />
                                </div>
                                <USwitch v-model="retrievalConfig.scoreThresholdEnabled" />
                            </div>
                        </UTooltip>
                    </template>
                    <ProSlider
                        v-model.number="retrievalConfig.scoreThreshold"
                        type="number"
                        :step="0.1"
                        :max="1"
                        :min="0"
                        :disabled="!retrievalConfig.scoreThresholdEnabled"
                        :placeholder="$t('datasets.retrieval.scoreThresholdPlaceholder')"
                    />
                </UFormField>
            </div>
        </div>
        <!-- 全文检索参数 -->
        <div v-if="retrievalConfig.retrievalMode === 'fullText'" class="space-y-4">
            <USwitch
                v-model="retrievalConfig.rerankConfig!.enabled"
                :label="$t('datasets.retrieval.rerank')"
            />

            <!-- 重排模型选择（全文检索） -->
            <ModelSelect
                :modelValue="retrievalConfig.rerankConfig!.modelId"
                :button-ui="{
                    variant: 'outline',
                    color: 'neutral',
                    ui: { base: 'w-full' },
                    class: 'bg-background',
                }"
                :supportedModelTypes="['rerank']"
                :defaultSelected="false"
                capability="chat"
                placeholder="选择重排模型"
                @change="(e) => (retrievalConfig.rerankConfig!.modelId = e.id)"
            />

            <div class="grid grid-cols-2 gap-4">
                <UFormField label="Top K">
                    <ProSlider
                        v-model.number="retrievalConfig.topK"
                        type="number"
                        :placeholder="$t('datasets.retrieval.topKPlaceholder')"
                        :max="10"
                        :step="1"
                        :min="1"
                    />
                </UFormField>
                <UFormField label="" v-if="retrievalConfig.rerankConfig!.enabled">
                    <template #label>
                        <UTooltip
                            :text="$t('datasets.retrieval.scoreThreshold')"
                            :delay-duration="0"
                        >
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span>{{ $t("datasets.retrieval.scoreThreshold") }}</span>
                                    <UIcon name="i-lucide-circle-help" class="size-4" />
                                </div>
                                <USwitch v-model="retrievalConfig.scoreThresholdEnabled" />
                            </div>
                        </UTooltip>
                    </template>
                    <ProSlider
                        v-model.number="retrievalConfig.scoreThreshold"
                        type="number"
                        :step="0.1"
                        :max="1"
                        :min="0"
                        :disabled="!retrievalConfig.scoreThresholdEnabled"
                        :placeholder="$t('datasets.retrieval.scoreThresholdPlaceholder')"
                    />
                </UFormField>
            </div>
        </div>
        <!-- 混合检索参数 -->
        <div v-if="retrievalConfig.retrievalMode === 'hybrid'" class="space-y-4">
            <!-- 策略选择 -->
            <div class="flex gap-2">
                <UButton
                    :variant="retrievalConfig.strategy === 'weighted_score' ? 'solid' : 'outline'"
                    size="sm"
                    @click="retrievalConfig.strategy = 'weighted_score'"
                >
                    <UIcon name="i-heroicons-scale" class="mr-1 h-4 w-4" />
                    {{ $t("datasets.retrieval.weightSetting") }}
                </UButton>
                <UButton
                    :variant="retrievalConfig.strategy === 'rerank' ? 'solid' : 'outline'"
                    size="sm"
                    @click="retrievalConfig.strategy = 'rerank'"
                >
                    <UIcon name="i-heroicons-cpu-chip" class="mr-1 h-4 w-4" />
                    {{ $t("datasets.retrieval.rerank") }}
                </UButton>
            </div>
            <!-- 权重设置 -->
            <div v-if="retrievalConfig.strategy === 'weighted_score'" class="space-y-4">
                <p class="text-muted-foreground text-sm">
                    {{ $t("datasets.retrieval.weightSettingDesc") }}
                </p>
                <div class="grid grid-cols-2 gap-4">
                    <UFormField :label="$t('datasets.retrieval.semantic')">
                        <ProSlider
                            v-model.number="retrievalConfig.weightConfig!.semanticWeight"
                            type="number"
                            :min="0"
                            :max="1"
                            :step="0.1"
                            placeholder="0.5"
                            @update:modelValue="handleSemanticChange"
                        />
                    </UFormField>
                    <UFormField :label="$t('datasets.retrieval.keyword')">
                        <ProSlider
                            v-model.number="retrievalConfig.weightConfig!.keywordWeight"
                            type="number"
                            :min="0"
                            :max="1"
                            :step="0.1"
                            placeholder="0.3"
                            @update:modelValue="handleKeywordChange"
                        />
                    </UFormField>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Top K">
                        <ProSlider
                            v-model.number="retrievalConfig.topK"
                            type="number"
                            :min="1"
                            :max="10"
                            :step="1"
                            placeholder="3"
                        />
                    </UFormField>
                    <UFormField label="">
                        <template #label>
                            <UTooltip
                                :text="$t('datasets.retrieval.scoreThreshold')"
                                :delay-duration="0"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <span>{{ $t("datasets.retrieval.scoreThreshold") }}</span>
                                        <UIcon name="i-lucide-circle-help" class="size-4" />
                                    </div>
                                    <USwitch v-model="retrievalConfig.scoreThresholdEnabled" />
                                </div>
                            </UTooltip>
                        </template>
                        <ProSlider
                            v-model.number="retrievalConfig.scoreThreshold"
                            type="number"
                            :step="0.1"
                            :max="1"
                            :min="0"
                            :disabled="!retrievalConfig.scoreThresholdEnabled"
                            :placeholder="$t('datasets.retrieval.scoreThresholdPlaceholder')"
                        />
                    </UFormField>
                </div>
            </div>
            <!-- Rerank 设置 -->
            <div v-if="retrievalConfig.strategy === 'rerank'" class="space-y-4">
                <p class="text-muted-foreground text-sm">
                    {{ $t("datasets.retrieval.rerankDesc") }}
                </p>

                <!-- 重排模型选择（混合检索 - Rerank 策略） -->
                <ModelSelect
                    :modelValue="retrievalConfig.rerankConfig!.modelId"
                    :button-ui="{
                        variant: 'outline',
                        color: 'neutral',
                        ui: { base: 'w-full' },
                        class: 'bg-background',
                    }"
                    :supportedModelTypes="['rerank']"
                    :defaultSelected="false"
                    capability="chat"
                    placeholder="选择重排模型"
                    @change="(e) => (retrievalConfig.rerankConfig!.modelId = e.id)"
                />

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Top K">
                        <ProSlider
                            v-model.number="retrievalConfig.topK"
                            type="number"
                            :min="1"
                            :step="1"
                            :max="10"
                            placeholder="3"
                        />
                    </UFormField>
                    <UFormField label="">
                        <template #label>
                            <UTooltip text="Score阈值" :delay-duration="0">
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <span>{{ $t("datasets.retrieval.scoreThreshold") }}</span>
                                        <UIcon name="i-lucide-circle-help" class="size-4" />
                                    </div>
                                    <USwitch v-model="retrievalConfig.scoreThresholdEnabled" />
                                </div>
                            </UTooltip>
                        </template>
                        <ProSlider
                            v-model.number="retrievalConfig.scoreThreshold"
                            type="number"
                            :step="0.1"
                            :max="1"
                            :min="0"
                            :disabled="!retrievalConfig.scoreThresholdEnabled"
                            :placeholder="$t('datasets.retrieval.scoreThresholdPlaceholder')"
                        />
                    </UFormField>
                </div>
            </div>
        </div>
    </div>
</template>
