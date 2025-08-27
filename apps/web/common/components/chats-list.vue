<script setup lang="ts">
import { ProScrollArea, useModal } from "@fastbuildai/ui";
import type { DropdownMenuItem } from "@nuxt/ui";
import { h, markRaw, ref } from "vue";

import { useControlsStore } from "@/common/stores/controls";
import { groupConversationsByDate, type GroupedConversations } from "@/common/utils";
import type { AiConversation } from "@/models/ai-conversation";
import {
    apiDeleteAiConversation,
    apiGetAiConversationList,
    apiUpdateAiConversation,
} from "@/services/web/ai-conversation";

const { t } = useI18n();
const controlsStore = useControlsStore();

const { data: chats, pending: loading } = await useAsyncData(
    "chats",
    () => apiGetAiConversationList({ page: 1, pageSize: 50 }),
    {
        lazy: import.meta.server,
    },
);

const route = useRoute();

// 响应式状态 - 修复路由参数获取
const currentChatId = computed<string>(() => {
    // 从路由参数中获取 chat id
    if (route.name === "chat-id") {
        return route.params.id as string;
    }
    return "";
});

const UInput = resolveComponent("UInput");
const UFormField = resolveComponent("UFormField");

/**
 * 按日期分组的对话数据
 */
const groupedChats = computed<GroupedConversations<AiConversation>[]>(() => {
    if (!chats.value?.items?.length) {
        return [];
    }
    return groupConversationsByDate(
        chats.value.items as unknown as AiConversation[],
        "updatedAt",
        t,
    );
});

/**
 * 打开编辑对话框
 */
async function openEditModal(category: AiConversation): Promise<void> {
    const editName = ref(category.title);

    try {
        const EditChatForm = markRaw({
            setup() {
                return () =>
                    h("div", { class: "py-2" }, [
                        h(
                            UFormField,
                            {
                                label: t("common.chat.chatTitleLabel"),
                                size: "lg",
                                required: true,
                                error: !editName.value.trim()
                                    ? t("common.chat.chatTitleRequired")
                                    : "",
                            },
                            {
                                default: () =>
                                    h(UInput, {
                                        modelValue: editName.value,
                                        "onUpdate:modelValue": (value: string) => {
                                            editName.value = value;
                                        },
                                        placeholder: t("common.chat.chatTitlePlaceholder"),
                                        maxlength: 50,
                                        class: "w-full",
                                        onKeyup: (e: KeyboardEvent) => {
                                            if (e.key === "Enter" && editName.value.trim()) {
                                                // 这里可以处理回车确认，但由于 useModal 的限制，暂时不处理
                                            }
                                        },
                                    }),
                            },
                        ),
                    ]);
            },
        });

        await useModal({
            title: t("common.chat.editChatTitle"),
            content: EditChatForm,
            confirmText: t("console-common.save"),
            cancelText: t("console-common.cancel"),
            color: "primary",
            ui: {
                content: "!w-sm",
            },
        });

        // 用户点击确定后的处理
        if (editName.value.trim() && editName.value !== category.title) {
            await apiUpdateAiConversation(category.id, {
                title: editName.value,
            });
            refreshNuxtData("chats");
            refreshNuxtData(`chat-detail-${category.id}`);
        }
    } catch (error) {
        // 用户取消操作或其他错误
        console.log("用户取消编辑操作:", error);
    }
}

/**
 * 处理删除对话
 */
async function handleDeleteCategory(category: AiConversation): Promise<void> {
    try {
        const confirmed = await useModal({
            color: "error",
            title: t("common.chat.confirmDelete"),
            content: t("common.chat.confirmDeleteMessage"),
            confirmText: t("common.chat.confirmDeleteAction"),
            cancelText: t("console-common.cancel"),
            ui: {
                content: "!w-sm",
            },
        });

        if (confirmed) {
            await apiDeleteAiConversation(category.id);
            // 刷新数据
            await refreshNuxtData("chats");
        }
        navigateTo("/");
    } catch (error) {
        // 用户取消操作或其他错误
        console.log("用户取消删除操作或删除失败:", error);
    }
}

/**
 * 处理分类选择
 */
function handleCategorySelect(category: AiConversation): void {
    navigateTo(`/chat/${category.id}`);
}

/**
 * 处理新建对话
 */
function handleNewChat(): void {
    navigateTo("/");
}

/**
 * 处理键盘事件（用于可访问性）
 */
function handleKeyDown(event: KeyboardEvent, category: AiConversation): void {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCategorySelect(category);
    }
}

/**
 * 构建下拉菜单项
 */
const getDropdownItems = (category: AiConversation): DropdownMenuItem[] => [
    {
        label: t("console-common.edit"),
        color: "primary",
        icon: "i-lucide-pencil",
        onSelect: () => openEditModal(category),
    },
    {
        label: t("console-common.delete"),
        color: "error",
        icon: "i-lucide-trash",
        onSelect: () => handleDeleteCategory(category),
    },
];

defineOptions({ inheritAttrs: false });
</script>

