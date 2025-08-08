<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { AiModelInfo } from "@/models/ai-provider";

interface AiModelCardProps {
    model: AiModelInfo;
    selected?: boolean;
    providerId?: string;
}

interface AiModelCardEmits {
    (e: "select", model: AiModelInfo, selected: boolean | "indeterminate"): void;
    (e: "delete", model: AiModelInfo): void;
    (e: "set-default", model: AiModelInfo): void;
    (e: "test-connection", model: AiModelInfo): void;
}

const props = withDefaults(defineProps<AiModelCardProps>(), {
    selected: false,
});

const emit = defineEmits<AiModelCardEmits>();
const router = useRouter();
const { t } = useI18n();
const { hasAccessByCodes } = useAccessControl();

/**
 * 处理选择状态变化
 */
function handleSelect(selected: boolean | "indeterminate") {
    if (typeof selected === "boolean") {
        emit("select", props.model, selected);
    }
}

/**
 * 获取供应商图标
 */
function getProviderIcon(providerId: string): string {
    const iconMap: Record<string, string> = {
        openai: "i-simple-icons-openai",
        anthropic: "i-simple-icons-claude",
        gemini: "i-simple-icons-google",
        azure: "i-simple-icons-microsoftazure",
        huggingface: "i-simple-icons-huggingface",
        ollama: "i-lucide-server",
        deepseek: "i-lucide-brain",
        zhipu: "i-lucide-zap",
        moonshot: "i-lucide-moon",
        baichuan: "i-lucide-mountain",
        qwen: "i-lucide-cpu",
    };
    return iconMap[providerId] || "i-lucide-brain";
}

/**
 * 获取模型状态信息
 */
function getModelStatusInfo(isActive: boolean | undefined) {
    if (isActive) {
        return {
            label: t("console-common.active"),
            color: "success" as const,
            icon: "i-lucide-check-circle",
        };
    } else {
        return {
            label: t("console-common.inactive"),
            color: "error" as const,
            icon: "i-lucide-x-circle",
        };
    }
}

/**
 * 获取下拉菜单项
 */
const dropdownActions = computed(() => {
    const items = [];

    if (hasAccessByCodes(["ai-models:update"])) {
        items.push({
            label: t("console-common.edit"),
            icon: "i-lucide-edit",
            onSelect: () =>
                router.push({
                    path: useRoutePath("ai-models:update"),
                    query: { id: props.model.id, providerId: props.providerId },
                }),
        });
    }

    if (hasAccessByCodes(["ai-models:update"]) && !props.model.isDefault) {
        items.push({
            label: t("console-ai-provider.model.setDefault"),
            icon: "i-lucide-star",
            onSelect: () => emit("set-default", props.model),
        });
    }

    if (hasAccessByCodes(["ai-models:delete"])) {
        if (items.length > 0) {
            items.push({
                type: "separator" as const,
                label: "",
                onSelect: () => {},
            });
        }
        items.push({
            label: t("console-common.delete"),
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => emit("delete", props.model),
        });
    }

    return items;
});

const statusInfo = computed(() => getModelStatusInfo(props.model.isActive));
</script>

<template>
    <ProCard
        selectable
        show-actions
        :selected="selected"
        :actions="dropdownActions"
        @select="handleSelect"
    >
        <template #icon="{ groupHoverClass, selectedClass }">
            <div class="relative flex items-start gap-4">
                <!-- 模型图标 -->
                <div class="relative">
                    <div
                        class="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        :class="[groupHoverClass, selectedClass]"
                    >
                        <UIcon :name="getProviderIcon(model.providerId)" class="h-8 w-8" />
                    </div>
                    <!-- 默认模型标识 -->
                    <UBadge
                        v-if="model.isDefault"
                        color="warning"
                        size="sm"
                        class="absolute -top-1 -right-1"
                    >
                        <UIcon name="i-lucide-star" class="h-3 w-3" />
                    </UBadge>
                </div>

                <div>
                    <!-- 模型名称 -->
                    <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                        <UTooltip :text="model.name" :delay="0">
                            <span class="mr-2 line-clamp-1"> {{ model.name }} </span>
                        </UTooltip>
                    </h3>

                    <UBadge v-if="model.modelType" variant="outline" color="neutral" size="sm">
                        {{ model.modelType.toLocaleUpperCase().replaceAll("-", " ") }}
                    </UBadge>

                    <!-- 模型标识 -->
                    <p v-if="model.model" class="text-muted-foreground mt-2 line-clamp-2 text-xs">
                        {{ t("console-ai-provider.model.form.model") }}: ({{ model.model }})
                    </p>
                </div>
            </div>
        </template>

        <template #description>
            <!-- 模型描述 -->
            <p v-if="model.description" class="text-muted-foreground line-clamp-2 text-sm">
                {{ model.description }}
            </p>
        </template>

        <template #details>
            <!-- 模型配置信息 -->
            <div class="space-y-2">
                <!-- Token限制 -->

                <!-- 定价信息-输入 -->
                <div v-if="model.pricing" class="text-accent-foreground flex items-center text-xs">
                    <UIcon name="i-lucide-dollar-sign" class="mr-1 h-3 w-3" />
                    <span>
                        {{ t("console-ai-provider.model.form.inputPrice") }}
                        : ({{ model.pricing.input || 0 }} / 1K)
                    </span>
                </div>

                <!-- 定价信息-输出 -->
                <div v-if="model.pricing" class="text-accent-foreground flex items-center text-xs">
                    <UIcon name="i-lucide-dollar-sign" class="mr-1 h-3 w-3" />
                    <span>
                        {{ t("console-ai-provider.model.form.outputPrice") }}
                        : ({{ model.pricing.output || 0 }} / 1K)
                    </span>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center gap-2">
                <!-- 状态标识 -->
                <UTooltip :text="statusInfo.label" :delay="0">
                    <UBadge :color="statusInfo.color" :icon="statusInfo.icon" size="xs" />
                </UTooltip>
                <!-- 创建时间 -->
                <span class="text-muted-foreground text-xs">
                    {{ t("console-common.updateAt") }}:
                    <TimeDisplay :datetime="model.createdAt" mode="date" />
                </span>

                <!-- 快捷操作 -->
                <div class="ml-auto flex items-center gap-1">
                    <AccessControl :codes="['ai-models:update']">
                        <UButton
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            icon="i-lucide-edit"
                            @click="
                                router.push({
                                    path: useRoutePath('ai-models:update'),
                                    query: { id: model.id },
                                })
                            "
                        />
                    </AccessControl>
                </div>
            </div>
        </template>
    </ProCard>
</template>
