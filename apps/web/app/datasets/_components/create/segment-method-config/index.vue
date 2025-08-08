<script lang="ts" setup>
import { useVModel } from "@vueuse/core";

import type { IndexingConfig } from "@/models/datasets";

import OptionCard from "../option-card/index.vue";
import SegmentParamConfig from "./segment-param.vue";

const props = defineProps<{
    modelValue: IndexingConfig;
    isPreviewing?: boolean;
    onPreviewSegments?: () => void;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: IndexingConfig];
}>();

const indexingConfig = useVModel(props, "modelValue", emit);
</script>

<template>
    <div class="space-y-3">
        <!-- 通用分段 -->
        <OptionCard
            :title="$t('datasets.create.segment.general')"
            :description="$t('datasets.create.segment.generalDesc')"
            icon="i-heroicons-squares-2x2"
            :selected="indexingConfig.documentMode === 'normal'"
            @click="indexingConfig.documentMode = 'normal'"
        >
            <SegmentParamConfig
                v-model="indexingConfig"
                :is-previewing="isPreviewing"
                @preview-segments="onPreviewSegments"
            />
        </OptionCard>

        <!-- 父子分段 -->
        <OptionCard
            :title="$t('datasets.create.segment.hierarchical')"
            :description="$t('datasets.create.segment.hierarchicalDesc')"
            icon="i-heroicons-document-duplicate"
            :selected="indexingConfig.documentMode === 'hierarchical'"
            @click="indexingConfig.documentMode = 'hierarchical'"
        >
            <SegmentParamConfig
                v-model="indexingConfig"
                :is-previewing="isPreviewing"
                @preview-segments="onPreviewSegments"
            />
        </OptionCard>
    </div>
</template>
