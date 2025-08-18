<script setup lang="ts">
import type { Agent } from "@/models/ai-agent";

interface Props {
    agent: Agent;
    showStats?: boolean;
    variant?: "default" | "hot" | "latest";
}

const props = withDefaults(defineProps<Props>(), {
    showStats: true,
    variant: "default",
});

const emit = defineEmits<{
    click: [agent: Agent];
}>();

const { t } = useI18n();

const handleClick = () => {
    emit("click", props.agent);
};

const badgeConfig = computed(() => {
    switch (props.variant) {
        case "hot":
            return {
                icon: "i-lucide-fire",
                color: "warning" as const,
                text: `${props.agent.userCount} ${t("square.users")}`,
            };
        case "latest":
            return {
                icon: "i-lucide-sparkles",
                color: "primary" as const,
                text: t("square.new"),
            };
        default:
            return null;
    }
});
</script>

<template>
    <div
        class="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:shadow-neutral-900/50"
        @click="handleClick"
    >
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
        <div class="text-muted-foreground h-10 pr-8 text-xs">
            <p class="line-clamp-2 overflow-hidden">
                {{ agent.description }}
            </p>
        </div>
    </div>
</template>
