<script lang="ts" setup>
import { ProScrollArea } from "@fastbuildai/ui";

import type { IndexingSegmentsResponse } from "@/models/ai-datasets";

const props = defineProps<{
    isPreviewing: boolean;
    results: IndexingSegmentsResponse;
}>();

const activeFileIndex = ref<number>(0);

const activeFileData = computed(() => props.results.fileResults[activeFileIndex.value]);
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col">
        <!-- 预览头部 -->
        <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-1">
                <h5 class="text-foreground text-sm font-medium">
                    {{ $t("datasets.create.segmentPreview.title") }}
                </h5>

                <template v-if="results?.fileResults.length">
                    <USelect
                        v-model="activeFileIndex"
                        :items="
                            results?.fileResults?.map((item, index) => [
                                {
                                    label: item.fileName,
                                    icon: 'i-lucide-file-text',
                                    value: index,
                                },
                            ])
                        "
                        label-key="label"
                        value-key="value"
                        variant="none"
                        :ui="{ content: 'w-48' }"
                    />

                    <UBadge
                        :label="`${activeFileData?.segmentCount} chunks`"
                        size="sm"
                        variant="outline"
                    />
                </template>
            </div>
            <p class="text-muted-foreground text-xs">
                {{ $t("datasets.create.segmentPreview.clickLeftPreviewBlock") }}
            </p>
        </div>

        <!-- 空状态 -->
        <div
            v-if="!isPreviewing && !results.fileResults.length"
            class="border-default bg-background flex h-full items-center justify-center rounded-lg border"
        >
            <div class="text-center">
                <UIcon
                    name="i-lucide-scan-search"
                    class="text-muted-foreground mx-auto mb-4 h-12 w-12"
                />
                <p class="text-muted-foreground text-sm">
                    {{ $t("datasets.create.segmentPreview.clickLeftPreviewBlock") }}
                </p>
            </div>
        </div>

        <!-- 预览内容 -->
        <ProScrollArea
            v-else
            class="border-default bg-background table h-full rounded-lg border"
            :shadow="false"
        >
            <!-- 加载状态 -->
            <div v-if="isPreviewing" class="p-4">
                <div v-for="item in 20" class="mb-6">
                    <div class="mb-3 flex">
                        <USkeleton class="size-3" />
                        <USkeleton class="ml-1 h-3 w-12" />
                        <USkeleton class="ml-6 h-3 w-12" />
                    </div>
                    <div class="grid gap-2">
                        <USkeleton class="h-3 w-full" />
                        <USkeleton class="h-3 w-full" />
                    </div>
                </div>
            </div>

            <!-- 预览内容 -->
            <div v-else class="space-y-3 p-4">
                <template v-for="(segment, index) in activeFileData?.segments" :key="index">
                    <div class="text-muted-foreground mb-2 flex items-center gap-4">
                        <div class="flex items-center gap-1 text-xs font-medium">
                            <UIcon name="i-lucide-grip" class="size-3" />
                            Chunks # {{ index + 1 }}
                        </div>
                        <div class="text-xs">{{ segment.content.length }} character</div>
                    </div>
                    <div class="text-foreground text-xs whitespace-pre-wrap">
                        {{ segment.content }}
                    </div>
                </template>
            </div>
        </ProScrollArea>
    </div>
</template>
