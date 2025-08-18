<script lang="ts" setup>
import { computed, ref } from "vue";

import Annotations from "../_components/logs/annotations.vue";
import ChatRecords from "../_components/logs/chat-records.vue";

// 路由参数
const { params: URLQueryParams } = useRoute();
const agentId = computed(() => (URLQueryParams as Record<string, string>).id);

// 标签页数据
const active = ref("0");
const { t } = useI18n();

const components: { value: string; label: string; component: any }[] = [
    {
        value: "0",
        label: t("console-ai-agent.logs.title"),
        component: ChatRecords,
    },
    {
        value: "1",
        label: t("console-ai-agent.logs.annotations"),
        component: Annotations,
    },
];

definePageMeta({ layout: "full-screen" });
</script>

<template>
    <div class="flex h-full flex-1 flex-col px-4 pt-4">
        <div class="flex">
            <UTabs v-model="active" :items="components" class="block w-auto" />
        </div>
        <div class="h-full">
            <component :is="components[Number(active)]?.component" :agent-id="agentId!" />
        </div>
    </div>
</template>
