<script setup lang="ts">
import { ProChatScroll, ProMarkdown, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { nextTick, onMounted, onUnmounted, watch } from "vue";

import ChatContextModal from "@/common/components/chat-context-modal.vue";
import KnowledgeReference from "@/common/components/knowledge-reference.vue";
import KnowledgeReferenceFiles from "@/common/components/knowledge-reference-files.vue";
import { useChat } from "@/common/composables/useChat";
import { uuid } from "@/common/utils/helper";
import type { AiMessage } from "@/models/ai-conversation";
import type { PaginationResult } from "@/models/global";
import {
    apiChatStream,
    apiGenerateAccessToken,
    apiGetAgentInfo,
    apiGetMessages,
} from "@/services/web/ai-agent-publish";

import AgentAnnotationModal from "../../../console/ai-agent/_components/logs/annotation-modal.vue";
import PublicAgentChatsList from "./public-agent-chats-list.vue";

const { t } = useI18n();
const isMobile = useMediaQuery("(max-width: 768px)");
// 路由参数
const { params: URLQueryParams } = useRoute();
const publishToken = computed(() => (URLQueryParams as Record<string, string>).id || "");

const toast = useMessage();
const scrollAreaRef = useTemplateRef<InstanceType<typeof ProScrollArea>>("scrollAreaRef");
const { height: scrollAreaHeight } = useElementSize(scrollAreaRef);

// 从cookie中获取当前对话ID
const currentConversationCookie = useCookie(`public_agent_conversation_${publishToken.value}`);
const conversationId = ref<string | null>(currentConversationCookie.value || null);
const isAtBottom = ref(true);
const agentError = ref<string>("");

// 对话上下文弹窗状态
const contextModalOpen = ref(false);
const currentContext = ref<AiMessage[]>([]);

// 标注模态框相关状态
const annotationModalOpen = ref(false);
const editingAnnotationId = ref<string | null>(null);
const currentMessageId = ref<string | null>(null);
const annotationFormData = ref<{
    question: string;
    answer: string;
    enabled: boolean;
}>({
    question: "",
    answer: "",
    enabled: true,
});

watch(conversationId, (newVal) => {
    currentConversationCookie.value = newVal;
});

// 分页参数
const queryPaging = reactive({ page: 1, pageSize: 15 });
const hasMore = ref(false);

// 获取或生成访问令牌
const { data: accessTokenData, refresh: refreshAccessToken } = await useAsyncData(
    `access-token-${publishToken.value}`,
    async () => {
        const cookieKey = `public_agent_token_${publishToken.value}`;
        const existingToken = useCookie(cookieKey);

        if (existingToken.value) {
            return { accessToken: existingToken.value, fromCache: true };
        }

        try {
            const tokenInfo = await apiGenerateAccessToken(publishToken.value);
            existingToken.value = tokenInfo.accessToken;
            return { ...tokenInfo, fromCache: false };
        } catch (error) {
            console.error("生成访问令牌失败:", error);
            throw error;
        }
    },
);

const accessToken = computed(() => accessTokenData.value?.accessToken || "");

// 获取当前对话的消息记录
const { data: messagesData, refresh: refreshMessagesData } = await useAsyncData(
    () => {
        if (!conversationId.value || !accessToken.value) {
            return {
                items: [],
                total: 0,
                page: queryPaging.page,
                pageSize: queryPaging.pageSize,
            } as unknown as Promise<PaginationResult<AiMessage>>;
        }
        return apiGetMessages(
            publishToken.value,
            accessToken.value,
            conversationId.value as string,
            queryPaging,
        );
    },
    {
        transform: (data: PaginationResult<AiMessage>) => data,
    },
);

// 检查智能体是否存在
if (!messagesData.value) {
    agentError.value = "智能体不存在或未发布";
}
if (!messagesData.value?.items?.length) {
    conversationId.value = null;
}

hasMore.value = (messagesData.value?.total as number) > (messagesData.value?.items?.length || 0);

// 根据消息数据生成初始消息
const initialMessages = computed(() => {
    if (!messagesData.value?.items) return [];
    return messagesData.value.items.map((item: AiMessage) => ({
        ...item,
        id: item.id || uuid(),
        avatar: agent.value?.chatAvatar || agent.value?.avatar,
        status: "completed" as const,
    }));
});

// 获取智能体信息
const { data: agent, pending: agentLoading } = await useAsyncData(
    `public-agent-${publishToken.value}`,
    () => apiGetAgentInfo(publishToken.value, accessToken.value),
);

// 对话管理方法
const createNewConversation = () => {
    conversationId.value = null;
    queryPaging.page = 1;
    messages.value = [];
};

const switchConversation = async (conv: AiMessage) => {
    console.log("switchConversation", conv.id === conversationId.value, conv);
    if (conv.id === conversationId.value) return;
    conversationId.value = conv.id as string;
    queryPaging.page = 1;

    refreshMessagesData();
    scrollToBottom();
};

// 聊天功能
const { messages, input, handleSubmit, reload, stop, status, error } = useChat({
    api: apiChatStream,
    initialMessages: [],
    chatConfig: {
        get avatar() {
            return agent.value?.chatAvatar || agent.value?.avatar;
        },
    },
    body: {
        publishToken: publishToken.value,
        accessToken: accessToken.value,
        saveConversation: true,
        get conversationId() {
            return conversationId.value;
        },
    },
    onToolCall(message) {},
    onResponse(response) {
        if (response.status === 401) {
            const userStore = useUserStore();
            userStore.logout(true);
        }
    },
    onUpdate(chunk) {
        if (chunk.type === "conversation_id") {
            conversationId.value = chunk.data as string;
            refreshNuxtData(
                `public-agent-conversations-${publishToken.value}-${accessToken.value}`,
            );
        }
    },
    onError(err) {
        console.error("聊天错误:", err?.message || "发送失败");
    },
    onFinish(message) {
        console.log("聊天完成:", message);
    },
});

const isLoading = computed(() => status.value === "loading");

// 加载更多消息
const loadMoreMessages = async () => {
    if (!hasMore.value || !conversationId.value || !publishToken.value || !accessToken.value)
        return;

    queryPaging.page++;
    try {
        const data = await apiGetMessages(
            publishToken.value,
            accessToken.value,
            conversationId.value,
            queryPaging,
        );

        const newMessages =
            data.items?.reverse().map((item: AiMessage) => ({
                id: item.id || uuid(),
                role: item.role,
                content: item.content,
                status: "completed" as const,
                mcpToolCalls: item.mcpToolCalls,
            })) || [];

        messages.value.unshift(...newMessages);
        hasMore.value = data.total > messages.value.length;
    } catch (err) {
        queryPaging.page--;
        console.error("加载更多消息失败:", err);
        hasMore.value = true;
    }
};

// 滚动相关方法
const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const threshold = 40;
    isAtBottom.value = target.scrollHeight - (target.scrollTop + target.clientHeight) <= threshold;
};

