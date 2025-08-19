<script setup lang="ts">
import { ProButtonCopy } from "@fastbuildai/ui";
import { useElementSize } from "@vueuse/core";
import { computed } from "vue";

import ToolCallReference from "@/common/components/tool-call-reference.vue";
import { STORAGE_KEYS } from "@/common/constants";
import type { AiMessage } from "@/models/ai-conversation";
import type { ChatWindowStyle } from "@/models/global";

/** 助手配置接口 */
interface AssistantConfig {
    actions?: Array<{
        label: string;
        icon: string;
        show?: boolean;
        onClick?: (message: AiMessage, index: number) => void;
    }>;
}

/** 组件属性接口 */
interface ChatMessagesProps {
    /** 消息列表 */
    messages?: AiMessage[];
    /** 助手配置 */
    assistant?: AssistantConfig;
    /** 错误信息 */
    error?: Error;
    /** 间距偏移 */
    spacingOffset?: number;
    /** 滚动区域高度 */
    scrollAreaHeight?: number;
}

const props = withDefaults(defineProps<ChatMessagesProps>(), {
    messages: () => [],
    assistant: () => ({ actions: [] }),
    spacingOffset: 0,
    scrollAreaHeight: 0,
});

// 用户消息元素引用
const lastUserMessageRef = useTemplateRef<HTMLElement>("lastUserMessageRef");
const { height: userMessageHeight } = useElementSize(lastUserMessageRef);
const { userInfo } = useUserStore();

/** 聊天窗口样式 Cookie */
const chatWindowStyleCookie = useCookie<ChatWindowStyle>(STORAGE_KEYS.CHAT_WINDOW_STYLE, {
    default: () => "conversation",
});

/** 是否为对话模式 */
const isConversationMode = computed(() => chatWindowStyleCookie.value === "conversation");

/** 计算容器样式 */
const containerClasses = computed(() => {
    return [
        "flex flex-col gap-4",
        props.spacingOffset > 0 ? `pb-[${props.spacingOffset}px]` : "",
    ].filter(Boolean);
});

/** 处理后的消息列表（不再添加全局状态消息） */
const allMessages = computed(() => {
    return [...props.messages];
});

/** 判断是否为最后一条非用户消息 */
const isLastNonUserMessage = computed(() => {
    const messages = allMessages.value;
    if (messages.length === 0) return false;

    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role !== "user";
});

/** 计算动态最小高度 */
const dynamicMinHeight = computed(() => {
    if (!isLastNonUserMessage.value || !props.scrollAreaHeight) return 120;

    // 使用实际的用户消息高度，如果没有则使用默认值
    const actualUserHeight = userMessageHeight.value > 0 ? userMessageHeight.value : 80;
    const calculatedHeight = props.scrollAreaHeight - actualUserHeight - 60;
    return Math.max(calculatedHeight, 120);
});

/** 获取消息发送者头像 */
const getMessageAvatar = (message: AiMessage) => {
    if (message.role === "user") {
        return userInfo?.avatar || "";
    }
    // AI消息：优先使用消息中的头像
    return message.avatar || "";
};

const { t } = useI18n();

/** 获取消息发送者名称 */
const getMessageName = (message: AiMessage) => {
    switch (message.role) {
        case "user":
            return t("common.chat.messages.me");
        case "assistant":
            return message.model?.model || t("common.chat.messages.assistant");
        default:
            return t("common.chat.messages.unknown");
    }
};
</script>

