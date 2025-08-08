<script setup lang="ts">
import { computed } from "vue";

import type { Agent } from "@/models/agent";

interface Props {
    agent?: Agent;
}

const props = defineProps<Props>();

const publishUrl = computed(() => {
    if (!props.agent?.publishToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/agent/${props.agent.publishToken}`;
});

const isPublished = computed(() => props.agent?.isPublished || false);

// 复制文本到剪贴板
const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
};

// 打开链接
const openLink = (url: string) => {
    window.open(url, "_blank");
};
</script>

<template>
    <div class="space-y-4">
        <!-- 发布状态 -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <UIcon
                    :name="isPublished ? 'i-lucide-globe' : 'i-lucide-globe-lock'"
                    :class="isPublished ? 'text-green-500' : 'text-gray-400'"
                    class="size-5"
                />
                <div>
                    <h3 class="font-medium">
                        {{ isPublished ? "已发布" : "未发布" }}
                    </h3>
                    <p class="text-muted-foreground text-sm">
                        {{ isPublished ? "智能体已公开可访问" : "智能体未公开发布" }}
                    </p>
                </div>
            </div>
            <UBadge :color="isPublished ? 'success' : 'neutral'" variant="soft">
                {{ isPublished ? "已发布" : "未发布" }}
            </UBadge>
        </div>

        <!-- 发布信息 -->
        <div v-if="isPublished" class="space-y-3">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <!-- 公开链接 -->
                <div class="space-y-2">
                    <UFormField label="公开访问链接" :ui="{ container: 'flex items-center gap-2' }">
                        <UInput
                            :value="publishUrl"
                            readonly
                            class="flex-1"
                            placeholder="未生成链接"
                        />
                        <UButton
                            v-if="publishUrl"
                            icon="i-lucide-copy"
                            variant="outline"
                            @click="copyText(publishUrl)"
                        />
                        <UButton
                            v-if="publishUrl"
                            icon="i-lucide-external-link"
                            variant="outline"
                            @click="openLink(publishUrl)"
                        />
                    </UFormField>
                </div>

                <!-- API密钥 -->
                <div class="space-y-2">
                    <UFormField label="API密钥" :ui="{ container: 'flex items-center gap-2' }">
                        <UInput
                            :value="agent?.apiKey ? '••••••••••••••••' : ''"
                            readonly
                            class="flex-1"
                            placeholder="未生成密钥"
                        />
                        <UButton
                            v-if="agent?.apiKey"
                            icon="i-lucide-copy"
                            variant="outline"
                            @click="copyText(agent.apiKey || '')"
                        />
                    </UFormField>
                </div>
            </div>

            <!-- 访问统计 -->
            <div class="border-border mt-4 rounded-lg border p-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold">{{ agent?.userCount || 0 }}</div>
                        <div class="text-muted-foreground text-sm">访问用户</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold">-</div>
                        <div class="text-muted-foreground text-sm">今日访问</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold">-</div>
                        <div class="text-muted-foreground text-sm">总对话数</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
