<script setup lang="ts">
import type { Agent } from "@buildingai/service/consoleapi/ai-agent";

const props = defineProps<{
    agent?: Agent;
}>();

const activeTab = shallowRef("iframe");

const publishUrl = computed(() => {
    if (!props.agent?.publishToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/agent/shared/${props.agent.publishToken}`;
});

const iframeCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- BuildingAI 智能体嵌入代码 -->
<iframe
  src="${publishUrl.value}?embed=true"
  width="400"
  height="600"
  frameborder="0"
	style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: fixed; right: 50px; bottom: 50px; z-index: 999;"
</iframe>`;
});

const jsCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- 使用 JavaScript SDK -->
<div id="chatbot-container"></div>
<script>
  window.BuildingAI = {
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
  BuildingAI.init({
    container: '#chatbot-container',
    width: '400px',
    height: '600px'
  });
<\\/script>`;
});

const wordpressCode = computed(() => {
    if (!publishUrl.value) return "";
    return `<!-- WordPress 短代码 -->
[buildingai_chatbot url="${publishUrl.value}" width="400" height="600"]

<!-- 或者直接使用 HTML -->
<div style="width: 400px; height: 600px;">
  <iframe
    src="${publishUrl.value}?embed=true"
    width="100%"
    height="100%"
    frameborder="0"
	style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: fixed; right: 50px; bottom: 50px; z-index: 999;"
  </iframe>
</div>`;
});

const tabs = [
    { value: "iframe", label: "iframe 嵌入", icon: "i-lucide-code" },
    { value: "javascript", label: "JavaScript SDK", icon: "i-lucide-braces" },
    { value: "wordpress", label: "WordPress", icon: "i-lucide-wordpress" },
];
</script>

<template>
    <div class="space-y-4">
        <div>
            <h3 class="mb-2 text-lg font-medium">{{ $t("ai-agent.backend.publish.embedCode") }}</h3>
            <p class="text-muted-foreground text-sm">
                {{ $t("ai-agent.backend.publish.embedCodeDesc") }}
            </p>
        </div>

        <div v-if="!agent?.isPublished" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-lock" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("ai-agent.backend.publish.unpublished") }}</h4>
            <p class="text-muted-foreground text-sm">
                {{ $t("ai-agent.backend.publish.unpublishedDesc2") }}
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
                        <h4 class="font-medium">{{ $t("ai-agent.backend.publish.iframeCode") }}</h4>
                        <BdButtonCopy
                            :content="iframeCode"
                            variant="outline"
                            size="sm"
                            :copiedText="$t('console-common.messages.copySuccess')"
                            :default-text="$t('console-common.copy')"
                        />
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ iframeCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("ai-agent.backend.publish.iframeCodeDesc1") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.iframeCodeDesc2") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.iframeCodeDesc3") }}</p>
                    </div>
                </div>

                <!-- JavaScript SDK -->
                <div v-if="activeTab === 'javascript'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium">JavaScript SDK</h4>
                        <BdButtonCopy
                            :content="jsCode"
                            variant="outline"
                            size="sm"
                            :copiedText="$t('console-common.messages.copySuccess')"
                            :default-text="$t('console-common.copy')"
                        />
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ jsCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("ai-agent.backend.publish.javascriptCodeDesc1") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.javascriptCodeDesc2") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.javascriptCodeDesc3") }}</p>
                    </div>
                </div>

                <!-- WordPress -->
                <div v-if="activeTab === 'wordpress'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium">
                            {{ $t("ai-agent.backend.publish.wordpressCode") }}
                        </h4>
                        <BdButtonCopy
                            :content="wordpressCode"
                            variant="outline"
                            size="sm"
                            :copiedText="$t('console-common.messages.copySuccess')"
                            :default-text="$t('console-common.copy')"
                        />
                    </div>
                    <div class="relative">
                        <pre
                            class="bg-muted overflow-auto rounded-lg p-4 text-sm"
                        ><code>{{ wordpressCode }}</code></pre>
                    </div>
                    <div class="text-muted-foreground text-xs">
                        <p>• {{ $t("ai-agent.backend.publish.wordpressCodeDesc1") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.wordpressCodeDesc2") }}</p>
                        <p>• {{ $t("ai-agent.backend.publish.wordpressCodeDesc3") }}</p>
                    </div>
                </div>
            </div>

            <!-- 预览 -->
            <div class="space-y-3">
                <h4 class="font-medium">{{ $t("ai-agent.backend.publish.previewEffect") }}</h4>
                <div class="border-border flex justify-center rounded-lg border p-6">
                    <div
                        class="border-border overflow-hidden rounded-lg border shadow-lg"
                        style="width: 100%; height: 750px"
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
