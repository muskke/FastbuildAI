<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, ref } from "vue";

import type { AgentTemplate } from "@/models/ai-agent";
import {
    apiGetAgentTemplateCategories,
    apiGetAgentTemplates,
    apiGetRecommendedTemplates,
} from "@/services/console/ai-agent";

const TemplateCreateModal = defineAsyncComponent(() => import("./template-create-modal.vue"));

// 事件
const emit = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

// 工具函数
const toast = useMessage();
const { t } = useI18n();

// 状态管理
const templates = ref<AgentTemplate[]>([]);
const recommendedTemplates = ref<AgentTemplate[]>([]);
const showCreateModal = ref(false);
const searchKeyword = ref("");
const selectedCategory = ref("all");
const categories = ref<string[]>([]);
const selectedTemplate = ref<AgentTemplate | null>(null);

// 计算属性
const isOpen = ref(true);

// 获取模板列表
const { lockFn: loadTemplates, isLock: templatesLoading } = useLockFn(async () => {
    try {
        const [templatesData, categoriesData, recommendedData] = await Promise.all([
            apiGetAgentTemplates(),
            apiGetAgentTemplateCategories(),
            apiGetRecommendedTemplates(),
        ]);

        templates.value = templatesData;
        categories.value = categoriesData;
        recommendedTemplates.value = recommendedData;
    } catch (error: any) {
        toast.error(error.message || t("console-ai-agent.template.messages.loadingFailed"));
    }
});

// 过滤模板
const filteredTemplates = computed(() => {
    let filtered: AgentTemplate[];

    // 根据分类选择数据源
    if (selectedCategory.value === "recommended") {
        filtered = recommendedTemplates.value;
    } else {
        filtered = templates.value;
    }

    // 按关键词过滤
    if (searchKeyword.value.trim()) {
        filtered = filtered.filter(
            (t) =>
                t.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchKeyword.value.toLowerCase()),
        );
    }

    // 按分类过滤（除了推荐和全部）
    if (selectedCategory.value !== "recommended" && selectedCategory.value !== "all") {
        filtered = filtered.filter((t) => t.category === selectedCategory.value);
    }

    return filtered;
});

// 选择模板 - 弹出创建表单
const selectTemplate = (template: AgentTemplate) => {
    selectedTemplate.value = template;
    showCreateModal.value = true;
};

// 关闭创建弹窗
const handleCreateModalClose = (refresh?: boolean) => {
    showCreateModal.value = false;
    selectedTemplate.value = null;

    // 如果创建成功，关闭抽屉并刷新列表
    if (refresh) {
        emit("close", true);
    }
};

// 关闭抽屉
const handleClose = () => {
    emit("close");
};

// 初始化
onMounted(() => {
    loadTemplates();
});
</script>

