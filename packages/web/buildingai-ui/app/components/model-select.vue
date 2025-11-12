<script setup lang="ts">
import type { ModelType } from "@buildingai/service/models/globals";
import type { AiModel, AiProvider } from "@buildingai/service/webapi/ai-conversation";
import {
    apiGetAiProviders,
    apiGetDefaultAiModel,
} from "@buildingai/service/webapi/ai-conversation";
import { useDebounceFn } from "@vueuse/core";

import type { ButtonProps } from "#ui/types";

const props = withDefaults(
    defineProps<{
        modelValue?: string;
        disabled?: boolean;
        showDescription?: boolean;
        defaultSelected?: boolean;
        console?: boolean;
        supportedModelTypes?: ModelType[];
        buttonUi?: ButtonProps;
        // Whether to show billing rule
        showBillingRule?: boolean;
        // Whether to open local storage
        openLocalStorage?: boolean;
    }>(),
    {
        showDescription: true,
        defaultSelected: true,
        console: false,
        showBillingRule: false,
        openLocalStorage: false,
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "change", value: AiModel | null): void;
}>();

const { t } = useI18n();

const loading = shallowRef(false);
const isOpen = shallowRef(false);
const search = shallowRef("");
const providers = shallowRef<AiProvider[]>([]);
const selected = shallowRef<AiModel | null>(null);
const scrollAreaRef = useTemplateRef("scrollAreaRef");

const expandedProviders = ref<Record<string, boolean>>({});
const isScrolling = ref(false);

const allModels = computed(() => providers.value.flatMap((p) => p.models ?? []));
const filteredProviders = computed(() => {
    const query = search.value.trim().toLowerCase();
    if (!query) return providers.value;
    return providers.value
        .map((p) => ({
            ...p,
            models: p.models?.filter((m) =>
                [m.name, m.model, p.name, p.provider].some((s) => s.toLowerCase().includes(query)),
            ),
        }))
        .filter((p) => p.models?.length);
});

function select(model: AiModel | null) {
    selected.value = model;
    if (props.openLocalStorage) {
        localStorage.setItem("modelId", model?.id || "");
    }
    emit("update:modelValue", model?.id || "");
    emit("change", model);
    isOpen.value = false;
    search.value = "";

    // Expand the provider that contains the selected model
    expandProviderByModel(model);
}

function toggleProvider(providerId: string) {
    expandedProviders.value[providerId] = !expandedProviders.value[providerId];
}

function isProviderExpanded(providerId: string): boolean {
    // Default to collapsed
    return expandedProviders.value[providerId] ?? false;
}

function expandProviderByModel(model: AiModel | null) {
    if (!model) return;

    const provider = providers.value.find((p) => p.models?.some((m) => m.id === model.id));

    if (provider) {
        expandedProviders.value[provider.id] = true;
    }
}

async function loadModels() {
    if (loading.value) return;
    loading.value = true;
    try {
        providers.value = await apiGetAiProviders({
            supportedModelTypes: props.supportedModelTypes,
        });

        // Initialize all providers to collapsed state
        providers.value.forEach((provider) => {
            if (!(provider.id in expandedProviders.value)) {
                expandedProviders.value[provider.id] = false;
            }
        });

        const findModel = (id?: string) => allModels.value.find((m) => m.id === id);

        if (!props.defaultSelected) {
            selected.value = findModel(props.modelValue) ?? null;
            // Expand the provider that contains the selected model
            expandProviderByModel(selected.value);
            return;
        }

        selected.value =
            (props.openLocalStorage ? findModel(localStorage.getItem("modelId") || "") : null) ??
            findModel(props.modelValue) ??
            findModel((await apiGetDefaultAiModel().catch(() => null))?.id) ??
            allModels.value.find((m) => m.isDefault) ??
            allModels.value[0] ??
            null;

        if (selected.value) {
            select(selected.value);
            // Expand the provider that contains the selected model
            expandProviderByModel(selected.value);
        }
    } catch (e) {
        console.error("Failed to load models", e);
    } finally {
        loading.value = false;
    }
}

const modelValue = computed(() => {
    return allModels.value.find((m) => m.id === props.modelValue);
});

