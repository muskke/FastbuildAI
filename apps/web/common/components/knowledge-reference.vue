<script setup lang="ts">
import { formatDuration } from "@/common/utils/helper";

const { t } = useI18n();

interface KnowledgeReference {
    datasetId: string;
    datasetName: string;
    userContent: string;
    retrievalMode?: string;
    duration?: number;
    chunks: Array<{
        id: string;
        content: string;
        score: number;
        metadata?: any;
        fileName?: string;
        chunkIndex?: number;
    }>;
}

interface Props {
    references?: KnowledgeReference[];
}

const props = withDefaults(defineProps<Props>(), {
    references: () => [],
});

// 检索模式映射
const retrievalModeMap = {
    vector: t("datasets.retrieval.vector"),
    fullText: t("datasets.retrieval.fullText"),
    hybrid: t("datasets.retrieval.hybrid"),
} as const;
</script>

<template>
    <div
        v-if="references && references.length > 0"
        class="border-default bg-muted mb-4 rounded-lg border p-2"
    >
        <UCollapsible
            class="group"
            v-for="(ref, index) in references"
            :key="index"
            :unmountOnHide="false"
        >
            <div class="flex cursor-pointer flex-row items-center gap-2 text-xs select-none">
                <UIcon name="i-lucide-hammer" class="text-primary size-4" />
                <div>
                    {{ t("common.chat.knowledgeCall.start") }}
                    {{ t("common.chat.knowledgeCall.from") }}
                </div>
                <div name="knowledge" class="bg-primary/15 text-primary rounded px-2 py-1 text-xs">
                    {{ ref.datasetName }}
                </div>
                <div class="text-md">
                    {{ t("common.chat.knowledgeCall.call") }}
                </div>
                <div name="knowledge" class="bg-primary/15 text-primary rounded px-2 py-1 text-xs">
                    {{ retrievalModeMap[ref.retrievalMode as keyof typeof retrievalModeMap] }}
                </div>
                <div>
                    {{ t("common.chat.knowledgeCall.finished") }}
                </div>
                <div v-if="ref.duration" class="bg-secondary rounded px-2 py-1 text-xs">
                    {{ t("common.chat.toolCall.duration") }}
                    {{ formatDuration(ref.duration) }}
                </div>
                <UIcon
                    name="i-lucide-chevron-down"
                    class="rotate-270 transition-transform duration-200 group-data-[state=open]:rotate-360"
                />
            </div>

            <template #content>
                <div class="mt-3 space-y-3">
                    <!-- 请求部分 -->
                    <div class="bg-background rounded p-3">
                        <div class="text-foreground mb-2 text-xs font-medium">请求</div>
                        <div class="text-sm text-gray-800">
                            {{ ref?.userContent }}
                        </div>
                    </div>

                    <!-- 响应部分 -->
                    <div class="bg-background rounded p-3">
                        <div class="text-foreground mb-2 text-xs font-medium">响应</div>
                        <div class="text-muted-foreground flex flex-col gap-2 text-sm">
                            <template v-for="(chunk, index) in ref?.chunks" :key="index">
                                <div>
                                    <span class="text-foreground font-bold">
                                        #chunk-{{ index + 1 }}:
                                    </span>
                                    {{ chunk.content }}
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </template>
        </UCollapsible>
    </div>
</template>
