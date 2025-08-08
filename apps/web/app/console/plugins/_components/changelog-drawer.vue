<script lang="ts" setup>
import type { PluginMarketItem } from "@/models/plugin-market";

/**
 * 插件更新日志抽屉组件
 */
interface Props {
    /** 是否显示抽屉 */
    modelValue: boolean;
    /** 选中的插件 */
    plugin: PluginMarketItem | null;
}

interface Emits {
    /** 更新显示状态 */
    (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const open = useVModel(props, "modelValue", emit);

/**
 * 关闭抽屉
 */
function handleClose() {
    emit("update:modelValue", false);
}
</script>

<template>
    <UDrawer
        v-model:open="open"
        :set-background-color-on-scale="false"
        direction="right"
        should-scale-background
    >
        <template #content>
            <div v-if="plugin" class="flex h-full w-[300px] flex-col pr-4">
                <!-- 抽屉头部 -->
                <div class="flex items-center justify-between py-2">
                    <h3 class="text-secondary-foreground text-xl">{{ plugin.name }} - 更新日志</h3>
                    <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        @click="handleClose"
                    />
                </div>

                <!-- 抽屉内容 -->
                <div class="flex-1 overflow-y-auto">
                    <div v-if="plugin.versions.length > 0" class="space-y-4">
                        <div
                            v-for="version in plugin.versions"
                            :key="version.id"
                            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                        >
                            <div class="mb-2 flex items-center justify-between">
                                <span class="text-secondary-foreground font-medium">
                                    v{{ version.version }}
                                </span>
                                <span class="text-muted-foreground text-sm dark:text-gray-400">
                                    <TimeDisplay :datetime="version.release_time" mode="date" />
                                </span>
                            </div>
                            <p class="text-accent-foreground mb-2 text-sm dark:text-gray-400">
                                {{ version.description }}
                            </p>
                            <div
                                v-if="version.changelog"
                                class="text-accent-foreground text-sm dark:text-gray-400"
                            >
                                <pre class="whitespace-pre-wrap">{{ version.changelog }}</pre>
                            </div>
                        </div>
                    </div>

                    <div
                        v-else
                        class="flex h-full w-full flex-col items-center justify-center py-8 text-center"
                    >
                        <UIcon name="i-lucide-clock" class="mx-auto mb-2 h-12 w-12 text-gray-400" />
                        <p class="text-accent-foreground dark:text-gray-400">暂无版本信息</p>
                    </div>
                </div>
            </div>
        </template>
    </UDrawer>
</template>
