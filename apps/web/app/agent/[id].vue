<script setup lang="ts">
import { apiGetAgentDetail } from "@/services/web/agent";

const AgentModal = defineAsyncComponent(() => import("./_components/agent-modal.vue"));

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const agentId = computed(() => (route.params as Record<string, string>).id);
const collapsed = ref<boolean>(false);

// 编辑弹窗状态
const editModalOpen = ref(false);

// 获取微页面详情
const {
    data: agent,
    pending: agentPending,
    refresh: refreshAgent,
} = await useAsyncData(`agent-detail-${agentId.value}`, () =>
    apiGetAgentDetail(agentId.value as string),
);

provide("agents", agent);

/** 打开编辑弹窗 */
const handleEdit = () => {
    editModalOpen.value = true;
};

/** 处理编辑弹窗关闭 */
const handleEditModalClose = (refresh?: boolean) => {
    editModalOpen.value = false;

    // 如果需要刷新数据
    if (refresh) {
        refreshAgent();
    }
};

definePageMeta({ activePath: "/agent" });
</script>

<template>
    <div class="flex h-full min-h-0 w-full">
        <div class="flex h-full w-50 flex-none flex-col p-2" :class="{ '!w-18': collapsed }">
            <!-- 这里点击的时候显示修改智能体弹窗 -->
            <div
                class="hover:bg-muted flex cursor-pointer flex-col space-y-3 rounded-lg p-2"
                @click="handleEdit"
            >
                <div
                    class="flex items-center justify-between gap-2"
                    :class="{ '!flex-col': collapsed }"
                >
                    <UButton
                        variant="soft"
                        color="neutral"
                        size="lg"
                        leading-icon="i-lucide-arrow-left"
                        @click.stop="router.replace('/agent')"
                    />

                    <!-- 配置按钮 -->
                    <UButton
                        variant="link"
                        color="primary"
                        size="lg"
                        leading-icon="i-lucide-settings-2"
                    />
                </div>

                <UTooltip :text="agent?.name" :delay-duration="0" v-if="!collapsed">
                    <div class="text-foreground line-clamp-2 text-sm font-medium">
                        {{ agent?.name }}
                    </div>
                </UTooltip>

                <div class="text-muted-foreground text-xs" v-if="!collapsed">
                    {{ agent?.description }}
                </div>
            </div>
            <div class="px-2">
                <USeparator class="my-3 flex" />
            </div>
            <div class="flex h-full w-full flex-col justify-between p-2">
                <UNavigationMenu
                    orientation="vertical"
                    :collapsed="collapsed"
                    :items="[
                        {
                            label: '编排',
                            icon: 'i-lucide-radar',
                            to: `/agent/${agentId}/configuration`,
                            active: route.path.includes(`/agent/${agentId}/configuration`),
                        },
                        {
                            label: '发布更新',
                            icon: 'i-lucide-radio-tower',
                            to: `/agent/${agentId}/publish`,
                            active: route.path.includes(`/agent/${agentId}/publish`),
                        },
                        {
                            label: '记录与标注',
                            icon: 'i-lucide-file-text',
                            to: `/agent/${agentId}/logs`,
                            active: route.path.includes(`/agent/${agentId}/logs`),
                        },
                        {
                            label: '数据看板',
                            icon: 'i-lucide-pie-chart',
                            to: `/agent/${agentId}/dashboard`,
                            active: route.path.includes(`/agent/${agentId}/dashboard`),
                        },
                    ]"
                    class="data-[orientation=vertical]:w-full"
                    :ui="{
                        list: 'space-y-1',
                        link: collapsed ? 'p-2.5' : 'p-2 pl-3',
                        linkLeadingIcon: collapsed ? 'size-5' : 'size-4',
                    }"
                />

                <div
                    class="mt-auto flex items-center justify-center"
                    :class="{ '!justify-between': !collapsed }"
                >
                    <UButton
                        data-sidebar="trigger"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :ui="{ base: 'py-2' }"
                        @click="collapsed = !collapsed"
                    >
                        <template v-if="!collapsed">
                            <UIcon name="i-lucide-panel-right" class="size-5" />
                        </template>
                        <template v-else>
                            <UIcon name="i-lucide-panel-left" class="size-5" />
                        </template>
                        <span class="sr-only">侧边栏切换</span>
                    </UButton>
                </div>
            </div>
        </div>
        <USeparator orientation="vertical" />
        <!-- 内容区域 -->
        <NuxtPage />

        <!-- 编辑智能体弹窗 -->
        <AgentModal v-if="editModalOpen && agentId" :id="agentId" @close="handleEditModalClose" />
    </div>
</template>
