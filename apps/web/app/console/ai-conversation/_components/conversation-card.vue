<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { AiConversation } from "@/models/ai-conversation";

interface ConversationCardProps {
    conversation: AiConversation;
    selected?: boolean;
}

interface ConversationCardEmits {
    (e: "select", conversation: AiConversation, selected: boolean | "indeterminate"): void;
    (e: "delete", conversation: AiConversation): void;
    (e: "toggle-pin", conversationId: string, isPinned: boolean): void;
    (e: "view-detail", conversationId: string): void;
}

const props = withDefaults(defineProps<ConversationCardProps>(), {
    selected: false,
});

const emit = defineEmits<ConversationCardEmits>();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();

/**
 * 格式化消息数量
 */
function formatMessageCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}

/**
 * 处理选择状态变化
 */
function handleSelect(selected: boolean | "indeterminate") {
    if (typeof selected === "boolean") {
        emit("select", props.conversation, selected);
    }
}

/**
 * 处理卡片点击
 */
function handleCardClick() {
    emit("view-detail", props.conversation.id);
}

/**
 * 获取下拉菜单项
 */
const dropdownActions = computed(() => {
    const items = [];

    items.push({
        label: t("console-ai-conversation.actions.viewDetail"),
        icon: "i-lucide-eye",
        onSelect: () => emit("view-detail", props.conversation.id),
    });

    if (hasAccessByCodes(["ai-conversations:ai_conversation_delete"])) {
        items.push({
            label: t("console-common.delete"),
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => emit("delete", props.conversation),
        });
    }

    return items;
});
</script>

<template>
    <ProCard
        selectable
        clickable
        show-actions
        variant="outlined"
        class="cursor-pointer"
        :selected="selected"
        :actions="dropdownActions"
        @select="handleSelect"
        @click="handleCardClick"
    >
        <template #icon="{ groupHoverClass, selectedClass }">
            <UAvatar
                :src="conversation?.user?.avatar"
                :alt="conversation.title"
                size="3xl"
                class="bg-primary"
                :ui="{ root: 'rounded-lg', fallback: 'text-inverted' }"
                :class="[groupHoverClass, selectedClass]"
            />
        </template>

        <template #title>
            <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                <UTooltip :text="conversation.title" :delay="0">
                    <span class="mr-2 line-clamp-1">
                        {{ conversation.title }}
                    </span>
                </UTooltip>
            </h3>
        </template>

        <template #description>
            <!-- 用户信息 -->
            <div class="text-accent-foreground flex items-center gap-2 text-xs">
                <UIcon name="i-lucide-user" class="h-3 w-3" />
                <UTooltip :text="conversation?.user?.nickname" :delay="0">
                    <span class="mr-2 line-clamp-1">
                        {{ conversation?.user?.nickname }}
                    </span>
                </UTooltip>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-between gap-2">
                <!-- 消息统计 -->
                <div class="text-accent-foreground flex items-center gap-4 text-xs">
                    <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-message-circle" class="h-3 w-3" />
                        <span>{{ formatMessageCount(conversation.messageCount) }}</span>
                    </div>
                </div>

                <!-- 时间信息 -->
                <div class="text-muted-foreground flex items-center gap-1 text-xs">
                    <UIcon name="i-lucide-clock" class="h-3 w-3" />
                    <TimeDisplay :datetime="conversation.updatedAt" mode="relative" />
                </div>
            </div>
        </template>
    </ProCard>
</template>
