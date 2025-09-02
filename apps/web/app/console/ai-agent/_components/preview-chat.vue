<script setup lang="ts">
import { ProChatScroll, ProMarkdown, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { nextTick, onMounted, onUnmounted, watch } from "vue";

import ChatContextModal from "@/common/components/chat-context-modal.vue";
import KnowledgeReference from "@/common/components/knowledge-reference.vue";
import KnowledgeReferenceFiles from "@/common/components/knowledge-reference-files.vue";
import { useChat } from "@/common/composables/useChat";
import type { UpdateAgentConfigParams } from "@/models/ai-agent";
import type { AiMessage } from "@/models/ai-conversation";
import { apiAgentChat, apiCreateAgentAnnotation } from "@/services/console/ai-agent";

import AgentAnnotationModal from "./logs/annotation-modal.vue";

const { params: URLQueryParams } = useRoute();
const userStore = useUserStore();
const { t } = useI18n();
const toast = useMessage();
const scrollAreaRef = useTemplateRef<InstanceType<typeof ProScrollArea>>("scrollAreaRef");
const { height: scrollAreaHeight } = useElementSize(scrollAreaRef);

const props = defineProps<{
    agent: UpdateAgentConfigParams;
}>();

const agentId = computed(() => (URLQueryParams as Record<string, string>).id);

const conversationId = ref<string | null>(null);

const initialMessages: AiMessage[] = [];

// 对话上下文弹窗状态
const contextModalOpen = ref(false);
const currentContext = ref<AiMessage[]>([]);

// 标注模态框相关状态
const annotationModalOpen = ref(false);
const editingAnnotationId = ref<string | null>(null);
const currentMessageId = ref<string | null>(null);

const { messages, input, handleSubmit, reload, stop, status, error } = useChat({
    api: apiAgentChat,
    initialMessages: initialMessages,
    chatConfig: {
        get avatar() {
            return props.agent.chatAvatar;
        },
    },
    body: {
        agentId: agentId.value,
        saveConversation: false,
        get conversationId() {
            return conversationId.value;
        },
        get modelConfig() {
            return props.agent.modelConfig;
        },

        get datasetIds() {
            return props.agent.datasetIds;
        },
        get rolePrompt() {
            return props.agent.rolePrompt;
        },
        get showContext() {
            return props.agent.showContext;
        },
        get showReference() {
            return props.agent.showReference;
        },
        get enableFeedback() {
            return props.agent.enableFeedback;
        },
        get autoQuestions() {
            return props.agent.autoQuestions;
        },
        get formFields() {
            return props.agent.formFields;
        },
        get formFieldsInputs() {
            return props.agent.formFieldsInputs;
        },
        get quickCommands() {
            return props.agent.quickCommands;
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
        }
    },
    onError(err) {
        const message = err?.message || "发送失败";
        console.error("聊天错误:", message);
    },
    onFinish(message) {},
});

const isLoading = computed(() => status.value === "loading");

// 自动滚动状态
const isAtBottom = ref(true);

/**
 * 监听滚动事件，实时更新是否处于底部
 */
function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    const threshold = 40; // 阈值，单位：px
    isAtBottom.value = target.scrollHeight - (target.scrollTop + target.clientHeight) <= threshold;
}

async function scrollToBottom(animate = true) {
    await nextTick();
    scrollAreaRef.value?.scrollToBottom(animate);
}

async function handleSubmitMessage(content: string) {
    if (!content.trim() || isLoading.value) return;
    if (!props.agent.modelConfig?.id)
        return toast.warning(t("console-ai-agent.modelNotConfigured"));

    // 验证表单字段必填项
    const formFields = props.agent.formFields || [];
    const formFieldsInputs = props.agent.formFieldsInputs || {};

    if (formFields.length > 0) {
        const validationErrors: string[] = [];

        formFields.forEach((field) => {
            if (field.required) {
                const value = formFieldsInputs[field.name];
                if (!value || (typeof value === "string" && value.trim() === "")) {
                    validationErrors.push(
                        `${field.label}${t("console-ai-agent.configuration.notEmpty")}`,
                    );
                }
            }
        });

        if (validationErrors.length > 0) {
            toast.error(
                `${t("console-ai-agent.configuration.formVariableTitle")}: ${validationErrors.join(", ")}`,
            );
            return;
        }
    }

    await handleSubmit(content);
    scrollToBottom();
}

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
 * 直接创建标注
 */
async function createAnnotationDirectly(message: AiMessage, index: number) {
    // 直接获取上一条消息作为用户问题
    const prevMessage = messages.value[index - 1];
    if (!prevMessage || prevMessage.role !== "user") {
        toast.error(t("console-ai-agent.configuration.noUserQuestion"));
        return;
    }

    try {
        const data = await apiCreateAgentAnnotation(agentId.value as string, {
            agentId: agentId.value,
            question: prevMessage.content,
            answer: message.content,
            enabled: true,
            messageId: message.id,
        });

        if (!messages.value[index]?.metadata) {
            messages.value[index]!.metadata = {};
        }

        // 更新本地消息的标注信息
        messages.value[index]!.metadata!.annotations = {
            annotationId: data.id,
            createdBy: userStore.userInfo?.nickname,
            question: data.question,
            similarity: 1,
        };
    } catch (error) {
        console.error("创建标注失败:", error);
    }
}

/**
 * 处理标注模态框关闭
 */
function handleAnnotationModalClose(refresh?: boolean) {
    annotationModalOpen.value = false;
    editingAnnotationId.value = null;
    currentMessageId.value = null;
}

