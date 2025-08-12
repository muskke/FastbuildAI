<script setup lang="ts">
import { ProChatScroll, ProMarkdown, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";

import type { AiMessage } from "@/models";
import type { Agent, AgentChatMessage } from "@/models/ai-agent";
import { apiGetAgentChatMessages } from "@/services/console/ai-agent";

// 类型定义
interface Props {
    open: boolean;
    recordId: string;
    agentId?: string;
}

interface Emits {
    (e: "update:open", value: boolean): void;
}

// 定义 props 和 emits
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 依赖注入和 hooks
const { t } = useI18n();
const toast = useMessage();
const scrollAreaRef = useTemplateRef<InstanceType<typeof ProScrollArea>>("scrollAreaRef");
const { height: scrollAreaHeight } = useElementSize(scrollAreaRef);

// 状态管理
const messages = ref<AgentChatMessage[]>([]);
const loading = ref(false);
const queryPaging = reactive({ page: 1, pageSize: 20 });
const hasMore = ref(false);
const isAtBottom = ref(true);
const contextModalOpen = ref(false);
const currentContext = ref<any[]>([]);
const agents = inject<Ref<Agent>>("agents")!;

// 双向绑定 open
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
});

// 监听滚动事件，判断是否在底部
const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const threshold = 40;
    isAtBottom.value = target.scrollHeight - (target.scrollTop + target.clientHeight) <= threshold;
};

// 加载消息的核心逻辑
const loadMessages = async (reset = false) => {
    if (!props.recordId) return;

    if (reset) {
        queryPaging.page = 1;
        messages.value = [];
    }

    loading.value = true;
    try {
        const data = await apiGetAgentChatMessages(props.recordId, queryPaging);
        const newMessages = (data.items || []).reverse() as unknown as AgentChatMessage[];

        messages.value = reset ? newMessages : [...newMessages, ...messages.value];
        hasMore.value = data.total > messages.value.length;
    } catch (error: any) {
        console.error("加载消息失败:", error);
        toast.error(error?.message || "加载消息失败");
    } finally {
        loading.value = false;
    }
};

// 加载更多消息
const loadMoreMessages = async () => {
    if (!hasMore.value || loading.value) return;

    queryPaging.page++;
    try {
        await loadMessages(false);
    } catch (error) {
        queryPaging.page--;
        hasMore.value = true;
    }
};

// 滚动到底部
const scrollToBottom = async (animate = true) => {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom(animate);
};

// 打开对话上下文弹窗
const openContextModal = (context: any[]) => {
    currentContext.value = context;
    contextModalOpen.value = true;
};

// 监听 recordId 和 open 状态
watch(
    () => [props.recordId, props.open] as const,
    async ([newRecordId, isOpen]) => {
        if (isOpen && newRecordId) {
            await loadMessages(true);
            await scrollToBottom(false);
        }
    },
    { immediate: true },
);