const scrollToSelectedModel = async () => {
    if (!selected.value || !isOpen.value) return;

    await nextTick();

    const selectedElement = document.querySelector(`[data-model-id="${selected.value.id}"]`);
    if (selectedElement && scrollAreaRef.value) {
        selectedElement.scrollIntoView({
            behavior: "instant",
            block: "center",
        });
    }
};

// Watch popover open state, automatically scroll to selected model when opened
watch(isOpen, (newValue) => {
    if (newValue) {
        scrollToSelectedModel();
    }
});

const handleScrollEnd = useDebounceFn(() => {
    isScrolling.value = false;
}, 200);

const handleScroll = () => {
    isScrolling.value = true;
    handleScrollEnd();
};

onMounted(loadModels);
</script>

<template>
    <UPopover v-model:open="isOpen" :disabled="props.disabled">
        <UButton
            color="neutral"
            variant="soft"
            class="flex items-center justify-between"
            :loading="loading"
            :disabled="props.disabled"
            v-bind="props.buttonUi"
            @click.stop
        >
            <div class="flex min-w-0 flex-1 items-center gap-1">
                <span class="inline-block w-12 truncate text-left sm:block sm:w-full">
                    {{ selected?.name || modelValue?.name || t("common.placeholder.modelSelect") }}
                </span>

                <UBadge
                    v-if="selected?.modelConfig?.mode"
                    variant="outline"
                    color="neutral"
                    size="sm"
                >
                    {{ String(selected.modelConfig.mode).toUpperCase() }}
                </UBadge>
                <div
                    v-if="
                        selected &&
                        (selected.features?.includes('vision') ||
                            selected.features?.includes('video') ||
                            selected.features?.includes('audio'))
                    "
                    class="flex flex-none items-center gap-1"
                >
                    <UBadge
                        v-if="selected?.features?.includes('vision')"
                        icon="i-lucide-eye"
                        size="sm"
                        variant="outline"
                        color="neutral"
                    />
                    <UBadge
                        v-if="selected?.features?.includes('video')"
                        icon="i-lucide-video"
                        size="sm"
                        variant="outline"
                        color="neutral"
                    />
                    <UBadge
                        v-if="selected?.features?.includes('audio')"
                        icon="i-lucide-audio-lines"
                        size="sm"
                        variant="outline"
                        color="neutral"
                    />
                </div>
            </div>

            <div class="flex flex-none items-center gap-2">
                <UIcon
                    name="i-lucide-x"
                    v-if="selected?.name && props.console"
                    @click.stop="select(null)"
                />

                <UIcon name="i-lucide-chevron-down" :class="{ 'rotate-180': isOpen }" />
            </div>
        </UButton>

        <template #content>
            <div class="bg-background w-fit min-w-80 overflow-hidden rounded-lg shadow-lg">
                <div class="p-2">
                    <UInput
                        v-model="search"
                        :placeholder="t('common.placeholder.searchModel')"
                        size="lg"
                        variant="soft"
                        :ui="{ root: 'w-full' }"
                    >
                        <template #leading><UIcon name="i-lucide-search" /></template>
                    </UInput>
                </div>

                <div
                    class="flex h-[calc((100vh-15rem)/3)] flex-col gap-3 px-2 pt-1 pb-2"
                    :class="{ 'md:grid-cols-2': filteredProviders.length > 1 }"
                >
                    <BdScrollArea
                        ref="scrollAreaRef"
                        class="h-full"
                        type="hover"
                        :shadow="false"
                        @scroll="handleScroll"
                    >
                        <div
                            v-if="loading"
                            class="text-muted-foreground col-span-full py-10 text-center"
                        >
                            {{ t("common.loading") }}...
                        </div>

                        <div
                            v-else-if="!filteredProviders.length"
                            class="text-muted-foreground col-span-full py-10 text-center"
                        >
                            {{ t("common.empty") }}
                        </div>

                        <section
                            v-for="provider in filteredProviders"
                            :key="provider.id"
                            class="mb-2 space-y-2"
                        >
                            <div
                                class="hover:bg-muted/50 bg-background sticky top-0 z-10 flex cursor-pointer flex-row items-center justify-between rounded-md py-1 pr-2 backdrop-blur-sm transition-colors"
                                @click="toggleProvider(provider.id)"
                            >
                                <div class="flex flex-row items-center gap-2">
                                    <UIcon
                                        :name="
                                            isProviderExpanded(provider.id)
                                                ? 'i-lucide-chevron-down'
                                                : 'i-lucide-chevron-right'
                                        "
                                        class="text-muted-foreground transition-transform"
                                        size="sm"
                                    />
                                    <UAvatar
                                        :src="provider.iconUrl"
                                        :alt="provider.name"
                                        :ui="{ fallback: 'text-inverted' }"
                                        :class="provider.iconUrl ? '' : 'bg-primary'"
                                        size="2xs"
                                    />
                                    <h3 class="text-secondary-foreground text-sm font-semibold">
                                        {{ provider.name }}
                                    </h3>
                                </div>
                                <UBadge variant="soft" color="neutral" size="sm">
                                    {{ provider.models?.length }}{{ t("common.unit.general.item")
                                    }}{{ t("common.ai.model") }}
                                </UBadge>
                            </div>

                            <!-- Collapse animation transition -->
                            <Transition
                                enter-active-class="transition-all duration-200 ease-out"
                                leave-active-class="transition-all duration-200 ease-in"
                                enter-from-class="opacity-0 max-h-0"
                                enter-to-class="opacity-100 max-h-[2000px]"
                                leave-from-class="opacity-100 max-h-[2000px]"
                                leave-to-class="opacity-0 max-h-0"
                            >
                                <ul
                                    v-show="isProviderExpanded(provider.id)"
                                    class="overflow-hidden"
                                >
                                    <UPopover
                                        v-for="model in provider.models"
                                        :key="model.id"
                                        :mode="isScrolling ? undefined : 'hover'"
                                        :disabled="isScrolling"
                                        :content="{
                                            align: 'center',
                                            side: 'left',
                                            sideOffset: 15,
                                        }"
                                    >
                                        <li
                                            :data-model-id="model.id"
                                            class="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 ring-1 ring-transparent transition-colors"
                                            :class="[
                                                selected?.id === model.id
                                                    ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/15 dark:hover:bg-primary/25'
                                                    : 'hover:bg-muted',
                                            ]"
                                            @click="select(model)"
                                        >
                                            <div class="w-full overflow-hidden">
                                                <div class="flex items-start justify-between gap-2">
                                                    <p
                                                        class="max-w-54 text-sm font-medium break-all whitespace-normal"
                                                        :class="
                                                            selected?.id === model.id
                                                                ? 'text-primary'
                                                                : 'text-secondary-foreground'
                                                        "
                                                    >
                                                        {{ model.name }}
                                                    </p>
                                                    <div v-if="props.showBillingRule">
                                                        <UBadge
                                                            v-if="model.billingRule.power === 0"
                                                            variant="soft"
                                                            color="neutral"
                                                            size="sm"
                                                        >
                                                            {{ t("common.free") }}
                                                        </UBadge>
                                                        <span
                                                            v-else
                                                            class="text-inverted flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                            :class="
                                                                selected?.id === model.id
                                                                    ? 'bg-primary dark:bg-primary-800'
                                                                    : 'bg-primary/10 text-primary'
                                                            "
                                                        >
                                                            <span
                                                                >{{ model.billingRule.power
                                                                }}{{
                                                                    t("common.unit.points")
                                                                }}</span
                                                            >
                                                            <span>/</span>
                                                            <span
                                                                >{{
                                                                    model.billingRule.tokens
                                                                }}Tokens</span
                                                            >
                                                        </span>
                                                    </div>
                                                </div>
                                                <p
                                                    v-if="
                                                        props.showDescription && model.description
                                                    "
                                                    class="text-muted-foreground mt-0.5 line-clamp-1 text-xs"
                                                >
                                                    {{ model.description }}
                                                </p>
                                            </div>
                                        </li>

                                        <template #content>
                                            <ModelInfoPopover
                                                :model="model"
                                                :provider="provider"
                                                :show-billing-rule="props.showBillingRule"
                                            />
                                        </template>
                                    </UPopover>
                                </ul>
                            </Transition>
                        </section>
                    </BdScrollArea>
                </div>
            </div>
        </template>
    </UPopover>
</template>
