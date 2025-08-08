<script lang="ts" setup>
import { ProScrollArea, useLockFn, useMessage, useModal } from "@fastbuildai/ui";
import { h, markRaw, reactive, ref } from "vue";

import ChatPrompt from "@/common/components/chat-prompt.vue";
import type { DatasetChunk, RetrievalConfig } from "@/models/datasets";
import { apiRetrievalTest } from "@/services/web/datasets";

import RetrievalMethodConfig from "../_components/create/retrieval-method-config/index.vue";

const { params: URLQueryParams } = useRoute();
const toast = useMessage();
const { t } = useI18n();
const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);

// 查询相关
const query = ref("");
const result = ref<{ chunks: DatasetChunk[]; totalTime: number } | null>(null);

const UIcon = resolveComponent("UIcon");

// 检索配置
const useCustomConfig = ref(false);
const retrievalConfig = reactive<RetrievalConfig>({
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
    },
});

// 历史记录
const history = ref<
    Array<{
        id: string;
        query: string;
        timestamp: string;
        success: boolean;
        error?: string;
    }>
>([]);

// 打开检索配置弹窗
const openRetrievalConfig = () => {
    const config = reactive<RetrievalConfig>({
        retrievalMode: retrievalConfig.retrievalMode,
        strategy: retrievalConfig.strategy,
        topK: retrievalConfig.topK,
        scoreThreshold: retrievalConfig.scoreThreshold,
        scoreThresholdEnabled: retrievalConfig.scoreThresholdEnabled,
        weightConfig: { ...retrievalConfig.weightConfig },
        rerankConfig: { ...retrievalConfig.rerankConfig },
    });

    useModal({
        title: t("datasets.retrieval.retrievalConfig"),
        content: markRaw({
            setup() {
                return () =>
                    h("div", { class: "py-4" }, [
                        h(RetrievalMethodConfig, {
                            modelValue: config,
                            "onUpdate:modelValue": (value: RetrievalConfig) => {
                                Object.assign(config, value);
                            },
                        }),
                    ]);
            },
        }),
        confirmText: t("console-common.confirm"),
        cancelText: t("console-common.cancel"),
        ui: {
            content: "!w-2xl",
        },
    }).then(() => {
        Object.assign(retrievalConfig, config);
        useCustomConfig.value = true;
    });
};

// 执行召回测试
const { lockFn: handleRetrievalTest, isLock: loading } = useLockFn(async () => {
    if (!query.value.trim()) {
        toast.error(t("datasets.test.placeholder"));
        return;
    }

    const testId = Date.now().toString();
    const timestamp = new Date().toLocaleString();

    try {
        const testData = {
            query: query.value,
            retrievalConfig: useCustomConfig.value ? retrievalConfig : undefined,
        };

        result.value = await apiRetrievalTest(datasetId.value as string, testData);

        // 添加到历史记录
        history.value.unshift({
            id: testId,
            query: query.value,
            timestamp,
            success: true,
        });

        toast.success(t("datasets.test.success"));
    } catch (error) {
        console.error("召回测试失败:", error);

        // 添加到历史记录
        history.value.unshift({
            id: testId,
            query: query.value,
            timestamp,
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
        });

        toast.error(t("datasets.test.failed"));
    }
});

// 从历史记录重新执行
const retryFromHistory = (historyItem: any) => {
    query.value = historyItem.query;
    handleRetrievalTest();
};

// 获取检索模式图标
const getRetrievalModeIcon = (mode: string) => {
    switch (mode) {
        case "vector":
            return "i-heroicons-squares-2x2";
        case "fullText":
            return "i-heroicons-document-text";
        case "hybrid":
            return "i-heroicons-squares-2x2";
    }
};

// 获取检索模式名称
const getRetrievalModeName = (mode: string) => {
    switch (mode) {
        case "vector":
            return t("datasets.retrieval.vector");
        case "fullText":
            return t("datasets.retrieval.fullText");
        case "hybrid":
            return t("datasets.retrieval.hybrid");
    }
};

// 展示 chunk 详情弹窗
function showChunkDetail(chunk: DatasetChunk) {
    useModal({
        title: `${t("datasets.segments.chunkDetail")} ${chunk.chunkIndex !== undefined ? ` #${chunk.chunkIndex}` : ""}`,
        content: () =>
            h("div", { class: "space-y-3" }, [
                // 头部信息，两端对齐
                h("div", { class: "flex items-center justify-between mb-2" }, [
                    h("span", { class: "inline-flex items-center" }, [
                        h(UIcon, { name: "i-lucide-grip", class: "size-3 mr-1" }),
                        h(
                            "span",
                            { class: "text-sm font-medium" },
                            `Chunks #${chunk.chunkIndex ?? "-"}`,
                        ),
                        h(
                            "span",
                            { class: "text-muted-foreground text-xs ml-2" },
                            `${chunk.contentLength ?? "-"} character`,
                        ),
                    ]),
                    h(
                        "span",
                        {
                            class: "inline-block bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-semibold",
                        },
                        `SCORE ${chunk.score?.toFixed(2) ?? "-"}`,
                    ),
                ]),
                // 内容
                h(
                    ProScrollArea,
                    {
                        style: {
                            height: "300px",
                        },
                        class: "rounded-lg border border-default bg-background mt-4",
                        shadow: false,
                    },
                    [h("div", { class: "whitespace-pre-wrap text-sm p-2" }, chunk.content)],
                ),
                // 文件名放到内容下方
                chunk.fileName
                    ? h("div", { class: "text-xs text-muted-foreground mt-2" }, [
                          h(
                              "span",
                              { class: "font-medium" },
                              `${t("datasets.segments.sourceFile")}:`,
                          ),
                          ` ${chunk.fileName}`,
                      ])
                    : null,
            ]),
        ui: {
            content: "!w-3xl",
        },
    });
}
</script>

