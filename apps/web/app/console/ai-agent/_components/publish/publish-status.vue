<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
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
const { copy } = useClipboard();

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
                        {{
                            isPublished
                                ? $t("console-ai-agent.publish.published")
                                : $t("console-ai-agent.publish.unpublished")
                        }}
                    </h3>
                    <p class="text-muted-foreground text-sm">
                        {{
                            isPublished
                                ? $t("console-ai-agent.publish.publishedDesc")
                                : $t("console-ai-agent.publish.unpublishedDesc")
                        }}
                    </p>
                </div>
            </div>
            <UBadge :color="isPublished ? 'success' : 'neutral'" variant="soft">
                {{
                    isPublished
                        ? $t("console-ai-agent.publish.published")
                        : $t("console-ai-agent.publish.unpublished")
                }}
            </UBadge>
        </div>

        <!-- 发布信息 -->
        <div v-if="isPublished" class="space-y-3">
            <div class="flex flex-col gap-4">
                <!-- 公开链接 -->
                <div class="space-y-2">
                    <UFormField
                        :label="$t('console-ai-agent.publish.publicAccessLink')"
                        :ui="{ container: 'flex items-center gap-2' }"
                    >
                        <UInput
                            :value="publishUrl"
                            readonly
                            class="flex-1"
                            :placeholder="
                                $t('console-ai-agent.publish.publicAccessLinkPlaceholder')
                            "
                        />
                        <UButton
                            v-if="publishUrl"
                            icon="i-lucide-copy"
                            variant="outline"
                            @click="copy(publishUrl)"
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
                    <UFormField
                        :label="$t('console-ai-agent.publish.apiKey')"
                        :ui="{ container: 'flex items-center gap-2' }"
                    >
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
                            @click="copy(agent.apiKey || '')"
                        />
                    </UFormField>
                </div>
            </div>
        </div>
    </div>
</template>
