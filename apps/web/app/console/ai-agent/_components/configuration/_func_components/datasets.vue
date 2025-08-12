<script setup lang="ts">
import { ProModal, ProScrollArea, useLockFn } from "@fastbuildai/ui";

import type { Dataset } from "@/models/ai-datasets";
import { apiGetDatasetList } from "@/services/console/ai-datasets";

const props = defineProps<{
    modelValue: string[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string[]): void;
}>();

const datasets = useVModel(props, "modelValue", emit);

const { t } = useI18n();
const isOpen = ref<boolean>(false);

// 知识库列表
const datasetList = ref<Dataset[]>([]);
const overview = ref<Dataset[]>([]);
const selectedDataset = ref<Dataset[]>([]);

// 检索模式标签
const retrievalModeLabels = {
    vector: { value: t("datasets.retrieval.vector"), color: "primary" },
    fullText: { value: t("datasets.retrieval.fullText"), color: "success" },
    hybrid: { value: t("datasets.retrieval.hybrid"), color: "warning" },
} as const;
type RetrievalMode = keyof typeof retrievalModeLabels;

/** 是否选中 */
const isSelected = computed(() => {
    return (dataset: Dataset) => {
        return selectedDataset.value.findIndex((item) => item.id === dataset.id) !== -1;
    };
});

/** 选择知识库 */
const selectDataset = (dataset: Dataset) => {
    if (isSelected.value(dataset)) {
        const index = selectedDataset.value.findIndex((item) => item.id === dataset.id);
        selectedDataset.value.splice(index, 1);
        return;
    }
    selectedDataset.value.push(dataset);
};

/** 删除选择的知识库 */
const removeDataset = (index: number) => {
    selectedDataset.value.splice(index, 1);
    overview.value.splice(index, 1);
    datasets.value = selectedDataset.value.map((item) => item.id);
};

/** 保存选择的知识库 */
const handleSave = () => {
    datasets.value = selectedDataset.value.map((item) => item.id);
    overview.value = selectedDataset.value.map((item) => item);
    handleClose();
};

/** 打开弹窗 */
const openModal = () => {
    isOpen.value = true;
};

/** 关闭弹窗 */
const handleClose = () => {
    isOpen.value = false;
};

/** 获取知识库列表 */
const { lockFn: fetchDatasetList, isLock: loading } = useLockFn(async () => {
    try {
        const response = await apiGetDatasetList({ page: 1, pageSize: 9999 });
        datasetList.value = response.items || [];

        selectedDataset.value = datasetList.value.filter((dataset) =>
            datasets.value.includes(dataset.id),
        );
        overview.value = JSON.parse(JSON.stringify(selectedDataset.value));
    } catch (error) {
        console.error("获取知识库列表失败:", error);
    }
});

onMounted(() => fetchDatasetList());
</script>

<template>
    <div>
        <div class="bg-muted rounded-lg p-3">
            <div class="flex items-center justify-between">
                <div class="text-foreground flex items-center gap-1 text-sm font-medium">
                    关联知识库
                    <UTooltip :delay-duration="0" :ui="{ content: 'w-xs h-auto' }">
                        <UIcon name="i-lucide-circle-help" />
                        <template #content>
                            <div class="text-background text-xs">
                                选择智能体可以访问的知识库
                                <br />
                                智能体将根据这些知识库的内容回答用户问题。
                            </div>
                        </template>
                    </UTooltip>
                </div>

                <UButton
                    size="sm"
                    color="primary"
                    variant="ghost"
                    class="flex items-center"
                    @click="openModal"
                >
                    <UIcon name="i-lucide-plus" />
                    <span>添加</span>
                </UButton>
            </div>

            <div class="space-y-3">
                <div
                    v-for="(item, index) in overview"
                    :key="index"
                    class="group bg-background mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
                >
                    <div class="flex flex-1 items-center gap-2">
                        <div class="bg-primary-50 border-default flex rounded-lg border p-2">
                            <UIcon name="i-lucide-folder" class="text-primary size-4" />
                        </div>
                        <div class="text-foreground flex text-sm font-medium">
                            {{ item.name }}
                        </div>
                    </div>

                    <div class="flex items-center group-hover:hidden">
                        <UChip
                            :color="retrievalModeLabels[item.retrievalMode as RetrievalMode].color"
                            size="sm"
                        />
                        <span class="ml-3 text-xs">
                            {{ retrievalModeLabels[item.retrievalMode as RetrievalMode].value }}
                        </span>
                    </div>
                    <div class="hidden items-center group-hover:flex">
                        <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-lucide-trash"
                            @click="removeDataset(index)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加知识库弹窗 -->
        <ProModal
            v-model="isOpen"
            title="选择引用知识库"
            description="选择智能体可以引用的知识库，支持多选"
            :ui="{ content: 'max-w-md' }"
            @close="handleClose"
        >
            <!-- 加载中 -->
            <div class="flex h-90 flex-col items-center justify-center" v-if="loading">
                <UIcon name="i-lucide-loader-circle" class="animate-spin" />
                <span class="text-sm">加载中...</span>
            </div>
            <div class="h-90" v-else-if="datasetList.length">
                <ProScrollArea class="h-full pr-3" :shadow="false">
                    <div
                        v-for="(item, index) in datasetList"
                        :key="index"
                        class="bg-background border-default mt-2 mb-2 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2"
                        :class="{ '!bg-primary-50 !border-primary': isSelected(item) }"
                        @click="selectDataset(item)"
                    >
                        <div class="flex flex-1 items-center gap-2">
                            <div class="bg-muted border-default flex rounded-lg border p-2">
                                <UIcon name="i-lucide-folder" class="text-primary size-5" />
                            </div>
                            <div class="text-foreground flex text-sm font-medium">
                                {{ item.name }}
                            </div>
                        </div>

                        <div class="flex items-center group-hover:hidden">
                            <UChip
                                :color="
                                    retrievalModeLabels[item.retrievalMode as RetrievalMode].color
                                "
                                size="sm"
                            />
                            <span class="ml-3 text-xs">
                                {{ retrievalModeLabels[item.retrievalMode as RetrievalMode].value }}
                            </span>
                        </div>
                    </div>
                </ProScrollArea>
            </div>

            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    取消
                </UButton>
                <UButton
                    color="primary"
                    size="lg"
                    type="submit"
                    :disabled="loading"
                    @click="handleSave"
                >
                    保存
                </UButton>
            </div>
        </ProModal>
    </div>
</template>