<template>
    <div class="flex h-full w-full flex-col px-6">
        <div class="flex flex-col justify-center gap-1 pt-4">
            <h1 class="!text-lg font-bold">{{ t("datasets.test.title") }}</h1>
            <p class="text-muted-foreground text-sm">
                {{ t("datasets.test.description") }}
            </p>
        </div>

        <div class="flex flex-1 gap-6 py-6">
            <!-- 左侧：查询输入和历史记录 -->
            <div class="flex h-full w-1/2 flex-col space-y-6">
                <!-- 查询输入区域 -->
                <ChatPrompt
                    :is-loading="loading"
                    v-model="query"
                    :rows="6"
                    :placeholder="$t('datasets.test.placeholder')"
                    @submit="handleRetrievalTest"
                >
                    <template #panel-top>
                        <div class="flex w-full items-center justify-between p-2">
                            <span class="text-muted-foreground text-sm">
                                {{ t("datasets.test.retrievalConfig") }}
                            </span>
                            <UButton
                                variant="outline"
                                size="sm"
                                :icon="
                                    getRetrievalModeIcon(
                                        useCustomConfig ? retrievalConfig.retrievalMode : 'hybrid',
                                    )
                                "
                                @click="openRetrievalConfig"
                            >
                                {{
                                    useCustomConfig
                                        ? getRetrievalModeName(retrievalConfig.retrievalMode)
                                        : t("datasets.retrieval.hybrid")
                                }}
                            </UButton>
                        </div>
                    </template>
                    <template #panel-left>
                        <div class="text-muted-foreground text-xs">{{ query.length }} / 250</div>
                    </template>
                    <template #panel-right>
                        <UButton
                            :loading="loading"
                            :disabled="!query.trim()"
                            color="primary"
                            size="md"
                            @click.stop="handleRetrievalTest"
                        >
                            {{ t("datasets.test.test") }}
                        </UButton>
                    </template>
                </ChatPrompt>

                <!-- 历史记录 -->
                <div class="flex h-full flex-col">
                    <h3 class="mb-2 text-base font-medium">
                        {{ t("datasets.test.record") }}
                    </h3>
                    <ProScrollArea class="grid h-full w-full" :shadow="false">
                        <div
                            v-for="item in history.slice(0, 10)"
                            :key="item.id"
                            class="hover:bg-muted/50 mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border p-3"
                            @click="retryFromHistory(item)"
                        >
                            <div class="min-w-0 flex-1">
                                <div class="mb-1 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium">Retrieval Test</span>
                                        <UBadge
                                            :color="item.success ? 'success' : 'error'"
                                            variant="soft"
                                            size="xs"
                                        >
                                            {{
                                                item.success
                                                    ? t("console-common.messages.success")
                                                    : t("console-common.messages.failed")
                                            }}
                                        </UBadge>
                                    </div>

                                    <div class="text-muted-foreground ml-2 text-xs">
                                        {{ item.timestamp }}
                                    </div>
                                </div>
                                <div class="text-muted-foreground text-sm">
                                    {{ item.success ? item.query : item.error }}
                                </div>
                            </div>
                        </div>
                    </ProScrollArea>
                </div>
            </div>

            <!-- 右侧：结果展示 -->
            <div class="w-1/2 flex-none">
                <div class="bg-muted flex h-full flex-col rounded-lg p-4">
                    <h3 class="mb-4 text-base font-medium">
                        {{
                            result
                                ? `${result.chunks.length} ${t("datasets.test.recallParagraph")}`
                                : t("datasets.test.recallResult")
                        }}
                        <UBadge
                            v-if="result?.totalTime"
                            :label="`${result?.totalTime}ms`"
                            color="primary"
                            variant="soft"
                        />
                    </h3>
                    <div
                        v-if="!result"
                        class="text-muted-foreground flex flex-1 items-center justify-center py-8 text-center"
                    >
                        {{ t("datasets.test.tip") }}
                    </div>
                    <div v-else class="flex-1 space-y-4 overflow-auto">
                        <!-- 召回结果 -->
                        <div class="space-y-3">
                            <div
                                v-for="(chunk, index) in result.chunks"
                                :key="chunk.id"
                                class="bg-background space-y-3 rounded-lg p-4"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-grip" class="size-3" />
                                        <span class="text-sm font-medium"
                                            >Chunks #{{ chunk.chunkIndex }}</span
                                        >
                                        <span class="text-muted-foreground text-xs"
                                            >{{ chunk.contentLength }} character</span
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <UBadge
                                            :label="`SCORE ${chunk.score.toFixed(2)}`"
                                            color="primary"
                                            variant="soft"
                                        />
                                        <UButton
                                            variant="ghost"
                                            size="sm"
                                            icon="i-lucide-external-link"
                                            @click.stop="showChunkDetail(chunk)"
                                        >
                                            {{ t("console-common.open") }}
                                        </UButton>
                                    </div>
                                </div>
                                <p
                                    class="text-muted-foreground line-clamp-2 text-sm leading-relaxed"
                                >
                                    {{ chunk.content }}
                                </p>
                                <div
                                    v-if="chunk?.fileName"
                                    class="text-muted-foreground border-default border-t pt-3 text-xs"
                                >
                                    <span class="font-medium">
                                        {{ t("datasets.segments.sourceFile") }}:
                                    </span>
                                    {{ chunk.fileName }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
