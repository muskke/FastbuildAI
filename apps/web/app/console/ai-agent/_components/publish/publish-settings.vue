<script setup lang="ts">
import { reactive, ref, watch } from "vue";

import type { Agent } from "@/models/ai-agent";

interface Props {
    agent?: Agent;
}

interface Emits {
    (e: "update", config: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const config = reactive({
    allowOrigins: props.agent?.publishConfig?.allowOrigins || [],
    rateLimitPerMinute: props.agent?.publishConfig?.rateLimitPerMinute || 60,
    showBranding: props.agent?.publishConfig?.showBranding ?? true,
    allowDownloadHistory: props.agent?.publishConfig?.allowDownloadHistory ?? false,
});

const newOrigin = ref("");

// 监听配置变化
watch(
    config,
    (newConfig) => {
        emit("update", { ...newConfig });
    },
    { deep: true },
);

// 添加允许的域名
const addOrigin = () => {
    if (newOrigin.value.trim() && !config.allowOrigins.includes(newOrigin.value.trim())) {
        config.allowOrigins.push(newOrigin.value.trim());
        newOrigin.value = "";
    }
};

// 移除域名
const removeOrigin = (index: number) => {
    config.allowOrigins.splice(index, 1);
};

// 处理回车键添加域名
const handleOriginKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addOrigin();
    }
};
</script>

<template>
    <div class="space-y-6">
        <div>
            <h3 class="mb-2 text-lg font-medium">{{ $t("console-ai-agent.publish.publishConfig") }}</h3>
            <p class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.publishConfigDesc") }}</p>
        </div>

        <div v-if="!agent?.isPublished" class="border-border rounded-lg border p-6 text-center">
            <UIcon name="i-lucide-lock" class="text-muted-foreground mx-auto mb-3 size-12" />
            <h4 class="mb-2 font-medium">{{ $t("console-ai-agent.publish.unpublished") }}</h4>
            <p class="text-muted-foreground text-sm">{{ $t("console-ai-agent.publish.unpublishedDesc4") }}</p>
        </div>

        <template v-else>
            <!-- 访问控制 -->
            <div class="space-y-4">
                <!-- 允许的域名 -->
                <div class="space-y-2">
                    <label class="text-sm font-medium">{{ $t("console-ai-agent.publish.allowedDomains") }}</label>
                    <p class="text-muted-foreground text-xs">
                        {{ $t("console-ai-agent.publish.allowedDomainsDesc") }}
                    </p>

                    <!-- 域名列表 -->
                    <div v-if="config.allowOrigins.length > 0" class="space-y-2">
                        <div
                            v-for="(origin, index) in config.allowOrigins"
                            :key="index"
                            class="flex items-center gap-2"
                        >
                            <UInput :value="origin" readonly class="flex-1" />
                            <UButton
                                icon="i-lucide-x"
                                variant="ghost"
                                size="sm"
                                @click="removeOrigin(index)"
                            />
                        </div>
                    </div>

                    <!-- 添加新域名 -->
                    <div class="flex gap-2">
                        <UInput
                            v-model="newOrigin"
                            placeholder="例如：https://example.com"
                            class="flex-1"
                            @keydown="handleOriginKeydown"
                        />
                        <UButton @click="addOrigin">{{ $t("console-common.add") }}</UButton>
                    </div>
                </div>

                <!-- 频率限制 -->
                <div class="space-y-2">
                    <label class="text-sm font-medium">{{ $t("console-ai-agent.publish.rateLimit") }}</label>
                    <p class="text-muted-foreground text-xs">
                        {{ $t("console-ai-agent.publish.rateLimitDesc") }}
                    </p>
                    <UInput
                        v-model="config.rateLimitPerMinute"
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="60"
                        class="w-32"
                    />
                </div>
                </div>

                <!-- 功能设置 -->
                <div class="space-y-4">
                <h4 class="font-medium">{{ $t("console-ai-agent.publish.featureSettings") }}</h4>

                <div class="space-y-3">
                    <!-- 显示品牌信息 -->
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-sm font-medium">{{ $t("console-ai-agent.publish.showBranding") }}</div>
                            <div class="text-muted-foreground text-xs">
                                {{ $t("console-ai-agent.publish.showBrandingDesc") }}
                            </div>
                        </div>
                        <USwitch v-model="config.showBranding" />
                    </div>

                    <!-- 允许下载历史记录 -->
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-sm font-medium">{{ $t("console-ai-agent.publish.allowDownloadHistory") }}</div>
                            <div class="text-muted-foreground text-xs">{{ $t("console-ai-agent.publish.allowDownloadHistoryDesc") }}</div>
                        </div>
                        <USwitch v-model="config.allowDownloadHistory" />
                    </div>
                </div>
                </div>

                <!-- 配置预览 -->
                <div class="border-border rounded-lg border p-4">
                <h4 class="mb-3 font-medium">{{ $t("console-ai-agent.publish.previewConfig") }}</h4>
                <pre class="text-muted-foreground overflow-auto text-xs">{{
                    JSON.stringify(config, null, 2)
                }}</pre>
                </div>
        </template>
    </div>
</template>