// 滚动和 DOM 变更监听
onMounted(() => {
    const viewportEl = scrollAreaRef.value?.getViewportElement()?.viewportElement as HTMLElement;

    if (viewportEl) {
        viewportEl.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll({ target: viewportEl } as unknown as Event);

        const mutationObserver = new MutationObserver(() => {
            if (isAtBottom.value) scrollToBottom(false);
        });

        mutationObserver.observe(viewportEl, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        onUnmounted(() => {
            viewportEl.removeEventListener("scroll", handleScroll);
            mutationObserver.disconnect();
        });
    }
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
            class="bg-muted w-full max-w-xl"
        >
            <template #content>
                <div class="flex h-full w-full flex-col">
                    <!-- 头部 -->
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-message-circle" class="text-primary size-5" />
                            <h2 class="text-lg font-semibold">对话消息</h2>
                        </div>
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="ghost"
                            @click="isOpen = false"
                        />
                    </div>

                    <!-- 消息内容 -->
                    <div class="flex h-full min-h-0 flex-1 flex-col">
                        <!-- 加载状态 -->
                        <div
                            v-if="loading && messages.length === 0"
                            class="flex h-full items-center justify-center"
                        >
                            <div class="text-muted-foreground flex items-center gap-2 text-sm">
                                <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
                                正在加载消息...
                            </div>
                        </div>

                        <!-- 空状态 -->
                        <div
                            v-else-if="!loading && messages.length === 0"
                            class="flex h-full items-center justify-center"
                        >
                            <div class="text-muted-foreground text-center">
                                <UIcon
                                    name="i-lucide-message-circle-x"
                                    class="mx-auto mb-2 size-12"
                                />
                                <p>暂无消息记录</p>
                            </div>
                        </div>
                        <!-- 消息 -->
                        <ProScrollArea
                            v-else
                            class="h-full min-h-0 w-full"
                            type="auto"
                            ref="scrollAreaRef"
                            @in-view="scrollToBottom(false)"
                        >
                            <ProChatScroll
                                :loading="loading"
                                :has-more="hasMore"
                                :threshold="500"
                                content-class="max-w-full w-full space-y-3 px-4"
                                @load-more="loadMoreMessages"
                            >
                                <ChatMessages
                                    :messages="messages as AiMessage[]"
                                    :scroll-area-height="scrollAreaHeight"
                                    :assistant="{
                                        actions: [
                                            {
                                                label: '对话上下文',
                                                icon: 'i-lucide-file-type',
                                                show: !agents.showContext,
                                                onClick: (message) => {
                                                    if (message?.metadata?.context) {
                                                        openContextModal(message.metadata.context);
                                                    } else {
                                                        toast.error('暂无对话上下文');
                                                    }
                                                },
                                            },
                                        ],
                                    }"
                                    :spacing-offset="160"
                                >
                                    <template #content="{ message }">
                                        <ProMarkdown
                                            v-if="
                                                message.content.length ||
                                                (message.metadata?.references &&
                                                    message.metadata.references.length)
                                            "
                                            :content="message.content"
                                            class="mb-2"
                                        >
                                            <template #before>
                                                <!-- 知识库引用显示 -->
                                                <KnowledgeReference
                                                    v-if="
                                                        message.metadata?.references &&
                                                        message.metadata.references.length > 0 &&
                                                        message.role === 'assistant'
                                                    "
                                                    :references="message.metadata.references"
                                                />
                                            </template>
                                            <template #after>
                                                <template
                                                    v-if="
                                                        message.metadata?.references &&
                                                        message.metadata.references.length > 0 &&
                                                        message.role === 'assistant'
                                                    "
                                                >
                                                    <!-- 知识库引用来源 -->
                                                    <div class="my-2 flex items-center gap-1">
                                                        <span
                                                            class="text-muted-foreground flex-none text-xs"
                                                        >
                                                            引用
                                                        </span>
                                                        <USeparator
                                                            size="xs"
                                                            type="dashed"
                                                            v-if="
                                                                message.metadata?.references &&
                                                                message.metadata.references.length >
                                                                    0 &&
                                                                message.role === 'assistant'
                                                            "
                                                        />
                                                    </div>
                                                    <KnowledgeReferenceFiles
                                                        :references="message.metadata.references"
                                                    />
                                                </template>

                                                <!-- 标注命中 -->
                                                <div
                                                    class="mt-2 flex items-center gap-1"
                                                    v-if="
                                                        message.metadata?.annotations &&
                                                        message.role === 'assistant'
                                                    "
                                                >
                                                    <span
                                                        class="text-muted-foreground flex-none text-xs"
                                                    >
                                                        {{
                                                            message.metadata?.annotations?.createdBy
                                                        }}
                                                        编辑的答案
                                                    </span>
                                                    <USeparator size="xs" type="dashed" />
                                                </div>
                                            </template>
                                        </ProMarkdown>
                                    </template>
                                </ChatMessages>
                            </ProChatScroll>
                        </ProScrollArea>
                    </div>
                </div>
            </template>
        </UDrawer>
        <ChatContextModal v-model="contextModalOpen" :context="currentContext" />
    </div>
</template>
