<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { type LinkItem, LinkType } from "../types";

const { t } = useI18n();

// 组件属性
interface Props {
    /** 当前选中的链接 */
    selected?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    selected: null,
});

// 组件事件
const emit = defineEmits<{
    (e: "select", link: LinkItem): void;
}>();

// 响应式状态
const customPath = ref<string>("");

/**
 * 确认选择自定义链接
 */
const confirmSelection = () => {
    if (!customPath.value) return;
    emit("select", { type: LinkType.CUSTOM, path: customPath.value, name: customPath.value });
};

/**
 * 清空表单
 */
const clearForm = () => {
    customPath.value = "";
};

/**
 * 验证URL格式
 */
const validateUrl = (url: string): boolean => {
    try {
        // 支持相对路径和绝对路径
        if (url.startsWith("/")) return true;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            new URL(url);
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

// 监听选中的链接变化，回填表单
watch(
    () => props.selected,
    (newSelected: string | null) => {
        if (newSelected) {
            customPath.value = newSelected;
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="custom-link-provider flex h-full flex-col">
        <div class="flex-1 overflow-y-auto p-8">
            <div class="mx-auto max-w-lg space-y-8">
                <!-- 表单标题 -->
                <div class="flex items-center text-left">
                    <div
                        class="bg-primary/10 mr-4 flex size-16 items-center justify-center rounded-2xl"
                    >
                        <UIcon name="i-heroicons-link" class="text-primary h-8 w-8" />
                    </div>
                    <div class="flex w-full flex-1 flex-col">
                        <h3 class="text-foreground text-xl font-semibold">
                            {{ t("console-common.linkPicker.customLink.title") }}
                        </h3>
                        <p class="text-muted-foreground mt-2 text-sm">
                            {{ t("console-common.linkPicker.customLink.description") }}
                        </p>
                    </div>
                </div>

                <!-- 表单 -->
                <div class="space-y-6">
                    <!-- 链接地址 -->
                    <UFormField
                        :label="t('console-common.linkPicker.customLink.linkAddress')"
                        required
                    >
                        <UInput
                            v-model="customPath"
                            :placeholder="t('console-common.linkPicker.customLink.linkPlaceholder')"
                            size="lg"
                            :color="customPath && !validateUrl(customPath) ? 'error' : undefined"
                            :ui="{ root: 'w-full' }"
                        />
                        <template #help>
                            <span
                                class="text-xs"
                                :class="
                                    customPath && !validateUrl(customPath)
                                        ? 'text-error'
                                        : 'text-muted-foreground'
                                "
                            >
                                {{
                                    customPath && !validateUrl(customPath)
                                        ? t("console-common.linkPicker.customLink.invalidUrl")
                                        : t("console-common.linkPicker.customLink.urlHelp")
                                }}
                            </span>
                        </template>
                    </UFormField>
                </div>

                <!-- 操作按钮 -->
                <div class="flex gap-3">
                    <UButton
                        :disabled="!customPath || !validateUrl(customPath)"
                        color="primary"
                        size="lg"
                        class="flex-1"
                        @click="confirmSelection"
                    >
                        <UIcon name="i-heroicons-check" class="mr-2 h-4 w-4" />
                        {{ t("console-common.linkPicker.customLink.confirmSelect") }}
                    </UButton>
                    <UButton color="neutral" variant="outline" size="lg" @click="clearForm">
                        <UIcon name="i-heroicons-arrow-path" class="mr-2 h-4 w-4" />
                        {{ t("console-common.linkPicker.customLink.clear") }}
                    </UButton>
                </div>

                <!-- 使用提示 -->
                <div class="bg-muted/50 text-muted-foreground rounded-lg p-4 text-xs">
                    <div class="flex items-start gap-2">
                        <UIcon
                            name="i-heroicons-light-bulb"
                            class="text-primary mt-0.5 h-4 w-4 flex-shrink-0"
                        />
                        <div class="space-y-2">
                            <p class="text-foreground font-medium">
                                {{ t("console-common.linkPicker.customLink.usageTips.title") }}
                            </p>
                            <ul class="ml-2 space-y-1">
                                <li>
                                    •
                                    {{
                                        t(
                                            "console-common.linkPicker.customLink.usageTips.relativePath",
                                        )
                                    }}
                                </li>
                                <li>
                                    •
                                    {{
                                        t(
                                            "console-common.linkPicker.customLink.usageTips.absoluteUrl",
                                        )
                                    }}
                                </li>
                                <li>
                                    •
                                    {{
                                        t(
                                            "console-common.linkPicker.customLink.usageTips.displayName",
                                        )
                                    }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