const scrollToBottom = async (animate = true) => {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom(animate);
};

// 提交消息
const handleSubmitMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return;
    if (!agent.value) return toast.error("智能体信息未加载");
    if (!accessToken.value) return toast.error("请先生成访问令牌");

    // 验证表单字段
    const formFields = agent.value.formFields || [];
    const formFieldsInputs = agent.value.formFieldsInputs || {};

    if (formFields.length > 0) {
        const validationErrors: string[] = [];
        formFields.forEach((field: any) => {
            if (field.required) {
                const value = formFieldsInputs[field.name];
                if (!value || (typeof value === "string" && value.trim() === "")) {
                    validationErrors.push(`${field.label}是必填字段`);
                }
            }
        });

        if (validationErrors.length > 0) {
            toast.error(`表单验证失败: ${validationErrors.join(", ")}`);
            return;
        }
    }

    await handleSubmit(content);
    scrollToBottom();
};

// 监听器
watch(
    initialMessages,
    (newMessages) => {
        if (newMessages) {
            messages.value = [...newMessages];
            nextTick(() => {
                if (newMessages.length > 0) {
                    scrollToBottom(false);
                }
            });
        }
    },
    { immediate: true },
);

watch(
    () => messages.value.at(-1)?.content,
    () => {
        nextTick(() => {
            if (isAtBottom.value) {
                scrollToBottom(false);
            }
        });
    },
    { flush: "post" },
);

