<script lang="ts" setup>
import { useRouter } from "vue-router";

import type { Agent } from "@/models/ai-agent";

interface Props {
    agent: Agent;
}

interface Emits {
    (e: "delete", agent: Agent): void;
    (e: "edit", agent: Agent): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const router = useRouter();
const { t } = useI18n();

// 查看详情
const handleViewDetail = () => {
    router.push(useRoutePath("ai-agent:detail", { id: props.agent.id }));
};
</script>

<template>
    <div
        class="group border-default relative cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-lg"
        @click="handleViewDetail"
    >
        <!-- 右下角操作按钮组 -->
        <div
            class="absolute right-3 bottom-3 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            @click.stop
        >
            <UButton
                class="opacity-70 hover:opacity-100"
                icon="i-lucide-edit"
                size="xs"
                :label="$t('console-common.edit')"
                color="primary"
                variant="ghost"
                @click.stop="emits('edit', agent)"
            />
            <UButton
                class="opacity-70 hover:opacity-100"
                icon="i-lucide-trash"
                size="xs"
                :label="$t('console-common.delete')"
                color="error"
                variant="ghost"
                @click.stop="emits('delete', agent)"
            />
        </div>

        <!-- 左上角图标和标题 -->
        <div class="mb-3 flex items-start gap-3">
            <div
                class="border-default bg-primary-50 flex size-10 flex-shrink-0 items-center justify-center rounded-lg border"
            >
                <img :src="agent.avatar" alt="avatar" class="size-10 rounded-lg object-contain" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
                <h3 class="text-foreground truncate text-sm font-medium">
                    {{ agent.name }}
                </h3>

                <!-- 统计信息 -->
                <div class="text-muted-foreground mt-1 text-xs">
                    <span>{{ $t("console-ai-agent.create.edit") }}</span>
                    <TimeDisplay :datetime="agent.updatedAt" mode="long" />
                </div>
            </div>
        </div>

        <!-- 描述文字 -->
        <div class="text-muted-foreground mb-4 h-10 pr-8 text-xs">
            <p class="line-clamp-2 overflow-hidden">
                {{ agent.description }}
            </p>
        </div>
    </div>
</template>