// 当最后一条消息的内容变化，并且滚动条在底部时，保持自动滚动
watch(
    () => messages.value.at(-1)?.content,
    () =>
        nextTick(() => {
            if (isAtBottom.value) {
                scrollToBottom(false);
            }
        }),
    { flush: "post" },
);

let mutationObserver: MutationObserver | null = null;

onMounted(async () => {
    // 页面首次渲染后滚动到底部
    scrollToBottom(false);

    const viewportComp = scrollAreaRef.value?.getViewportElement();
    const viewportEl = (viewportComp && (viewportComp as any).viewportElement) as
        | HTMLElement
        | undefined;

    viewportEl?.addEventListener("scroll", handleScroll, { passive: true });
    // 初始判断是否在底部
    if (viewportEl) {
        handleScroll({ target: viewportEl } as unknown as Event);

        // 监听内容变更（代码高亮、mermaid 渲染等异步操作可能改变高度）
        mutationObserver = new MutationObserver(() => {
            // 只有滚动条在底部时才自动跟随
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

defineExpose({
    clearRecord() {
        messages.value = [];
        conversationId.value = null;
    },
});
</script>

<template>
    <div class="flex h-full min-h-0 w-full flex-col">
        <ProScrollArea
            class="min-h-0 w-full flex-1"
            type="auto"
            ref="scrollAreaRef"
            @in-view="scrollToBottom(false)"
        >
            <ProChatScroll
                :loading="false"
                :has-more="false"
                :threshold="500"
                content-class="max-w-[800px] w-full space-y-3 p-4 "
            >
                <!-- 开场白与提问建议 -->
                <ChatMessages
                    v-if="messages.length === 0"
                    :messages="
                        [
                            {
                                role: 'assistant',
                                avatar: agent.chatAvatar,
                                content: agent.openingStatement,
                            },
                        ] as AiMessage[]
                    "
                    :scroll-area-height="scrollAreaHeight"
                    :assistant="{
                        actions: [],
                    }"
                >
                    <template #content="{ message }">
                        <ProMarkdown :content="message.content" class="mb-2" />

                        <div class="flex flex-col gap-2">
                            <div class="text-muted-foreground text-sm">
                                {{ t("console-ai-agent.configuration.youCanAskMe") }}
                            </div>

                            <div v-for="question in agent.openingQuestions" :key="question">
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
                                label: t('console-ai-agent.configuration.chatContext'),
                                icon: 'i-lucide-file-type',
                                show: !agent.showContext,
                                onClick: (message) => {
                                    if (message?.metadata?.context) {
                                        openContextModal(message.metadata.context);
                                    } else {
                                        toast.error(
                                            t('console-ai-agent.configuration.noChatContext'),
                                        );
                                    }
                                },
                            },
                            {
                                label: t('console-ai-agent.configuration.feedback'),
                                icon: 'i-lucide-wrap-text',
                                show: !agent.enableFeedback,
                                onClick: (message, index) => {
                                    const annotationId =
                                        message.metadata?.annotations?.annotationId;
                                    if (annotationId) {
                                        // 有标注ID，打开编辑弹窗
                                        openAnnotationModal(annotationId, message.id);
                                    } else {
                                        // 没有标注ID，直接创建标注
                                        createAnnotationDirectly(message, index);
                                    }
                                },
                            },
                        ],
                    }"
                    :spacing-offset="160"
                >
                    <template #content="{ message, index }">
                        <ProMarkdown
                            v-if="
                                message.content.length ||
                                (message.metadata?.references && message.metadata.references.length)
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
                                        <span class="text-muted-foreground flex-none text-xs">
                                            {{ t("console-ai-agent.configuration.referenceTitle") }}
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

                                <!-- 标注命中 -->
                                <div
                                    class="mt-2 flex items-center gap-1"
                                    v-if="
                                        message.metadata?.annotations &&
                                        message.role === 'assistant' &&
                                        !isLoading
                                    "
                                >
                                    <span class="text-muted-foreground flex-none text-xs">
                                        {{ message.metadata?.annotations?.createdBy }}
                                        {{ t("console-ai-agent.configuration.editedAnswer") }}
                                    </span>
                                    <USeparator size="xs" type="dashed" />
                                </div>
                            </template>
                        </ProMarkdown>
                        <!-- 提问建议 -->
                        <div
                            v-if="message.metadata?.suggestions && messages.length - 1 === index"
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

        <div class="px-4 pb-4">
            <div class="flex gap-2 pb-4">
                <div v-for="item in agent.quickCommands" :key="item.name">
                    <UButton color="neutral" variant="soft" @click="handleSubmitMessage(item.name)">
                        <img v-if="item.avatar" :src="item.avatar" class="h-4 w-4" />
                        <span>{{ item.name }}</span>
                    </UButton>
                </div>
            </div>
            <ChatPrompt
                v-model="input"
                :is-loading="isLoading"
                class="sticky bottom-0 z-10 [view-transition-name:chat-prompt]"
                @stop="stop"
                @submit="handleSubmitMessage"
            >
            </ChatPrompt>
        </div>

        <!-- 对话上下文弹窗 -->
        <ChatContextModal v-model="contextModalOpen" :context="currentContext" />

        <!-- 标注编辑模态框 -->
        <AgentAnnotationModal
            v-if="annotationModalOpen && agentId"
            :agent-id="agentId"
            :annotation-id="editingAnnotationId"
            :message-id="currentMessageId"
            @close="handleAnnotationModalClose"
        />
    </div>
</template>
