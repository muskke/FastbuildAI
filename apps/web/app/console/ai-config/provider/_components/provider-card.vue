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

    if (hasAccessByCodes(["ai-providers:update"])) {
        items.push({
            label: t(
                props.provider.isActive
                    ? "console-ai-provider.search.disabled"
                    : "console-ai-provider.search.enabled",
            ),
            icon: props.provider.isActive ? "i-lucide-eye-off" : "i-lucide-eye",
            color: props.provider.isActive ? ("warning" as const) : ("success" as const),
            onSelect: () => emit("toggle-active", props.provider.id, !props.provider.isActive),
        });
    }

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
            <h3 class="text-secondary-foreground flex items-center text-base font-semibold">
                <UTooltip :text="provider.name" :delay="0">
                    <span class="line-clamp-1">
                        {{ provider.name }}
                    </span>
                </UTooltip>
                <span class="text-muted-foreground mr-2 ml-1 text-sm">
                    ({{ provider.provider }})
                </span>
                <!-- 状态标识 -->
                <UTooltip :text="statusInfo.label" :delay="0">
                    <UBadge :color="statusInfo.color" :icon="statusInfo.icon" size="xs" />
                </UTooltip>
            </h3>
        </template>

        <template #description>
            <div class="flex flex-row flex-wrap gap-1">
                <UBadge
                    v-for="type in provider.supportedModelTypes"
                    :key="type"
                    variant="outline"
                    color="neutral"
                    size="sm"
                >
                    {{ type.toLocaleUpperCase().replaceAll("-", " ") }}
                </UBadge>
            </div>

            <!-- 描述 -->
            <p v-if="provider.description" class="text-muted-foreground line-clamp-2 text-xs">
                {{ provider.description }}
            </p>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <!-- 官网链接 -->
                <!-- <div class="flex cursor-pointer items-center gap-2">
                    <UBadge
                        v-if="provider.websiteUrl"
                        icon="i-lucide-external-link"
                        color="primary"
                        size="md"
                        variant="subtle"
                        @click.stop="openWebsite"
                    >
                        {{ t("console-ai-provider.viewWebsite") }}
                    </UBadge>
                </div> -->

                <div class="flex items-center gap-1">
                    <UButton trailing-icon="i-lucide-chevron-right" variant="ghost" size="sm">
                        {{ t("console-ai-provider.modelManagement") }}
                    </UButton>
                </div>
            </div>
        </template>
    </ProCard>
</template>
