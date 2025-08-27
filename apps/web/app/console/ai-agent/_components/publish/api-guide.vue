<script setup lang="ts">
import { computed, ref } from "vue";

import type { Agent } from "@/models/ai-agent";

const props = defineProps<{
    agent?: Agent;
}>();

const { t } = useI18n();

const baseUrl = computed(() => import.meta.env.VITE_APP_BASE_URL);

// API接口定义
const apiEndpoints = computed(() => [
    {
        method: "POST",
        url: `/consoleapi/v1/chat`,
        title: t("console-ai-agent.publish.normalChatAPI"),
        description: t("console-ai-agent.publish.normalChatAPIDesc"),
        color: "success",
        requestExample: {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            body: {
                messages: [
                    {
                        role: "user",
                        content: "你好",
                    },
                ],
                responseMode: "blocking",
            },
        },
        responseExample: {
            conversationId: "uuid-string",
            response: "智能体的回复内容",
            responseTime: 1500,
            tokenUsage: {
                totalTokens: 150,
                promptTokens: 50,
                completionTokens: 100,
            },
            suggestions: ["建议问题1", "建议问题2"],
            referenceSources: [],
        },
    },
    {
        method: "POST",
        url: `/consoleapi/v1/chat`,
        title: t("console-ai-agent.publish.streamChatAPI"),
        description: t("console-ai-agent.publish.streamChatAPIDesc"),
        color: "info",
        requestExample: {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            body: {
                messages: [
                    {
                        role: "user",
                        content: "你好",
                    },
                ],
                responseMode: "streaming",
            },
        },
        responseExample: {
            note: "流式响应，通过 Server-Sent Events 返回",
            format: 'data: {"type":"chunk","content":"智能体回复的片段"}\ndata: [DONE]',
        },
    },
    {
        method: "GET",
        url: `/consoleapi/v1/conversations`,
        title: t("console-ai-agent.publish.getConversationsAPI"),
        description: t("console-ai-agent.publish.getConversationsAPIDesc"),
        color: "neutral",
        requestExample: {
            headers: {
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            params: {
                page: 1,
                pageSize: 10,
            },
        },
        responseExample: {
            data: [
                {
                    id: "conversation-uuid",
                    title: "对话标题",
                    summary: "对话摘要",
                    createdAt: "2024-01-01T00:00:00Z",
                    updatedAt: "2024-01-01T00:00:00Z",
                    messageCount: 10,
                },
            ],
            pagination: {
                page: 1,
                pageSize: 10,
                total: 100,
                totalPages: 10,
            },
        },
    },
    {
        method: "GET",
        url: `/consoleapi/v1/conversations/{id}/messages`,
        title: t("console-ai-agent.publish.getMessagesAPI"),
        description: t("console-ai-agent.publish.getMessagesAPIDesc"),
        color: "neutral",
        requestExample: {
            headers: {
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            params: {
                page: 1,
                pageSize: 50,
            },
        },
        responseExample: {
            data: [
                {
                    id: "message-uuid",
                    role: "user",
                    content: "用户消息内容",
                    createdAt: "2024-01-01T00:00:00Z",
                },
                {
                    id: "message-uuid",
                    role: "assistant",
                    content: "智能体回复内容",
                    createdAt: "2024-01-01T00:00:00Z",
                    tokenUsage: {
                        totalTokens: 150,
                        promptTokens: 50,
                        completionTokens: 100,
                    },
                },
            ],
            pagination: {
                page: 1,
                pageSize: 50,
                total: 20,
                totalPages: 1,
            },
        },
    },
    {
        method: "PUT",
        url: `/consoleapi/v1/conversations/{id}`,
        title: t("console-ai-agent.publish.updateConversationAPI"),
        description: t("console-ai-agent.publish.updateConversationAPIDesc"),
        color: "warning",
        requestExample: {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            body: {
                title: "新的对话标题",
            },
        },
        responseExample: {
            message: "对话记录更新成功",
        },
    },
    {
        method: "DELETE",
        url: `/consoleapi/v1/conversations/{id}`,
        title: t("console-ai-agent.publish.deleteConversationAPI"),
        description: t("console-ai-agent.publish.deleteConversationAPIDesc"),
        color: "error",
        requestExample: {
            headers: {
                Authorization: `Bearer ${props.agent?.apiKey || "{API_KEY}"}`,
            },
            note: t("console-ai-agent.publish.deleteNoBody"),
        },
        responseExample: {
            message: "对话记录删除成功",
        },
    },
]);

// 生成cURL示例
const generateCurlExample = (api: any) => {
    let curl = `curl -X ${api.method} "${baseUrl.value}${api.url}"`;

    if (api.requestExample.headers) {
        Object.entries(api.requestExample.headers).forEach(([key, value]) => {
            curl += ` \\\n  -H "${key}: ${value}"`;
        });
    }

    if (api.requestExample.body && api.method !== "GET") {
        curl += ` \\\n  -d '${JSON.stringify(api.requestExample.body, null, 2)}'`;
    }

    if (api.requestExample.params && api.method === "GET") {
        const params = new URLSearchParams(api.requestExample.params).toString();
        curl = curl.replace(api.url, `${api.url}?${params}`);
    }

    return curl;
};

// 复制代码
const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
};
</script>

<template>
    <div class="space-y-4">
        <div>
            <h3 class="mb-2 text-lg font-medium">{{ $t("console-ai-agent.publish.apiGuide") }}</h3>
            <p class="text-muted-foreground text-sm">
                {{ $t("console-ai-agent.publish.apiGuideDesc") }}
            </p>
        </div>

        <div v-if="!agent?.isPublished" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-lock" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("console-ai-agent.publish.unpublished") }}</h4>
            <p class="text-muted-foreground text-sm">
                {{ $t("console-ai-agent.publish.unpublishedDesc3") }}
            </p>
        </div>

        <div v-else-if="!agent?.apiKey" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-key" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">
                {{ $t("console-ai-agent.publish.apiKeyNotGenerated") }}
            </h4>
            <p class="text-muted-foreground text-sm">
                {{ $t("console-ai-agent.publish.apiKeyNotGeneratedDesc") }}
            </p>
        </div>

        <div v-else class="space-y-6">
            <div class="space-y-4">
                <h4 class="font-medium">{{ $t("console-ai-agent.publish.basicInfo") }}</h4>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <label class="text-sm font-medium">API Base URL</label>
                        <div class="flex gap-2">
                            <UInput :value="baseUrl" readonly class="flex-1" />
                            <UButton
                                icon="i-lucide-copy"
                                variant="outline"
                                @click="copyCode(baseUrl)"
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium">API Key</label>
                        <div class="flex gap-2">
                            <UInput :value="agent.apiKey" readonly class="flex-1" />
                            <UButton
                                icon="i-lucide-copy"
                                variant="outline"
                                @click="copyCode(agent.apiKey)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <h4 class="font-medium">
                    {{ $t("console-ai-agent.publish.availableEndpoints") }}
                </h4>
                <div class="space-y-4">
                    <details
                        v-for="api in apiEndpoints"
                        :key="api.url"
                        class="border-border rounded-lg border"
                    >
                        <summary
                            class="hover:bg-accent/50 cursor-pointer list-none p-4 transition-colors"
                        >
                            <div class="mb-4 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <UBadge :color="api.color as any" variant="soft">
                                        {{ api.method }}
                                    </UBadge>
                                    <span class="text-sm font-medium">{{ api.title }}</span>
                                </div>
                                <UIcon
                                    name="i-lucide-chevron-down"
                                    class="text-muted-foreground size-4"
                                />
                            </div>
                            <code
                                class="text-muted-foreground bg-accent rounded-xs px-4 py-2 text-xs"
                            >
                                {{ api.url }}
                            </code>
                            <p class="text-muted-foreground mt-4 text-sm">
                                {{ api.description }}
                            </p>
                        </summary>

                        <div class="border-border border-t p-4">
                            <div class="space-y-6">
                                <!-- 请求示例 -->
                                <div>
                                    <div class="mb-2 flex items-center justify-between">
                                        <h5 class="text-sm font-medium">
                                            {{ $t("console-ai-agent.publish.requestExample") }}
                                        </h5>
                                        <UButton
                                            icon="i-lucide-copy"
                                            size="sm"
                                            variant="outline"
                                            @click="
                                                copyCode(
                                                    JSON.stringify(api.requestExample, null, 2),
                                                )
                                            "
                                        >
                                            {{ $t("console-ai-agent.publish.copy") }}
                                        </UButton>
                                    </div>
                                    <div class="bg-muted rounded-lg p-3">
                                        <pre
                                            class="overflow-auto text-xs"
                                        ><code>{{ JSON.stringify(api.requestExample, null, 2) }}</code></pre>
                                    </div>
                                </div>

                                <!-- 响应示例 -->
                                <div>
                                    <div class="mb-2 flex items-center justify-between">
                                        <h5 class="text-sm font-medium">
                                            {{ $t("console-ai-agent.publish.responseExample") }}
                                        </h5>
                                        <UButton
                                            icon="i-lucide-copy"
                                            size="sm"
                                            variant="outline"
                                            @click="
                                                copyCode(
                                                    JSON.stringify(api.responseExample, null, 2),
                                                )
                                            "
                                        >
                                            {{ $t("console-ai-agent.publish.copy") }}
                                        </UButton>
                                    </div>
                                    <div class="bg-muted rounded-lg p-3">
                                        <pre
                                            class="overflow-auto text-xs"
                                        ><code>{{ JSON.stringify(api.responseExample, null, 2) }}</code></pre>
                                    </div>
                                </div>

                                <!-- cURL 示例 -->
                                <div>
                                    <div class="mb-2 flex items-center justify-between">
                                        <h5 class="text-sm font-medium">
                                            {{ $t("console-ai-agent.publish.curlExample") }}
                                        </h5>
                                        <UButton
                                            icon="i-lucide-copy"
                                            size="sm"
                                            variant="outline"
                                            @click="copyCode(generateCurlExample(api))"
                                        >
                                            {{ $t("console-ai-agent.publish.copy") }}
                                        </UButton>
                                    </div>
                                    <div class="bg-muted rounded-lg p-3">
                                        <pre
                                            class="overflow-auto text-xs"
                                        ><code>{{ generateCurlExample(api) }}</code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    </div>
</template>
