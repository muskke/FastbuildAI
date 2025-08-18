<script setup lang="ts">
import { computed, ref } from "vue";

import type { Agent } from "@/models/ai-agent";

const props = defineProps<{
    agent?: Agent;
}>();

const { t } = useI18n();
const activeTab = ref("overview");

const baseUrl = computed(() => window.location.origin);

const curlExample = computed(() => {
    if (!props.agent?.apiKey) return "";
    return `curl -X POST "${baseUrl.value}/api/public-agent/chat?apiKey=${props.agent.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ]
  }'`;
});

const jsExample = computed(() => {
    if (!props.agent?.apiKey) return "";
    return `const response = await fetch('${baseUrl.value}/api/public-agent/chat?apiKey=${props.agent.apiKey}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: '你好'
      }
    ]
  })
});

const data = await response.json();
console.log(data);`;
});

const pythonExample = computed(() => {
    if (!props.agent?.apiKey) return "";
    return `import requests

url = f"{BASE_URL}/api/public-agent/chat"
headers = {
    "Content-Type": "application/json"
}
params = {
    "apiKey": "${props.agent.apiKey}"
}
data = {
    "messages": [
        {
            "role": "user",
            "content": "你好"
        }
    ]
}

response = requests.post(url, headers=headers, params=params, json=data)
result = response.json()
print(result)`;
});

const streamExample = computed(() => {
    if (!props.agent?.apiKey) return "";
    return `const response = await fetch('${baseUrl.value}/api/public-agent/chat/stream?apiKey=${props.agent.apiKey}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: '你好'
      }
    ]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log(chunk);
}`;
});

const tabs = [
    { value: "overview", label: t("console-ai-agent.publish.apiOverview"), icon: "i-lucide-book-open" },
    { value: "curl", label: "cURL", icon: "i-lucide-terminal" },
    { value: "javascript", label: "JavaScript", icon: "i-lucide-braces" },
    { value: "python", label: "Python", icon: "i-lucide-snake" },
    { value: "stream", label: t("console-ai-agent.publish.streamChat"), icon: "i-lucide-zap" },
];

const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
};
</script>

<template>
    <div class="space-y-4">
        <div>
            <h3 class="mb-2 text-lg font-medium">{{ $t("console-ai-agent.publish.apiGuide") }}</h3>
            <p class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.apiGuideDesc") }}</p>
        </div>

        <div v-if="!agent?.isPublished" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-lock" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("console-ai-agent.publish.unpublished") }}</h4>
            <p class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.unpublishedDesc3") }}</p>
        </div>

        <div v-else-if="!agent?.apiKey" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-key" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("console-ai-agent.publish.apiKeyNotGenerated") }}</h4>
            <p class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.apiKeyNotGeneratedDesc") }}</p>
        </div>

        <div v-else class="space-y-4">
            <!-- 标签页 -->
            <div class="flex border-b">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    :class="[
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                        activeTab === tab.value
                            ? 'border-primary text-primary border-b-2'
                            : 'text-muted-foreground hover:text-foreground',
                    ]"
                    @click="activeTab = tab.value"
                >
                    <UIcon :name="tab.icon" class="size-4" />
                    {{ tab.label }}
                </button>
            </div>

            <!-- API概述 -->
            <div v-if="activeTab === 'overview'" class="space-y-6">
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
                        <div class="space-y-2">
                            <div class="text-sm font-medium">{{ $t("console-ai-agent.publish.apiEndpoints") }}</div>
                            <div class="space-y-1 text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="text-muted-foreground">{{ $t("console-ai-agent.publish.normalChat") }}</span>
                                    <code class="text-sm">/api/public-agent/chat</code>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-muted-foreground">{{ $t("console-ai-agent.publish.streamChat") }}</span>
                                    <code class="text-sm">/api/public-agent/chat/stream</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h4 class="font-medium">{{ $t("console-ai-agent.publish.availableEndpoints") }}</h4>
                    <div class="space-y-3">
                        <div class="border-border rounded-lg border p-4">
                            <div class="mb-2 flex items-center gap-2">
                                <UBadge color="success" variant="soft">POST</UBadge>
                                <code class="text-sm">/api/public-agent/chat</code>
                            </div>
                            <p class="text-muted-foreground text-sm">
                                {{ $t("console-ai-agent.publish.normalChatDesc") }}
                            </p>
                        </div>
                        <div class="border-border rounded-lg border p-4">
                            <div class="mb-2 flex items-center gap-2">
                                <UBadge color="info" variant="soft">POST</UBadge>
                                <code class="text-sm">/api/public-agent/chat/stream</code>
                            </div>
                            <p class="text-muted-foreground text-sm">
                                {{ $t("console-ai-agent.publish.streamChatDesc") }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h4 class="font-medium">{{ $t("console-ai-agent.publish.authenticationMethod") }}</h4>
                    <div class="border-border rounded-lg border p-4">
                        <p class="text-sm">
                            {{ $t("console-ai-agent.publish.authenticationMethodDesc") }}
                            <code class="bg-muted px-1">?apiKey=your_api_key</code>
                        </p>
                    </div>
                </div>
            </div>

            <!-- 代码示例 -->
            <div v-else class="space-y-4">
                <div class="flex items-center justify-between">
                    <h4 class="font-medium">
                        {{ tabs.find((t) => t.value === activeTab)?.label }} {{ $t("console-ai-agent.publish.example") }}
                    </h4>
                    <UButton
                        icon="i-lucide-copy"
                        variant="outline"
                        size="sm"
                        @click="
                            copyCode(
                                activeTab === 'curl'
                                    ? curlExample
                                    : activeTab === 'javascript'
                                      ? jsExample
                                      : activeTab === 'python'
                                        ? pythonExample
                                        : activeTab === 'stream'
                                          ? streamExample
                                          : '',
                            )
                        "
                    >
                        {{ $t("console-common.copy") }}
                    </UButton>
                </div>
                <div class="relative">
                    <pre class="bg-muted overflow-auto rounded-lg p-4 text-sm"><code>{{
                        activeTab === 'curl' ? curlExample :
                        activeTab === 'javascript' ? jsExample :
                        activeTab === 'python' ? pythonExample :
                        activeTab === 'stream' ? streamExample : ''
                    }}</code></pre>
                </div>
            </div>

            <!-- 响应格式说明 -->
            <div class="space-y-4">
                <h4 class="font-medium">{{ $t("console-ai-agent.publish.responseFormat") }}</h4>
                <div class="border-border rounded-lg border p-4">
                    <pre class="text-muted-foreground text-sm">
{
  "conversationId": "uuid-string",
  "response": "智能体的回复内容",
  "responseTime": 1500,
  "tokenUsage": {
    "totalTokens": 150,
    "promptTokens": 50,
    "completionTokens": 100
  },
  "suggestions": ["建议问题1", "建议问题2"],
  "referenceSources": [...]
}</pre
                    >
                </div>
            </div>
        </div>
    </div>
</template>
