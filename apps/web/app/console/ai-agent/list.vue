<script lang="ts" setup>
import { ProInfiniteScroll, ProScrollArea, useMessage, useModal } from "@fastbuildai/ui";
import { onMounted, reactive, ref } from "vue";

import type { Agent, QueryAgentParams } from "@/models/ai-agent";
import { apiDeleteAgent, apiGetAgentList } from "@/services/console/ai-agent";

import AgentCard from "./_components/agent-card.vue";
const AgentModal = defineAsyncComponent(() => import("./_components/agent-modal.vue"));

// 路由实例
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数
const searchForm = reactive<QueryAgentParams>({
    keyword: "",
    page: 1,
    pageSize: 15,
});

// 无限滚动状态管理
const loading = ref(false);
const hasMore = ref(true);
const agents = ref<Agent[]>([]);

// 编辑弹窗状态
const showModal = ref(false);
const editAgentId = ref<string | null>(null);

/** 获取智能体列表（第一页或重新加载） */
const getLists = async () => {
    if (loading.value) return;

    loading.value = true;
    searchForm.page = 1;

    try {
        const res = await apiGetAgentList(searchForm);

        agents.value = res.items || [];
        hasMore.value = res.totalPages > searchForm.page;
        searchForm.page = searchForm.page! + 1;
    } catch (error) {
        console.error("获取数据失败:", error);
        hasMore.value = false;
    } finally {
        loading.value = false;
    }
};

/** 加载更多数据 */
const loadMore = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;

    try {
        const res = await apiGetAgentList(searchForm);

        if (res.items && res.items.length > 0) {
            agents.value.push(...res.items);
            hasMore.value = res.totalPages > searchForm.page!;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error("加载更多数据失败:", error);
    } finally {
        loading.value = false;
    }
};

/** 删除数据 */
const handleDelete = async (agent: Agent) => {
    try {
        await useModal({
            title: t("datasets.list.delete.title"),
            description: t("datasets.list.delete.desc"),
            color: "error",
        });

        await apiDeleteAgent(agent.id);

        const originalPage = searchForm.page;
        searchForm.page = 1;
        searchForm.pageSize = agents.value.length;
        await getLists();

        searchForm.page = originalPage;
        searchForm.pageSize = 15;
        toast.success(t("datasets.list.delete.success"));
    } catch (error) {
        console.error("删除失败:", error);
    }
};

/** 编辑智能体 */
const handleEdit = (agent: Agent) => {
    editAgentId.value = agent.id;
    showModal.value = true;
};

/** 创建智能体 */
const handleCreateAgent = () => {
    editAgentId.value = null;
    showModal.value = true;
};

/** 处理编辑弹窗关闭 */
const handleEditModalClose = async (refresh?: boolean) => {
    showModal.value = false;
    editAgentId.value = null;

    // 如果需要刷新列表
    if (refresh) {
        searchForm.page = 1;
        searchForm.pageSize = 15;
        await getLists();
    }
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="datasets-list-container flex flex-col items-center justify-center">
        <div class="datasets-list-container container">
            <!-- 搜索区域 -->
            <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
                <UButton label="智能体" color="primary" />

                <div class="flex items-center gap-2 md:ml-auto">
                    <UInput
                        v-model="searchForm.keyword"
                        :placeholder="$t('datasets.dataset.searchPlaceholder')"
                        class="w-80"
                        @change="getLists"
                    />
                </div>
            </div>

            <!-- 使用无限滚动 -->
            <ProScrollArea class="h-[calc(100vh-9rem)] min-h-0 w-full">
                <ProInfiniteScroll
                    :loading="loading"
                    :has-more="hasMore"
                    :threshold="200"
                    :loading-text="$t('common.loading')"
                    :no-more-text="searchForm.page !== 1 ? $t('common.noMoreData') : ' '"
                    @load-more="loadMore"
                >
                    <div
                        class="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        <!-- 创建智能体卡片 -->
                        <div
                            class="group border-default relative cursor-pointer rounded-lg border border-dashed p-4 transition-all duration-200 hover:shadow-lg"
                            @click="handleCreateAgent"
                        >
                            <!-- 左上角图标和标题 -->
                            <div
                                class="group-hover:text-primary text-foreground mb-3 flex items-center gap-3"
                            >
                                <div
                                    class="border-default flex size-10 flex-shrink-0 items-center justify-center rounded-lg border border-dashed"
                                >
                                    <UIcon name="i-lucide-plus" class="h-6 w-6" />
                                </div>

                                <h3 class="truncate text-sm font-medium">创建智能体</h3>
                            </div>

                            <!-- 描述文字 -->
                            <div class="text-muted-foreground mb-6 pr-8 text-xs">
                                <p class="line-clamp-2 overflow-hidden">
                                    创建具备自主工具调用能力，以及知识库能力的应用
                                </p>
                            </div>

                            <div class="flex items-center gap-2">
                                <UButton
                                    color="neutral"
                                    variant="ghost"
                                    class="w-full"
                                    icon="i-lucide-file-input"
                                    size="sm"
                                    label="导入DSL文件"
                                />
                            </div>
                        </div>

                        <!-- 智能体卡片 -->
                        <AgentCard
                            v-for="agent in agents"
                            :key="agent.id"
                            :agent="agent"
                            @delete="handleDelete"
                            @edit="handleEdit"
                        />
                    </div>
                </ProInfiniteScroll>
            </ProScrollArea>
        </div>

        <!-- 编辑智能体弹窗 -->
        <AgentModal v-if="showModal" :id="editAgentId" @close="handleEditModalClose" />
    </div>
</template>
