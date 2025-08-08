<script lang="ts" setup>
import { useVModel } from "@vueuse/core";

import type { RetrievalConfig } from "@/models/datasets";

import OptionCard from "../option-card/index.vue";
import RetrievalParamConfig from "./retrieval-param.vue";

const props = defineProps<{
    modelValue: RetrievalConfig;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: RetrievalConfig];
}>();

const retrievalConfig = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="space-y-3">
        <!-- 向量检索 -->
        <OptionCard
            :title="$t('datasets.retrieval.vector')"
            :description="$t('datasets.retrieval.vectorDesc')"
            icon="i-heroicons-squares-2x2"
            icon-class="text-purple-500"
            selected-header-class="!to-muted !from-purple-50"
            :selected="retrievalConfig.retrievalMode === 'vector'"
            @click="retrievalConfig.retrievalMode = 'vector'"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>

        <!-- 全文检索 -->
        <OptionCard
            :title="$t('datasets.retrieval.fullText')"
            :description="$t('datasets.retrieval.fullTextDesc')"
            icon="i-heroicons-document-text"
            icon-class="text-blue-500"
            selected-header-class="!to-muted !from-blue-50"
            :selected="retrievalConfig.retrievalMode === 'fullText'"
            @click="retrievalConfig.retrievalMode = 'fullText'"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>

        <!-- 混合检索 -->
        <OptionCard
            :title="$t('datasets.retrieval.hybrid')"
            :description="$t('datasets.retrieval.hybridDesc')"
            icon="i-heroicons-squares-2x2"
            icon-class="text-indigo-500"
            selected-header-class="!to-muted !from-indigo-50"
            :selected="retrievalConfig.retrievalMode === 'hybrid'"
            @click="retrievalConfig.retrievalMode = 'hybrid'"
        >
            <RetrievalParamConfig v-model="retrievalConfig" />
        </OptionCard>
    </div>
</template>