<template>
    <div class="relative h-full flex-1">
        <!-- 主面板区域 -->
        <transition name="width">
            <!-- 内容固定宽度容器，避免文字重排 -->
            <div
                class="flex h-full min-h-0 w-[240px] flex-col"
                :class="[
                    controlsStore.chatSidebarVisible ? 'w-0 opacity-0' : 'w-[240px] opacity-100',
                ]"
                v-show="!controlsStore.chatSidebarVisible"
            >
                <!-- 新建对话按钮 & 折叠按钮 -->
                <div class="flex items-center gap-2 p-4 pt-2">
                    <!-- 新建对话 -->
                    <UButton
                        icon="i-lucide-sparkles"
                        size="lg"
                        class="flex-1"
                        @click="handleNewChat"
                    >
                        {{ t("common.chat.newChat") }}
                    </UButton>

                    <!-- 折叠侧边栏 -->
                    <UButton
                        v-if="!controlsStore.chatSidebarVisible"
                        icon="i-lucide-panel-left"
                        variant="soft"
                        size="lg"
                        class="flex-none p-2"
                        @click="controlsStore.toggleChatSidebar"
                    >
                        <span class="sr-only">{{ t("common.chat.collapseSidebar") }}</span>
                    </UButton>
                </div>

                <!-- 空状态 -->
                <div
                    v-if="!groupedChats.length && !loading"
                    class="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm"
                >
                    <div class="mb-2">
                        <UIcon name="i-lucide-message-circle" size="lg" class="text-gray-400" />
                    </div>
                    <p>{{ t("common.chat.noChats") }}</p>
                    <p class="text-xs">{{ t("common.chat.noChatsSubtitle") }}</p>
                </div>

                <!-- 对话分类列表 -->
                <ProScrollArea v-else class="grid h-full w-full space-y-1 px-4" :shadow="false">
                    <div class="flex flex-col gap-4">
                        <!-- 按日期分组显示 -->
                        <div
                            v-for="group in groupedChats"
                            :key="group.key"
                            class="flex flex-col gap-2"
                        >
                            <!-- 分组标题 -->
                            <div class="text-muted-foreground px-2 py-1 text-xs font-medium">
                                {{ group.label }}
                            </div>

                            <!-- 分组内的对话项 -->
                            <div class="flex flex-col gap-1">
                                <div
                                    v-for="category in group.items"
                                    :key="category.id"
                                    class="group relative"
                                >
                                    <UButton
                                        :label="category.title"
                                        :ui="{
                                            base: 'flex justify-between w-full gap-2 cursor-pointer pr-10 relative w-52',
                                        }"
                                        :variant="category.id === currentChatId ? 'soft' : 'ghost'"
                                        :color="
                                            category.id === currentChatId ? 'primary' : 'neutral'
                                        "
                                        @click="handleCategorySelect(category)"
                                        @keydown="
                                            (event: KeyboardEvent) => handleKeyDown(event, category)
                                        "
                                    >
                                        <span class="block flex-1 truncate text-left">
                                            {{ category.title || "new Chat" }}
                                        </span>
                                    </UButton>

                                    <!-- 操作菜单 -->
                                    <UDropdownMenu
                                        :items="[getDropdownItems(category)]"
                                        :ui="{
                                            content: 'w-32',
                                            group: 'flex flex-col gap-1 p-2',
                                            itemLeadingIcon: 'size-4',
                                        }"
                                        :content="{ side: 'right', align: 'start' }"
                                    >
                                        <UIcon
                                            name="i-lucide-ellipsis"
                                            :size="14"
                                            class="absolute top-1/2 right-3 z-10 h-8 -translate-y-1/2 cursor-pointer px-2.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                                            :class="{
                                                'opacity-100': category.id === currentChatId,
                                            }"
                                            @click.stop
                                        />
                                    </UDropdownMenu>
                                </div>
                            </div>
                        </div>

                        <!-- 加载状态 -->
                        <div
                            v-if="!groupedChats.length && loading"
                            class="flex flex-col gap-4 py-4"
                        >
                            <div
                                v-for="groupIndex in 3"
                                :key="`group-${groupIndex}`"
                                class="flex flex-col gap-2"
                            >
                                <div class="px-2 py-1">
                                    <USkeleton class="h-4 w-16" />
                                </div>

                                <div class="flex flex-col gap-1">
                                    <USkeleton
                                        v-for="itemIndex in groupIndex === 1
                                            ? 3
                                            : groupIndex === 2
                                              ? 2
                                              : 1"
                                        :key="`item-${groupIndex}-${itemIndex}`"
                                        class="h-10 w-full rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ProScrollArea>
            </div>
        </transition>

        <!-- 展开侧边栏按钮（页面左上角） -->
        <UButton
            v-if="controlsStore.chatSidebarVisible"
            icon="i-lucide-panel-right"
            variant="ghost"
            size="lg"
            class="absolute top-4 left-4 z-50 p-2"
            @click="controlsStore.toggleChatSidebar"
        >
            <span class="sr-only">{{ t("common.chat.expandSidebar") }}</span>
        </UButton>
    </div>
</template>

<style scoped>
.width-enter-active,
.width-leave-active {
    transition:
        width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.3s ease;
    overflow: hidden;
    white-space: nowrap;
}

.width-enter-from,
.width-leave-to {
    width: 0;
    opacity: 0;
}
</style>
@/common/stores/controls