/**
 * 打开对话上下文弹窗
 */
function openContextModal(context: AiMessage[]) {
    currentContext.value = context;
    contextModalOpen.value = true;
}

/**
 * 打开标注编辑弹窗（仅用于编辑已有标注）
 */
function openAnnotationModal(annotationId: string, messageId: string | null = null) {
    editingAnnotationId.value = annotationId;
    currentMessageId.value = messageId;
    annotationModalOpen.value = true;
}

/**
 * 打开标注创建弹窗
 */
function openAnnotationCreateModal(message: AiMessage, index: number) {
    // 获取上一条消息作为用户问题
    const prevMessage = messages.value[index - 1];
    if (!prevMessage || prevMessage.role !== "user") {
        toast.error("找不到对应的用户问题");
        return;
    }

    // 预填充表单数据
    annotationFormData.value = {
        question: prevMessage.content,
        answer: message.content,
        enabled: true,
    };

    currentMessageId.value = message.id || null;
    editingAnnotationId.value = null; // 确保是创建模式
    annotationModalOpen.value = true;
}

/**
 * 处理标注模态框关闭
 */
function handleAnnotationModalClose(refresh?: boolean, result?: AiMessage) {
    annotationModalOpen.value = false;

    // 如果是创建标注成功，更新对应消息的元数据
    if (result?.id && currentMessageId.value) {
        const messageIndex = messages.value.findIndex((msg) => msg.id === currentMessageId.value);
        if (messageIndex >= 0) {
            if (!messages.value[messageIndex]!.metadata) {
                messages.value[messageIndex]!.metadata = {};
            }
            messages.value[messageIndex]!.metadata!.annotations = {
                annotationId: result.id,
                createdBy: "",
                question: "",
                similarity: 1,
            };
        }
    }

    editingAnnotationId.value = null;
    currentMessageId.value = null;
    // 重置表单数据
    annotationFormData.value = {
        question: "",
        answer: "",
        enabled: true,
    };
}

// 生命周期
let mutationObserver: MutationObserver | null = null;

