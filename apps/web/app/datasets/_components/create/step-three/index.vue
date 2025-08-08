<script setup lang="ts">
import { usePaging, usePollingTask } from "@fastbuildai/ui";
import { computed, onMounted, watch } from "vue";

import type { CreateDatasetParams, DatasetDocument, QueryDocumentParams } from "@/models/datasets";
import { apiGetDocumentList } from "@/services/web/datasets";

/** 组件属性定义 */
interface Props {
    /** 创建知识库的数据 */
    createData: CreateDatasetParams;
    /** 知识库 Id */
    datasetsId: string;
    /** 是否为添加文档模式 */
    isAddDocument?: boolean;
    /** 文件ID列表（用于筛选本次新增的文档） */
    fileIds?: string[];
}

const props = defineProps<Props>();
const router = useRouter();
const { t } = useI18n();

/** 判断是否为添加文档模式 */
const isAddDocumentMode = computed(() => props.isAddDocument && !!props.datasetsId);

/** 页面标题 */
const pageTitle = computed(() =>
    isAddDocumentMode.value
        ? t("datasets.create.stepThree.dataTitle")
        : t("datasets.create.stepThree.createTitle"),
);

/** 页面描述 */
const pageDescription = computed(() =>
    isAddDocumentMode.value
        ? t("datasets.create.stepThree.dataDesc")
        : t("datasets.create.stepThree.createDesc"),
);

/** 文档状态标题 */
const documentStatusTitle = computed(() =>
    paging.needPolling
        ? t("datasets.create.stepThree.documentEmbedding")
        : t("datasets.create.stepThree.documentEmbeddingSuccess"),
);

/** 查询参数 */
const queryParams = computed<QueryDocumentParams>(() => ({
    datasetId: props.datasetsId,
    page: 1,
    pageSize: 999,
    ...(isAddDocumentMode.value &&
        props.fileIds &&
        props.fileIds.length > 0 && {
            fileIds: props.fileIds.join(","),
        }),
}));

/** 使用 paging */
const { paging, getLists } = usePaging<DatasetDocument>({
    fetchFun: apiGetDocumentList,
    params: queryParams.value,
});

/** 使用轮询函数 */
const { start: startPolling, clear: stopPolling } = usePollingTask(
    async (stopFn) => {
        await getLists();
        if (!paging.needPolling) {
            stopFn();
        }
    },
    { interval: 500 },
);

/** 获取文档状态颜色 */
const getDocumentStatusColor = (status: string): string => {
    const colorMap = {
        processing: "text-warning",
        completed: "text-success",
        failed: "text-error",
        pending: "text-muted-foreground",
    };
    return colorMap[status as keyof typeof colorMap] || "text-muted-foreground";
};

/** 获取状态图标 */
const getStatusIcon = (status: string): string => {
    const iconMap = {
        processing: "i-lucide-loader-2 animate-spin",
        completed: "i-heroicons-check-circle",
        failed: "i-heroicons-x-circle",
        pending: "i-lucide-clock",
    };
    return iconMap[status as keyof typeof iconMap] || "i-lucide-help-circle";
};

/** 获取分段模式的显示文本 */
const segmentModeText = computed(() => {
    const { documentMode } = props.createData.indexingConfig;
    const modeMap = {
        normal: t("datasets.create.segment.general"),
        hierarchical: t("datasets.create.segment.hierarchical"),
    };
    return modeMap[documentMode as keyof typeof modeMap] || t("datasets.create.segment.general");
});

/** 获取文本预处理规则的显示文本 */
const preprocessingRulesText = computed(() => {
    const { preprocessingRules } = props.createData.indexingConfig;
    if (!preprocessingRules) return t("datasets.create.stepThree.no");

    const rules = [];
    if (preprocessingRules.replaceConsecutiveWhitespace) {
        rules.push(t("datasets.create.segment.replaceConsecutiveWhitespace"));
    }
    if (preprocessingRules.removeUrlsAndEmails) {
        rules.push(t("datasets.create.segment.removeUrlsAndEmails"));
    }
    return rules.length > 0 ? rules.join("、") : t("datasets.create.stepThree.no");
});

/** 获取检索模式的显示文本 */
const retrievalModeText = computed(() => {
    const { retrievalMode } = props.createData.retrievalConfig;
    const modeMap = {
        vector: t("datasets.retrieval.vector"),
        fullText: t("datasets.retrieval.fullText"),
        hybrid: t("datasets.retrieval.hybrid"),
    };
    return modeMap[retrievalMode as keyof typeof modeMap] || t("datasets.retrieval.vector");
});