<template>
    <div :class="containerClasses">
        <!-- 消息列表 -->
        <div
            v-for="(message, index) in allMessages"
            :key="message.id"
            class="flex w-full gap-3"
            :class="{
                'flex-row-reverse': isConversationMode && message.role === 'user',
                'flex-row': !isConversationMode || message.role !== 'user',
                '!gap-0': message.role === 'assistant',
            }"
            :data-role="message.role"
            :ref="message.role === 'user' && !userMessageHeight ? 'lastUserMessageRef' : undefined"
        >
            <!-- 头像区域 -->
            <div
                v-if="message.role === 'user' || (message.role === 'assistant' && message.avatar)"
                class="flex-shrink-0"
            >
                <UAvatar
                    :src="getMessageAvatar(message)"
                    :alt="getMessageName(message)"
                    size="xl"
                />
            </div>

            <!-- 消息内容区域 -->
            <div
                class="flex min-w-0 flex-1 flex-col gap-1"
                :class="{
                    'items-end': isConversationMode && message.role === 'user',
                    'items-start': !isConversationMode || message.role !== 'user',
                }"
            >
                <!-- 消息气泡 -->
                <ChatBubble
                    :type="message.role === 'user' ? 'user' : 'system'"
                    :style="{
                        minHeight:
                            index === allMessages.length - 1 && message.role !== 'user'
                                ? `${dynamicMinHeight}px`
                                : 'auto',
                        maxWidth: message.role === 'user' ? '70%' : 'auto',
                    }"
                >
                    <!-- 加载状态消息 -->
                    <div
                        v-if="
                            message.status === 'loading' &&
                            message.mcpToolCalls?.length === 0 &&
                            (!message.metadata || Object.keys(message.metadata).length === 0)
                        "
                        class="bg-background flex items-center gap-2 rounded-lg p-4"
                    >
                        <UIcon name="i-lucide-loader-2" class="animate-spin" />
                        <span>{{ t("common.chat.messages.thinking") }}</span>
                    </div>

                    <ToolCallReference
                        v-if="
                            message.mcpToolCalls &&
                            message.mcpToolCalls.length > 0 &&
                            message.role === 'assistant'
                        "
                        :tool-calls="message.mcpToolCalls"
                        :message-id="message.id"
                        :key="`tool-${message.id}-${message.mcpToolCalls.map((item) => item.output)}`"
                    />

                    <!-- 错误状态消息 -->
                    <div
                        v-if="message.status === 'failed'"
                        class="flex items-center gap-2 text-red-500"
                    >
                        <UIcon name="i-lucide-alert-circle" />
                        <span>
                            {{
                                typeof error === "object"
                                    ? error?.message ||
                                      (error as any)?.content ||
                                      message.content ||
                                      t("common.chat.messages.sendFailed")
                                    : typeof error === "string"
                                      ? error || t("common.chat.messages.sendFailed")
                                      : JSON.stringify(error)
                            }}</span
                        >
                    </div>
                    <!-- 自定义内容插槽 -->
                    <slot
                        v-else-if="message.role !== 'user'"
                        name="content"
                        :message="message"
                        :index="index"
                    >
                        <div
                            v-dompurify-html="message?.content"
                            class="prose dark:prose-invert whitespace-pre-wrap"
                        ></div>
                    </slot>
                    <!-- 用户消息 -->
                    <div
                        v-else
                        v-dompurify-html="message?.content"
                        class="prose dark:prose-invert whitespace-pre-wrap"
                    ></div>

                    <!-- 助手消息的操作按钮 -->
                    <div
                        v-if="
                            message.role === 'assistant' &&
                            assistant.actions?.length &&
                            message.status !== 'active' &&
                            message.status !== 'loading'
                        "
                        class="action flex items-center justify-between pl-4"
                    >
                        <div class="flex items-center gap-1">
                            <ProButtonCopy
                                :content="message.content"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                            />
                            <template v-for="action in assistant.actions">
                                <UTooltip :text="action.label" :delay="100" v-if="!action.show">
                                    <UButton
                                        :key="action.label"
                                        :icon="action.icon"
                                        size="xs"
                                        color="neutral"
                                        variant="ghost"
                                        class="p-2"
                                        @click="action.onClick?.(message, index)"
                                    >
                                    </UButton>
                                </UTooltip>
                            </template>
                        </div>

                        <div class="flex items-center gap-2">
                            <!-- <UButton
                                v-if="message.model"
                                icon="i-lucide-box"
                                size="xs"
                                color="neutral"
                                variant="soft"
                            >
                                {{ message.model.model }}
                            </UButton> -->
                            <TimeDisplay
                                v-if="message.createdAt"
                                :datetime="message.createdAt"
                                mode="datetime"
                                class="text-muted-foreground text-xs"
                            />
                        </div>
                    </div>
                </ChatBubble>

                <!-- 用户消息的复制按钮 -->
                <div v-if="message.role === 'user'" class="mt-1 flex items-center gap-2">
                    <TimeDisplay
                        v-if="message.createdAt"
                        :datetime="message.createdAt"
                        mode="datetime"
                        class="text-muted-foreground text-xs"
                    />

                    <ProButtonCopy
                        :content="message.content"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
