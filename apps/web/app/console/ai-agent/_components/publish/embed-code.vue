<script setup lang="ts">
import { computed, ref } from "vue";

import type { Agent } from "@/models/ai-agent";

interface Props {
    agent?: Agent;
}

const props = defineProps<Props>();

const activeTab = ref("iframe");

const publishUrl = computed(() => {
    if (!props.agent?.publishToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/agent/${props.agent.publishToken}`;
});

const iframeCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- FastbuildAI 智能体嵌入代码 -->
<iframe
  src="${publishUrl.value}?embed=true"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
</iframe>`;
});

const jsCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- 使用 JavaScript SDK -->
<div id="chatbot-container"></div>
<script>
  window.FastbuildAI = {
    init: function(options) {
      const iframe = document.createElement('iframe');
      iframe.src = '${publishUrl.value}?embed=true&sdk=true';
      iframe.width = options.width || '400px';
      iframe.height = options.height || '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '10px';
      iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';

      const container = document.querySelector(options.container);
      if (container) {
        container.appendChild(iframe);
      }
    }
  };

  // 初始化智能体
  FastbuildAI.init({
    container: '#chatbot-container',
    width: '400px',
    height: '600px'
  });
<\\/script>`;
});

const wordpressCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- WordPress 短代码 -->
[fastbuildai_chatbot url="${publishUrl.value}" width="400" height="600"]

<!-- 或者直接使用 HTML -->
<div style="width: 400px; height: 600px;">
  <iframe
    src="${publishUrl.value}?embed=true"
    width="100%"
    height="100%"
    frameborder="0"
    style="border-radius: 10px;">
  </iframe>
</div>`;
});

const tabs = [
    { value: "iframe", label: "iframe 嵌入", icon: "i-lucide-code" },
    { value: "javascript", label: "JavaScript SDK", icon: "i-lucide-braces" },
    { value: "wordpress", label: "WordPress", icon: "i-lucide-wordpress" },
];

const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        // 这里可以添加复制成功的提示
    });
};
</script>

<template>
    <div class="space-y-4">
        <div>
            <h3 class="mb-2 text-lg font-medium">{{ $t("console-ai-agent.publish.embedCode") }}</h3>
            <p class="text-muted-foreground text-sm">
                {{ $t("console-ai-agent.publish.embedCodeDesc") }}
            </p>
        </div>

        <div v-if="!agent?.isPublished" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-lock" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("console-ai-agent.publish.unpublished") }}</h4>
            <p class="text-muted-foreground text-sm">
                {{ $t("console-ai-agent.publish.unpublishedDesc2") }}
            </p>
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

            <!-- 代码内容 -->
            <div class="space-y-4">
                <!-- iframe 嵌入 -->
                <div v-if="activeTab === 'iframe'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium">{{ $t("console-ai-agent.publish.iframeCode") }}</h4>
                        <UButton
                            icon="i-lucide-copy"
                            variant="outline"
                            size="sm"
                            @click="copyCode(iframeCode)"
                        >
                            {{ $t("console-common.copy") }}
                        </UButton>
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ iframeCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("console-ai-agent.publish.iframeCodeDesc1") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.iframeCodeDesc2") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.iframeCodeDesc3") }}</p>
                    </div>
                </div>

                <!-- JavaScript SDK -->
                <div v-if="activeTab === 'javascript'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium">JavaScript SDK</h4>
                        <UButton
                            icon="i-lucide-copy"
                            variant="outline"
                            size="sm"
                            @click="copyCode(jsCode)"
                        >
                            {{ $t("console-common.copy") }}
                        </UButton>
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ jsCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("console-ai-agent.publish.javascriptCodeDesc1") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.javascriptCodeDesc2") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.javascriptCodeDesc3") }}</p>
                    </div>
                </div>

                <!-- WordPress -->
                <div v-if="activeTab === 'wordpress'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium">
                            {{ $t("console-ai-agent.publish.wordpressCode") }}
                        </h4>
                        <UButton
                            icon="i-lucide-copy"
                            variant="outline"
                            size="sm"
                            @click="copyCode(wordpressCode)"
                        >
                            {{ $t("console-common.copy") }}
                        </UButton>
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ wordpressCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("console-ai-agent.publish.wordpressCodeDesc1") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.wordpressCodeDesc2") }}</p>
                        <p>• {{ $t("console-ai-agent.publish.wordpressCodeDesc3") }}</p>
                    </div>
                </div>
            </div>

            <!-- 预览 -->
            <div class="space-y-3">
                <h4 class="font-medium">{{ $t("console-ai-agent.publish.previewEffect") }}</h4>
                <div class="border-border flex justify-center rounded-lg border p-6">
                    <div
                        class="border-border overflow-hidden rounded-lg border shadow-lg"
                        style="width: 400px; height: 750px"
                    >
                        <iframe
                            :src="`${publishUrl}?embed=true&preview=true`"
                            width="100%"
                            height="100%"
                            frameborder="0"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