/** 获取检索设置的显示文本 */
const retrievalSettingsText = computed(() => {
    const { retrievalConfig } = props.createData;
    const { weightConfig } = retrievalConfig;

    if (!weightConfig) return t("datasets.create.stepThree.default");

    const settings = [];
    if (retrievalConfig.topK) {
        settings.push(`${t("datasets.create.stepThree.returnCount")}: ${retrievalConfig.topK}`);
    }
    if (retrievalConfig.scoreThreshold) {
        settings.push(
            `${t("datasets.retrieval.scoreThreshold")}: ${retrievalConfig.scoreThreshold}`,
        );
    }
    if (retrievalConfig.retrievalMode === "hybrid") {
        if (weightConfig.semanticWeight) {
            settings.push(
                `${t("datasets.retrieval.semanticWeight")}: ${weightConfig.semanticWeight}`,
            );
        }
        if (weightConfig.keywordWeight) {
            settings.push(
                `${t("datasets.retrieval.keywordWeight")}: ${weightConfig.keywordWeight}`,
            );
        }
    }

    return settings.length > 0 ? settings.join("、") : t("datasets.create.stepThree.default");
});

/** 监听 datasetsId 变化，重新获取文档列表 */
watch(
    () => props.datasetsId,
    async () => {
        await nextTick();
        await getLists();
    },
    { immediate: true },
);

/**
 * 监听轮询状态
 */
watch(
    () => paging.needPolling,
    (needPolling) => {
        if (needPolling) {
            startPolling();
        } else {
            stopPolling();
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    stopPolling();
});
</script>

<template>
    <div class="mx-auto inline-block w-3xl pt-10">
        <!-- 页面标题 -->
        <div class="mb-8">
            <h1 class="text-foreground text-xl font-semibold">{{ pageTitle }}</h1>
            <p class="text-muted-foreground">{{ pageDescription }}</p>
        </div>

        <!-- 知识库信息卡片 -->
        <div class="mb-8" v-if="!isAddDocumentMode">
            <div class="flex items-center gap-3">
                <div class="bg-primary-50 flex size-12 items-center justify-center rounded-lg">
                    <UIcon name="i-heroicons-book-open" class="text-primary h-6 w-6" />
                </div>
                <div class="flex-1">
                    <h3 class="text-foreground font-medium">{{ createData.name }}</h3>
                    <p class="text-muted-foreground">{{ createData.description }}</p>
                </div>
            </div>
        </div>

        <!-- 文档嵌入状态 -->
        <div class="mb-8">
            <h2 class="text-foreground mb-4 text-lg font-medium">{{ documentStatusTitle }}</h2>

            <!-- 文档处理状态 -->
            <div class="space-y-2">
                <div
                    class="bg-primary-50 flex items-center justify-between rounded-lg p-2"
                    v-for="document in paging.items"
                    :key="document.id"
                >
                    <div class="flex items-center gap-1">
                        <UIcon name="i-heroicons-document-text" class="text-primary size-5" />
                        <div class="flex flex-col">
                            <span class="text-foreground text-sm">
                                {{ document.fileName }}
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <!-- 状态图标和文本 -->
                        <div class="flex items-center gap-1">
                            <UIcon
                                :name="getStatusIcon(document.status) as string"
                                :class="`h-4 w-4 ${getDocumentStatusColor(document.status)}`"
                            />
                            <span class="text-primary text-xs">{{ document.progress || 0 }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <USeparator />

        <!-- 配置详情 -->
        <div class="mt-4 space-y-4">
            <!-- 分段模式 -->
            <div class="flex justify-between py-2">
                <span class="text-muted-foreground">{{
                    $t("datasets.create.stepThree.segmentMode")
                }}</span>
                <span class="text-foreground text-sm font-medium">{{ segmentModeText }}</span>
            </div>

            <!-- 最大分段长度 -->
            <div class="flex justify-between py-2">
                <span class="text-muted-foreground">{{
                    $t("datasets.create.segment.maxSegmentLength")
                }}</span>
                <span class="text-foreground text-sm font-medium">
                    {{ createData.indexingConfig.segmentation?.maxSegmentLength || "默认" }}
                </span>
            </div>

            <!-- 文本预处理规则 -->
            <div class="flex justify-between py-2">
                <span class="text-muted-foreground">{{
                    $t("datasets.create.segment.preprocessingRules")
                }}</span>
                <span class="text-foreground text-sm font-medium">
                    {{ preprocessingRulesText }}
                </span>
            </div>

            <!-- 检索模式 -->
            <div class="flex justify-between py-2">
                <span class="text-muted-foreground">{{ $t("datasets.common.retrievalMode") }}</span>
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-sparkles" class="h-4 w-4 text-purple-500" />
                    <span class="text-foreground text-sm font-medium">{{ retrievalModeText }}</span>
                </div>
            </div>

            <!-- 检索设置 -->
            <div class="flex justify-between py-2">
                <span class="text-muted-foreground">{{
                    $t("datasets.settings.retrievalMethod")
                }}</span>
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-adjustments-horizontal" class="text-primary h-4 w-4" />
                    <span class="text-foreground text-sm font-medium">{{
                        retrievalSettingsText
                    }}</span>
                </div>
            </div>

            <div class="flex justify-end">
                <UButton
                    trailing-icon="i-lucide-arrow-right"
                    :label="$t('datasets.create.goToDetail')"
                    size="lg"
                    @click="router.replace(`/datasets/${datasetsId}/documents`)"
                />
            </div>
        </div>
    </div>
</template>
