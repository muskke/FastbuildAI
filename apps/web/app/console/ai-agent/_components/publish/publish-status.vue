<script setup lang="ts">
import { computed } from "vue";

import type { Agent } from "@/models/ai-agent";

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
                    :class="isPublished ? 'text-success' : 'text-muted-foreground'"
                    class="size-5"
                />
                <div>
                    <h3 class="font-medium">
                        {{ isPublished ? $t("console-ai-agent.publish.published") : $t("console-ai-agent.publish.unpublished") }}
                    </h3>
                    <p class="text-muted-foreground text-sm">
                        {{ isPublished ? $t("console-ai-agent.publish.publishedDesc") : $t("console-ai-agent.publish.unpublishedDesc") }}
                    </p>
                </div>
            </div>
            <UBadge :color="isPublished ? 'success' : 'neutral'" variant="soft">
                {{ isPublished ? $t("console-ai-agent.publish.published") : $t("console-ai-agent.publish.unpublished") }}
            </UBadge>
        </div>

        <!-- 发布信息 -->
        <div v-if="isPublished" class="space-y-3">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <!-- 公开链接 -->
                <div class="space-y-2">
                    <UFormField :label="$t('console-ai-agent.publish.publicAccessLink')" :ui="{ container: 'flex items-center gap-2' }">
                        <UInput
                            :value="publishUrl"
                            readonly
                            class="flex-1"
                            :placeholder="$t('console-ai-agent.publish.publicAccessLinkPlaceholder')"
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
                    <UFormField :label="$t('console-ai-agent.publish.apiKey')" :ui="{ container: 'flex items-center gap-2' }">
                        <UInput
                            :value="agent?.apiKey ? '••••••••••••••••' : ''"
                            readonly
                            class="flex-1"
                            :placeholder="$t('console-ai-agent.publish.apiKeyPlaceholder')"
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
                        <div class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.accessUser") }}</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold">-</div>
                        <div class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.todayAccess") }}</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold">-</div>
                        <div class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.totalDialog") }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
