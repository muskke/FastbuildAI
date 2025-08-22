<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";

import type { Agent } from "@/models/ai-agent";
import { apiGetAgentDetail } from "@/services/console/ai-agent";
import type { PublishAgentParams, PublishConfig } from "@/services/web/ai-agent-publish";
import {
    apiPublishAgent,
    apiRegenerateApiKey,
    apiUnpublishAgent,
} from "@/services/web/ai-agent-publish";

import ApiGuide from "../_components/publish/api-guide.vue";
import EmbedCode from "../_components/publish/embed-code.vue";
import PublishSettings from "../_components/publish/publish-settings.vue";
import PublishStatus from "../_components/publish/publish-status.vue";

// 路由参数
const { params: URLQueryParams } = useRoute();
const agentId = computed(() => (URLQueryParams as Record<string, string>).id);
// 消息提示
const toast = useMessage();
const { t } = useI18n();

// 状态管理
const loading = ref(false);
const publishing = ref(false);
const agent = ref<Agent>();

// 标签页管理
const activeTab = ref("status");

const tabs = [
    { value: "status", label: t("console-ai-agent.publish.status"), icon: "i-lucide-globe" },
    { value: "settings", label: t("console-ai-agent.publish.settings"), icon: "i-lucide-settings" },
    { value: "embed", label: t("console-ai-agent.publish.embed"), icon: "i-lucide-code" },
    { value: "api", label: t("console-ai-agent.publish.api"), icon: "i-lucide-terminal" },
];

// 发布配置
const publishConfig = reactive<PublishConfig>({
    allowOrigins: [],
    rateLimitPerMinute: 60,
    showBranding: true,
    allowDownloadHistory: false,
});

// 加载智能体详情
const loadAgentDetail = async () => {
    if (!agentId.value) return;

    try {
        loading.value = true;
        const data = await apiGetAgentDetail(agentId.value);
        agent.value = data;

        // 初始化发布配置
        if (data.publishConfig) {
            Object.assign(publishConfig, data.publishConfig);
        }
    } catch (error: any) {
        console.error("加载智能体信息失败:", error);
    } finally {
        loading.value = false;
    }
};

// 发布智能体
const handlePublish = async () => {
    if (!agentId.value) return;

    try {
        publishing.value = true;

        const params: PublishAgentParams = {
            publishConfig: { ...publishConfig },
        };

        const result = await apiPublishAgent(agentId.value, params);

        // 更新智能体状态
        if (agent.value) {
            agent.value.isPublished = true;
            agent.value.publishToken = result.publishToken;
            agent.value.apiKey = result.apiKey;
            agent.value.publishConfig = publishConfig;
        }

        toast.success("智能体发布成功！");

        // 切换到状态页面
        activeTab.value = "status";
    } catch (error: any) {
        console.error("发布智能体失败:", error);
    } finally {
        publishing.value = false;
    }
};

// 取消发布
const handleUnpublish = async () => {
    if (!agentId.value) return;

    try {
        publishing.value = true;

        await apiUnpublishAgent(agentId.value);

        // 更新智能体状态
        if (agent.value) {
            agent.value.isPublished = false;
            agent.value.publishToken = undefined;
            agent.value.apiKey = undefined;
            agent.value.publishConfig = undefined;
        }

        toast.success("已取消发布");
    } catch (error: any) {
        console.error("取消发布智能体失败:", error);
    } finally {
        publishing.value = false;
    }
};

// 重新生成API密钥
const handleRegenerateApiKey = async () => {
    if (!agentId.value) return;

    try {
        const result = await apiRegenerateApiKey(agentId.value);

        // 更新智能体API密钥
        if (agent.value) {
            agent.value.apiKey = result.apiKey;
        }

        toast.success("API密钥重新生成成功");
    } catch (error: any) {
        console.error("重新生成API密钥失败:", error);
    }
};

// 更新发布配置
const handleConfigUpdate = (newConfig: PublishConfig) => {
    Object.assign(publishConfig, newConfig);
};

// 计算属性
const isPublished = computed(() => agent.value?.isPublished || false);

// 组件挂载时加载数据
onMounted(() => loadAgentDetail());

definePageMeta({ layout: "full-screen" });
</script>

<template>
    <div class="flex h-full flex-1 flex-col px-4 pt-4">
        <!-- 页面头部 -->
        <div class="mb-2">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold">{{ $t("console-ai-agent.publish.title") }}</h1>
                    <p class="text-muted-foreground mt-1 text-sm">
                        {{ $t("console-ai-agent.publish.desc") }}
                    </p>
                </div>

                <!-- 操作按钮 -->
                <div class="flex gap-2">
                    <UButton v-if="!isPublished" :loading="publishing" @click="handlePublish">
                        <UIcon name="i-lucide-globe" class="mr-2 size-4" />
                        {{ $t("console-ai-agent.publish.publish") }}
                    </UButton>

                    <template v-else>
                        <UButton variant="outline" @click="handleRegenerateApiKey">
                            <UIcon name="i-lucide-refresh-cw" class="mr-2 size-4" />
                            {{ $t("console-ai-agent.publish.regenerateApiKey") }}
                        </UButton>

                        <UButton
                            color="error"
                            variant="outline"
                            :loading="publishing"
                            @click="handleUnpublish"
                        >
                            <UIcon name="i-lucide-globe-lock" class="mr-2 size-4" />
                            {{ $t("console-ai-agent.publish.unpublish") }}
                        </UButton>
                    </template>
                </div>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex h-64 items-center justify-center">
            <div class="text-muted-foreground flex items-center gap-2">
                <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
                {{ $t("console-ai-agent.publish.loading") }}
            </div>
        </div>

        <!-- 主要内容 -->
        <div v-else class="flex h-full min-h-0 flex-1 flex-col">
            <!-- 标签页 -->
            <div class="flex border-b">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    :class="[
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
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

            <!-- 标签页内容 -->
            <div class="flex-1 overflow-auto p-4">
                <!-- 发布状态 -->
                <PublishStatus v-if="activeTab === 'status'" :agent="agent" />

                <!-- 发布配置 -->
                <PublishSettings
                    v-else-if="activeTab === 'settings'"
                    :agent="agent"
                    @update="handleConfigUpdate"
                />

                <!-- 嵌入代码 -->
                <EmbedCode v-else-if="activeTab === 'embed'" :agent="agent" />

                <!-- API指南 -->
                <ApiGuide v-else-if="activeTab === 'api'" :agent="agent" />
            </div>
        </div>
    </div>
</template>
