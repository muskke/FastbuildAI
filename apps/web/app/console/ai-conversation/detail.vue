<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { ProInfiniteScroll, ProMarkdown, ProModal } from "@fastbuildai/ui";
import { onMounted, ref } from "vue";

import type { AiConversation, AiMessage } from "@/models/ai-conversation";
import {
    apiGetConversationDetail,
    apiGetConversationMessages,
} from "@/services/console/ai-conversation";

const props = defineProps<{
    conversationId: string;
}>();

const emits = defineEmits<{
    (e: "close"): void;
}>();

const { t } = useI18n();
const toast = useMessage();

const conversation = ref<AiConversation | null>(null);
const messages = ref<AiMessage[]>([]);
const hasMore = ref<boolean>(true);
const pagingQuery = reactive({
    page: 0,
    pageSize: 15,
});

/**
 * 获取对话详情
 */
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        conversation.value = await apiGetConversationDetail(props.conversationId);
    } catch (error) {
        console.error("获取对话详情失败:", error);
        toast.error(t("console-ai-conversation.fetch.detailFailed"));
    }
});

/**
 * 获取消息列表
 */
const { lockFn: fetchMessages, isLock: messagesLoading } = useLockFn(async () => {
    try {
        pagingQuery.page += 1;
        const result = await apiGetConversationMessages(props.conversationId, pagingQuery);

        const newMessages = result.items.reverse() as unknown as AiMessage[];
        messages.value.push(...newMessages);

        hasMore.value = result.total > messages.value.length;
    } catch (error) {
        console.error("获取消息列表失败:", error);
        toast.error(t("console-ai-conversation.fetch.messagesFailed"));
    }
});

/**
 * 获取消息角色显示文本
 */
function getRoleDisplay(
    role: string,
    model: { name: string } = { name: t("console-ai-conversation.roles.assistant") },
): string {
    const roleMap: Record<string, string> = {
        user: t("console-ai-conversation.roles.user"),
        assistant: model.name,
    };
    return roleMap[role] || role;
}

/** 获取消息角色样式 */
function getRoleStyle(role: string): string {
    const styleMap: Record<string, string> = {
        user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        assistant: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return styleMap[role] || "bg-gray-100 text-gray-800";
}

onMounted(async () => await Promise.all([fetchDetail(), fetchMessages()]));
</script>

<template>
    <ProModal
        :model-value="true"
        :dismissible="true"
        :title="$t('console-ai-conversation.detail.title')"
        :description="$t('console-ai-conversation.detail.description')"
        :ui="{
            content: 'max-w-4xl',
            body: 'max-h-[80vh] overflow-y-auto',
        }"
        @update:model-value="(value) => !value && emits('close')"
    >
        <div
            v-if="detailLoading && messagesLoading"
            class="flex items-center justify-center"
            style="height: 644px"
        >
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>

        <div v-else-if="conversation" class="space-y-6">
            <!-- 对话基本信息 -->
            <div class="bg-muted rounded-lg p-4">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label class="text-accent-foreground text-sm font-medium">{{
                            $t("console-ai-conversation.detail.conversationTitle")
                        }}</label>
                        <p class="text-secondary-foreground mt-1 text-sm">
                            {{ conversation.title }}
                        </p>
                    </div>
                    <div>
                        <label class="text-accent-foreground text-sm font-medium">{{
                            $t("console-ai-conversation.detail.user")
                        }}</label>
                        <p class="text-secondary-foreground mt-1 text-sm">
                            {{ conversation?.user?.nickname || conversation?.user?.username }}
                        </p>
                    </div>
                    <div>
                        <label class="text-accent-foreground text-sm font-medium">{{
                            $t("console-ai-conversation.detail.messageCount")
                        }}</label>
                        <p class="text-secondary-foreground mt-1 text-sm">
                            {{ conversation.messageCount }}
                        </p>
                    </div>
                    <div>
                        <label class="text-accent-foreground text-sm font-medium">{{
                            $t("console-ai-conversation.detail.createdAt")
                        }}</label>
                        <p class="text-secondary-foreground mt-1 text-sm">
                            <TimeDisplay :datetime="conversation.createdAt" mode="datetime" />
                        </p>
                    </div>
                </div>

                <!-- 状态标签 -->
                <div class="mt-3 flex gap-2">
                    <UBadge
                        v-if="conversation.isPinned"
                        color="warning"
                        size="sm"
                        icon="i-lucide-pin"
                    >
                        {{ $t("console-ai-conversation.detail.isPinned") }}
                    </UBadge>
                </div>
            </div>

            <!-- 消息列表 -->
            <div>
                <h3 class="mb-3 text-lg font-semibold">
                    {{ $t("console-ai-conversation.detail.messages") }} ({{ messages.length }})
                </h3>

                <div class="space-y-4">
                    <ProScrollArea class="h-full min-h-0 w-full">
                        <ProInfiniteScroll
                            :threshold="300"
                            :loading="messagesLoading"
                            :has-more="hasMore"
                            @load-more="fetchMessages"
                        >
                            <div
                                v-for="message in messages"
                                :key="message.id"
                                class="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                            >
                                <!-- 消息头部 -->
                                <div class="mb-2 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span
                                            :class="getRoleStyle(message.role)"
                                            class="rounded-full px-2 py-1 text-xs font-medium"
                                        >
                                            {{ getRoleDisplay(message.role, message.model) }}
                                        </span>
                                        <TimeDisplay
                                            :datetime="message.createdAt as Date"
                                            mode="datetime"
                                            class="text-muted-foreground text-xs"
                                        />
                                    </div>

                                    <!-- 消息统计 -->
                                    <div
                                        class="text-muted-foreground flex items-center gap-4 text-xs"
                                    >
                                        <span v-if="message.tokens" class="flex items-center gap-1">
                                            <UIcon name="i-lucide-hash" class="h-3 w-3" />
                                            {{ t("console-ai-conversation.detail.total") }}
                                            {{ message.tokens.total_tokens }} tokens
                                        </span>
                                        <span v-if="message.cost" class="flex items-center gap-1">
                                            <UIcon name="i-lucide-dollar-sign" class="h-3 w-3" />
                                            ${{ message.cost.toFixed(6) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- 消息内容 -->
                                <div class="prose prose-sm dark:prose-invert max-w-none">
                                    <ProMarkdown :content="message.content" />
                                </div>

                                <!-- 元数据 -->
                                <div
                                    v-if="
                                        message.metadata && Object.keys(message.metadata).length > 0
                                    "
                                    class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-600"
                                >
                                    <details class="text-xs">
                                        <summary class="text-muted-foreground cursor-pointer">
                                            {{
                                                $t(
                                                    "console-console-ai-conversation.detail.metadata",
                                                )
                                            }}
                                        </summary>
                                        <pre class="text-accent-foreground mt-2">{{
                                            JSON.stringify(message.metadata, null, 2)
                                        }}</pre>
                                    </details>
                                </div>
                            </div>
                        </ProInfiniteScroll>
                    </ProScrollArea>
                </div>
            </div>
        </div>

        <div v-else class="py-8 text-center">
            <p class="text-muted-foreground">
                {{ $t("console-ai-conversation.detail.notFound") }}
            </p>
        </div>

        <template #footer>
            <div class="flex justify-end">
                <UButton color="neutral" variant="soft" @click="emits('close')">
                    {{ $t("console-common.close") }}
                </UButton>
            </div>
        </template>
    </ProModal>
</template>
