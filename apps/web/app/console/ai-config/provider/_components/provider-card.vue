<script setup lang="ts">
import { ProCard } from "@fastbuildai/ui";

import type { AiProviderInfo } from "@/models/ai-provider";

interface ProviderCardProps {
    provider: AiProviderInfo;
    selected?: boolean;
}

interface ProviderCardEmits {
    (e: "select", provider: AiProviderInfo, selected: boolean | "indeterminate"): void;
    (e: "delete", provider: AiProviderInfo): void;
    (e: "edit", provider: AiProviderInfo): void;
    (e: "view-models", providerId: string): void;
    /**
     * 切换供应商状态事件
     * @param providerId 供应商ID
     * @param isActive 状态
     */
    (e: "toggle-active", providerId: string, isActive: boolean): void;
}

const props = withDefaults(defineProps<ProviderCardProps>(), {
    selected: false,
});

const emit = defineEmits<ProviderCardEmits>();
const { t } = useI18n();
const router = useRouter();
const { hasAccessByCodes } = useAccessControl();

/**
 * 获取供应商状态信息
 */
function getProviderStatusInfo(isActive: boolean) {
    if (isActive) {
        return {
            label: t("console-ai-provider.search.enabled"),
            color: "success" as const,
            icon: "i-lucide-check-circle",
        };
    } else {
        return {
            label: t("console-ai-provider.search.disabled"),
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

    if (hasAccessByCodes(["ai-providers:update"])) {
        items.push({
            label: t("console-ai-provider.actions.edit"),
            icon: "i-lucide-edit",
            onSelect: () => emit("edit", props.provider),
        });
    }

    // if (hasAccessByCodes(["ai-providers:update"])) {
    //     items.push({
    //         label: t(
    //             props.provider.isActive
    //                 ? "console-ai-provider.search.disabled"
    //                 : "console-ai-provider.search.enabled",
    //         ),
    //         icon: props.provider.isActive ? "i-lucide-eye-off" : "i-lucide-eye",
    //         color: props.provider.isActive ? ("warning" as const) : ("success" as const),
    //         onSelect: () => emit("toggle-active", props.provider.id, !props.provider.isActive),
    //     });
    // }

    if (hasAccessByCodes(["ai-providers:delete"]) && !props.provider.isBuiltIn) {
        if (items.length > 0) {
            items.push({
                type: "separator" as const,
                label: "",
                onSelect: () => {},
            });
        }
        items.push({
            label: t("console-ai-provider.actions.delete"),
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => emit("delete", props.provider),
        });
    }

    return items;
});

const statusInfo = computed(() => getProviderStatusInfo(props.provider.isActive));

/**
 * 处理卡片点击
 */
function handleCardClick() {
    router.push({
        path: useRoutePath("ai-models:list"),
        query: { id: props.provider.id },
    });
}

/**
 * 处理选择状态变化
 */
function handleSelect(selected: boolean | "indeterminate") {
    if (typeof selected === "boolean") {
        emit("select", props.provider, selected);
    }
}

/**
 * 本地状态，用于跟踪开关的实际状态
 */
const localIsActive = ref(props.provider.isActive);

/**
 * 监听props中provider.isActive的变化，同步到本地状态
 */
watchEffect(() => {
    localIsActive.value = props.provider.isActive;
});

/**
 * 处理开关状态变化
 */
const handleToggleActive = async () => {
    // 保存原始状态，以便在失败时恢复
    const originalState = !localIsActive.value;

    try {
        // 发送状态变更事件
        emit("toggle-active", props.provider.id, localIsActive.value);

        // 添加延时检查，如果父组件没有更新props，则认为更新失败
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 如果父组件没有更新props，则认为更新失败
        if (props.provider.isActive !== localIsActive.value) {
            // 恢复到原始状态
            localIsActive.value = originalState;
        }
    } catch (error) {
        // 如果出错，恢复到原始状态
        localIsActive.value = originalState;
        console.error("切换供应商状态失败:", error);
    }
};

function openWebsite() {
    if (!props.provider.websiteUrl) return;
    window.open(props.provider.websiteUrl, "_blank");
}
</script>

<template>
    <ProCard
        selectable
        clickable
        show-actions
        variant="outlined"
        class="cursor-pointer"
        :selected="selected"
        :actions="dropdownActions"
        @select="handleSelect"
        @click="handleCardClick"
    >
        <template #icon="{ groupHoverClass, selectedClass }">
            <UChip
                :position="provider.isActive ? 'top-right' : undefined"
                :color="statusInfo.color"
            >
                <UAvatar
                    :src="provider.iconUrl"
                    :alt="provider.name"
                    size="3xl"
                    :ui="{ root: 'rounded-lg', fallback: 'text-inverted' }"
                    :class="[groupHoverClass, selectedClass, provider.iconUrl ? '' : 'bg-primary']"
                />
            </UChip>
        </template>

        <template #title>
            <div class="flex items-center justify-between">
                <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                    <UTooltip :text="provider.name" :delay="0">
                        <span class="line-clamp-1 shrink-0">
                            {{ provider.name }}
                        </span>
                    </UTooltip>
                    <span class="text-muted-foreground mr-2 ml-1 line-clamp-1 shrink-0 text-sm">
                        ({{ provider.provider }})
                    </span>
                </h3>

                <!-- <UBadge variant="outline" color="neutral" size="sm" class="shrink-0 rounded-full">
                    {{ provider.models.length }}
                    {{ `${t("common.unit.general.item")}${t("common.ai.model")}` }}
                </UBadge> -->
            </div>
        </template>

        <template #description>
            <!-- 描述 -->
            <p v-if="provider.description" class="text-muted-foreground line-clamp-2 text-xs">
                {{ provider.description }}
            </p>

            <div class="flex flex-row flex-wrap gap-1">
                <UBadge
                    v-for="type in provider.supportedModelTypes"
                    :key="type"
                    variant="soft"
                    color="neutral"
                    size="sm"
                    class="h-fit"
                >
                    {{ type.toLocaleUpperCase().replaceAll("-", " ") }}
                </UBadge>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <UBadge variant="outline" color="neutral" size="sm" class="shrink-0 rounded-full">
                    {{ provider.models.length }}
                    {{ `${t("common.unit.general.item")}${t("common.ai.model")}` }}
                </UBadge>
                <AccessControl :codes="['ai-providers:update']">
                    <USwitch
                        v-model="localIsActive"
                        @click.stop
                        @update:model-value="handleToggleActive"
                    />
                </AccessControl>
            </div>
            <!-- <div class="flex justify-end gap-2">
                <div class="flex items-center gap-1">
                    <UButton trailing-icon="i-lucide-chevron-right" variant="ghost" size="sm">
                        {{ t("console-ai-provider.modelManagement") }}
                    </UButton>
                </div>
            </div> -->
        </template>
    </ProCard>
</template>