onMounted(async () => {
    scrollToBottom(false);

    const viewportComp = scrollAreaRef.value?.getViewportElement();
    const viewportEl = (viewportComp && (viewportComp as any).viewportElement) as
        | HTMLElement
        | undefined;

    if (viewportEl) {
        viewportEl.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll({ target: viewportEl } as unknown as Event);

        mutationObserver = new MutationObserver(() => {
            if (isAtBottom.value) {
                scrollToBottom(false);
            }
        });
        mutationObserver.observe(viewportEl, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }
});

onUnmounted(() => {
    const viewportComp = scrollAreaRef.value?.getViewportElement();
    const viewportEl = (viewportComp && (viewportComp as any).viewportElement) as
        | HTMLElement
        | undefined;
    viewportEl?.removeEventListener("scroll", handleScroll);
    mutationObserver?.disconnect();
});

// 页面标题
useHead({
    title: computed(() => (agent.value ? `${agent.value.name} - FastbuildAI` : "FastbuildAI")),
    link: [
        { rel: "icon", href: computed(() => agent.value?.avatar || "/favicon.ico") },
        { rel: "apple-touch-icon", href: computed(() => agent.value?.avatar || "/favicon.ico") },
    ],
});
</script>

<template>
    <div
        class="ai-chat bg-muted flex h-full min-h-0 items-center justify-center p-2"
        :class="{ '!p-0': isMobile }"
    >
        <!-- 左侧会话列表 -->
        <div class="bg-muted h-full flex-none">
            <PublicAgentChatsList
                :agent="agent"
                :publish-token="publishToken"
                :access-token="accessToken"
                v-model="conversationId"
                @new-conversation="createNewConversation"
                @switch-conversation="switchConversation"
            />
        </div>

        <!-- 右侧聊天区域 -->
        <div
            class="bg-background flex h-full min-h-0 w-full flex-col items-center rounded-xl"
            :class="{ '!rounded-none': isMobile }"
        >
            <!-- 加载状态 -->
            <div v-if="agentLoading" class="flex h-full w-full items-center justify-center">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-loader-2" class="text-primary size-6 animate-spin" />
                    <span class="text-lg">正在加载智能体...</span>
                </div>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="agentError" class="flex h-full w-full items-center justify-center">
                <div class="text-center">
                    <UIcon name="i-lucide-alert-circle" class="text-error mx-auto mb-4 size-12" />
                    <h2 class="mb-2 text-xl font-semibold">加载失败</h2>
                    <p class="text-muted-foreground">{{ agentError }}</p>
                </div>
            </div>

            <!-- 聊天界面 -->
            <template v-else-if="agent">
                <div class="flex h-12 w-full items-center justify-center"></div>
                <!-- 聊天内容区域 -->
                <ProScrollArea
                    class="h-full min-h-0 w-full"
                    type="auto"
                    ref="scrollAreaRef"
                    @in-view="scrollToBottom(false)"
                >
                    <ProChatScroll
                        :loading="false"
                        :has-more="hasMore"
                        :threshold="500"
                        content-class="max-w-[800px] w-full space-y-3 p-4 lg:py-4"
                        @load-more="loadMoreMessages"
                    >
                        <!-- 开场白与提问建议 -->
                        <ChatMessages
                            v-if="messages.length === 0"
                            :messages="
                                [
                                    {
                                        role: 'assistant',
                                        avatar: agent?.chatAvatar || agent?.avatar,
                                        content: agent?.openingStatement || '',
                                    },
                                ] as AiMessage[]
                            "
                            :scroll-area-height="scrollAreaHeight"
                            :assistant="{
                                actions: [],
                            }"
                        >
                            <template #content="{ message }">
                                <ProMarkdown
                                    :content="message.content"
                                    class="!px-0 !pt-0"
                                    :class="{ 'ml-4': agent?.avatar }"
                                />

                                <div class="flex flex-col gap-2" :class="{ 'ml-4': agent?.avatar }">
                                    <div class="text-muted-foreground text-sm">你可以这样问我</div>

                                    <div
                                        v-for="question in agent?.openingQuestions || []"
                                        :key="question"
                                    >
                                        <UButton
                                            :label="question"
                                            color="primary"
                                            variant="soft"
                                            @click="handleSubmitMessage(question)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </ChatMessages>

                        <!-- 聊天消息 -->
                        <ChatMessages
                            v-else
                            :messages="messages as AiMessage[]"
                            :scroll-area-height="scrollAreaHeight"
                            :error="error as unknown as Error"
                            :assistant="{
                                actions: [
                                    {
                                        label: t('common.chat.messages.retry'),
                                        icon: 'i-lucide-rotate-cw-square',
                                        onClick: () => reload(),
                                    },
                                    {
                                        label: '对话上下文',
                                        icon: 'i-lucide-file-type',
                                        show: !agent.showContext,
                                        onClick: (message) => {
                                            if (message?.metadata?.context) {
                                                openContextModal(message.metadata.context);
                                            } else {
                                                toast.error('暂无对话上下文');
                                            }
                                        },
                                    },
                                    {
                                        label: '标注',
                                        icon: 'i-lucide-wrap-text',
                                        show: !agent.enableFeedback,
                                        onClick: (message, index) => {
                                            const annotationId =
                                                message.metadata?.annotations?.annotationId;
                                            if (annotationId) {
                                                // 有标注ID，打开编辑弹窗
                                                openAnnotationModal(annotationId, message.id);
                                            } else {
                                                // 没有标注ID，打开创建弹窗
                                                openAnnotationCreateModal(message, index);
                                            }
                                        },
                                    },
                                ],
                            }"
                            :spacing-offset="160"
                        >
                            <template #content="{ message, index }">
                                <ProMarkdown
                                    v-if="message.content.length"
                                    :content="message.content"
                                    class="!px-0 !pt-0"
                                    :class="{ 'ml-4': agent?.avatar }"
                                >
                                    <template #before>
                                        <!-- 知识库引用显示 -->
                                        <KnowledgeReference
                                            v-if="
                                                message.metadata?.references &&
                                                message.metadata.references.length > 0 &&
                                                message.role === 'assistant' &&
                                                agent.showReference
                                            "
                                            :references="message.metadata.references"
                                        />
                                        <div
                                            v-if="message.status === 'loading'"
                                            class="flex items-center gap-2"
                                        >
                                            <UIcon name="i-lucide-loader-2" class="animate-spin" />
                                            <span>{{ t("common.chat.messages.thinking") }}</span>
                                        </div>
                                    </template>
                                    <template #after>
                                        <template
                                            v-if="
                                                message.metadata?.references &&
                                                message.metadata.references.length > 0 &&
                                                message.role === 'assistant' &&
                                                !isLoading &&
                                                agent.showReference
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
                                                        message.metadata.references.length > 0 &&
                                                        message.role === 'assistant'
                                                    "
                                                />
                                            </div>
                                            <KnowledgeReferenceFiles
                                                :references="message.metadata.references"
                                            />
                                        </template>
                                    </template>
                                </ProMarkdown>
                                <!-- 提问建议 -->
                                <div
                                    v-if="
                                        message.metadata?.suggestions &&
                                        messages.length - 1 === index
                                    "
                                    class="mb-2 space-y-2"
                                >
                                    <div
                                        v-for="suggestion in message.metadata.suggestions"
                                        :key="suggestion"
                                    >
                                        <UButton
                                            :label="suggestion"
                                            color="primary"
                                            variant="soft"
                                            @click="handleSubmitMessage(suggestion)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </ChatMessages>
                    </ProChatScroll>
                </ProScrollArea>

                <!-- 输入区域 -->
                <div class="w-full max-w-[800px] p-4 lg:py-2">
                    <!-- 快捷指令 -->
                    <div v-if="agent.quickCommands?.length" class="mb-3 px-4">
                        <div class="flex flex-wrap gap-2">
                            <UButton
                                v-for="item in agent.quickCommands"
                                :key="item.name"
                                color="neutral"
                                variant="soft"
                                size="sm"
                                @click="handleSubmitMessage(item.name)"
                            >
                                <img v-if="item.avatar" :src="item.avatar" class="h-4 w-4" />
                                <span>{{ item.name }}</span>
                            </UButton>
                        </div>
                    </div>

                    <!-- 输入框 -->
                    <ChatPrompt
                        v-model="input"
                        :is-loading="isLoading"
                        :placeholder="t('common.chat.and', { name: agent.name })"
                        class="sticky bottom-0 z-10 [view-transition-name:chat-prompt]"
                        :rows="1"
                        @stop="stop"
                        @submit="handleSubmitMessage"
                    >
                        <template #panel-right-item>
                            <span class="text-muted-foreground text-xs">
                                {{
                                    t("common.chat.singleRunConsumption", {
                                        price: agent.billingConfig.price,
                                    })
                                }}
                            </span>
                        </template>
                    </ChatPrompt>
                </div>
            </template>
        </div>

        <!-- 对话上下文弹窗 -->
        <ChatContextModal v-model="contextModalOpen" :context="currentContext" />

        <!-- 标注编辑模态框 -->
        <AgentAnnotationModal
            v-if="annotationModalOpen && agent?.id"
            :agent-id="agent?.id"
            :annotation-id="editingAnnotationId"
            :message-id="currentMessageId"
            :is-public="true"
            :publish-token="publishToken"
            :access-token="accessToken"
            :initial-data="editingAnnotationId ? undefined : annotationFormData"
            @close="handleAnnotationModalClose"
        />
    </div>
</template>
