<script lang="ts" setup>
import { useVModel } from "@vueuse/core";

import type { RetrievalConfig } from "@/models/ai-datasets";

import OptionCard from "../option-card/index.vue";
import RetrievalParamConfig from "./retrieval-param.vue";

const props = defineProps<{
    modelValue: RetrievalConfig;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: RetrievalConfig];
}>();

const retrievalConfig = useVModel(props, "modelValue", emit);

// 切换检索模式时保持 strategy 字段
function handleModeChange(mode: 'vector' | 'fullText' | 'hybrid') {
    const currentStrategy = retrievalConfig.value.strategy;
    retrievalConfig.value.retrievalMode = mode;

    // 如果从混合检索切换到其他模式，保留 strategy 字段以便回到混合检索时恢复
    if (currentStrategy && mode !== 'hybrid') {
        retrievalConfig.value.strategy = currentStrategy;
    }

    // 如果切换到混合检索且没有 strategy，设置默认值
    if (mode === 'hybrid' && !retrievalConfig.value.strategy) {
        retrievalConfig.value.strategy = 'weighted_score';
    }
}
</script>

<template>
    <div class="space-y-3">
        <!-- 向量检索 -->
        <OptionCard
            :title="$t('console-ai-datasets.retrieval.vector')"
            :description="$t('console-ai-datasets.retrieval.vectorDesc')"
            icon="i-heroicons-squares-2x2"
            icon-class="text-purple-500"
            selected-header-class="!to-muted !from-purple-50"
            :selected="retrievalConfig.retrievalMode === 'vector'"
            @click="handleModeChange('vector')"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>

        <!-- 全文检索 -->
        <OptionCard
            :title="$t('console-ai-datasets.retrieval.fullText')"
            :description="$t('console-ai-datasets.retrieval.fullTextDesc')"
            icon="i-heroicons-document-text"
            icon-class="text-blue-500"
            selected-header-class="!to-muted !from-blue-50"
            :selected="retrievalConfig.retrievalMode === 'fullText'"
            @click="handleModeChange('fullText')"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>

        <!-- 混合检索 -->
        <OptionCard
            :title="$t('console-ai-datasets.retrieval.hybrid')"
            :description="$t('console-ai-datasets.retrieval.hybridDesc')"
            icon="i-heroicons-squares-2x2"
            icon-class="text-indigo-500"
            selected-header-class="!to-muted !from-indigo-50"
            :selected="retrievalConfig.retrievalMode === 'hybrid'"
            @click="handleModeChange('hybrid')"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>
    </div>
</template>