<template>
    <div>
        <UDrawer
            v-model:open="isOpen"
            :set-background-color-on-scale="false"
            direction="right"
            should-scale-background
            :handle-only="true"
            class="bg-muted w-full max-w-[85%]"
            @close="handleClose"
        >
            <template #content>
                <div class="flex h-full w-full flex-col">
                    <!-- 头部 -->
                    <div class="px-6 py-4">
                        <div class="relative flex items-center justify-between gap-4">
                            <h2 class="text-lg font-medium">
                                {{ t("console-ai-agent.template.applyFromTemplate") }}
                            </h2>
                            <div
                                class="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2"
                            >
                                <UInput
                                    v-model="searchKeyword"
                                    :placeholder="t('console-ai-agent.template.searchPlaceholder')"
                                    icon="i-lucide-search"
                                    size="lg"
                                    :ui="{ base: 'w-sm' }"
                                />
                            </div>
                            <UButton
                                color="neutral"
                                variant="ghost"
                                icon="i-lucide-x"
                                size="sm"
                                @click="handleClose"
                            />
                        </div>
                    </div>

                    <!-- 分类列表 -->
                    <div class="flex justify-center px-6 pt-6 pb-2">
                        <div class="flex gap-4 overflow-x-auto">
                            <UButton
                                :color="selectedCategory === 'all' ? 'primary' : 'neutral'"
                                :variant="selectedCategory === 'all' ? 'solid' : 'soft'"
                                size="sm"
                                @click="selectedCategory = 'all'"
                            >
                                {{ t("console-ai-agent.template.all") }}
                            </UButton>
                            <UButton
                                v-for="category in categories"
                                :key="category"
                                :color="selectedCategory === category ? 'primary' : 'neutral'"
                                :variant="selectedCategory === category ? 'solid' : 'soft'"
                                size="sm"
                                @click="selectedCategory = category"
                            >
                                {{ category }}
                            </UButton>
                        </div>
                    </div>

                    <!-- 内容区域 -->
                    <div class="flex-1 overflow-hidden">
                        <div class="h-full overflow-y-auto py-6 pr-6 pl-4">
                            <div
                                v-if="templatesLoading"
                                class="flex items-center justify-center py-12"
                            >
                                <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin" />
                            </div>

                            <div
                                v-else-if="filteredTemplates.length === 0"
                                class="py-12 text-center"
                            >
                                <UIcon
                                    name="i-lucide-package"
                                    class="text-muted-foreground mx-auto h-12 w-12"
                                />
                                <p class="text-muted-foreground mt-2">
                                    {{
                                        searchKeyword
                                            ? t("console-ai-agent.template.noMatchingTemplates")
                                            : t("console-ai-agent.template.noAvailableTemplates")
                                    }}
                                </p>
                            </div>

                            <div v-else class="space-y-6">
                                <!-- 推荐模板区域 -->
                                <div
                                    v-if="
                                        selectedCategory === 'all' &&
                                        !searchKeyword &&
                                        recommendedTemplates.length > 0
                                    "
                                >
                                    <h3 class="text-muted-foreground mb-4 text-sm font-medium">
                                        {{ t("console-ai-agent.template.recommendedTemplates") }}
                                    </h3>
                                    <div
                                        class="grid gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                    >
                                        <div
                                            v-for="template in recommendedTemplates"
                                            :key="template.id"
                                            class="border-default bg-background hover:border-primary group relative rounded-lg border p-4 shadow-xs transition-all"
                                        >
                                            <div class="flex items-start gap-3">
                                                <div
                                                    class="bg-primary/10 flex size-12 flex-shrink-0 items-center justify-center rounded-lg"
                                                >
                                                    <UIcon
                                                        :name="template.icon"
                                                        class="text-primary h-6 w-6"
                                                    />
                                                </div>
                                                <div
                                                    class="flex flex-col items-start justify-around"
                                                >
                                                    <div class="flex items-center gap-2">
                                                        <h4 class="font-medium">
                                                            {{ template.name }}
                                                        </h4>
                                                        <UBadge color="primary" size="sm">
                                                            {{
                                                                t(
                                                                    "console-ai-agent.template.recommended",
                                                                )
                                                            }}
                                                        </UBadge>
                                                    </div>
                                                    <p class="text-muted-foreground mt-1 text-xs">
                                                        {{
                                                            template.category ||
                                                            t("console-ai-agent.template.general")
                                                        }}
                                                    </p>
                                                </div>
                                            </div>
                                            <p
                                                class="text-muted-foreground mt-2 line-clamp-3 text-sm"
                                            >
                                                {{ template.description }}
                                            </p>
                                            <!-- 悬浮按钮 -->
                                            <div
                                                class="card-shadow absolute inset-x-0 bottom-0 flex justify-center opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <UButton
                                                    color="primary"
                                                    size="sm"
                                                    class="w-full justify-center text-center"
                                                    icon="i-lucide-plus"
                                                    @click="selectTemplate(template)"
                                                >
                                                    {{ t("console-ai-agent.template.useTemplate") }}
                                                </UButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 主模板区域 -->
                                <div>
                                    <h3 class="text-muted-foreground mb-4 text-sm font-medium">
                                        {{ t("console-ai-agent.template.allTemplates") }}
                                    </h3>
                                    <div
                                        class="grid gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                                    >
                                        <div
                                            v-for="template in filteredTemplates"
                                            :key="template.id"
                                            class="border-default bg-background hover:border-primary group relative rounded-lg border p-4 shadow-xs transition-all"
                                        >
                                            <div class="flex items-start gap-3">
                                                <div
                                                    class="bg-primary/10 flex size-12 flex-shrink-0 items-center justify-center rounded-lg"
                                                >
                                                    <UIcon
                                                        :name="template.icon"
                                                        class="text-primary h-6 w-6"
                                                    />
                                                </div>
                                                <div
                                                    class="flex flex-col items-start justify-around"
                                                >
                                                    <div class="flex items-center gap-2">
                                                        <h4 class="font-medium">
                                                            {{ template.name }}
                                                        </h4>
                                                        <UBadge
                                                            v-if="template.isRecommended"
                                                            color="primary"
                                                            size="sm"
                                                        >
                                                            {{
                                                                t(
                                                                    "console-ai-agent.template.recommended",
                                                                )
                                                            }}
                                                        </UBadge>
                                                    </div>
                                                    <p class="text-muted-foreground mt-1 text-xs">
                                                        {{
                                                            template.category ||
                                                            t("console-ai-agent.template.general")
                                                        }}
                                                    </p>
                                                </div>
                                            </div>
                                            <p
                                                class="text-muted-foreground mt-2 line-clamp-3 text-sm"
                                            >
                                                {{ template.description }}
                                            </p>
                                            <!-- 悬浮按钮 -->
                                            <div
                                                class="card-shadow absolute inset-x-0 bottom-0 flex justify-center opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <UButton
                                                    color="primary"
                                                    size="sm"
                                                    class="w-full justify-center text-center"
                                                    icon="i-lucide-plus"
                                                    @click="selectTemplate(template)"
                                                >
                                                    {{ t("console-ai-agent.template.useTemplate") }}
                                                </UButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </UDrawer>

        <!-- 创建智能体弹窗 -->
        <TemplateCreateModal
            v-if="showCreateModal && selectedTemplate"
            :template="selectedTemplate"
            @close="handleCreateModalClose"
        />
    </div>
</template>

<style scoped>
.card-shadow {
    padding: 20px 8px 8px 8px;
    height: 60px;
    border-radius: 0 0 12px 12px;
    background: linear-gradient(
        to bottom,
        transparent 0,
        var(--color-background) 20px,
        var(--color-background) 100%
    );
}
</style>
