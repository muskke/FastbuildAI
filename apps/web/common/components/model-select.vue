<script setup lang="ts">
import { ProScrollArea } from "@fastbuildai/ui";
import type { ButtonProps } from "@nuxt/ui";
import { computed, onMounted, ref } from "vue";

import type { ModelType } from "@/models";
import type { AiModel, AiProvider } from "@/models/ai-conversation";
import { apiGetAiProviders, apiGetDefaultAiModel } from "@/services/web/ai-conversation";

interface Props {
    modelValue?: string;
    disabled?: boolean;
    showDescription?: boolean;
    defaultSelected?: boolean;
    console?: boolean;
    supportedModelTypes?: ModelType[];
    buttonUi?: ButtonProps;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
    showDescription: true,
    defaultSelected: true,
    console: false,
});

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "change", value: any): void;
}>();

const loading = ref(false);
const isOpen = ref(false);
const search = ref("");
const providers = ref<AiProvider[]>([]);
const selected = ref<AiModel | null>(null);

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
    localStorage.setItem("modelId", model?.id || "");
    emit("update:modelValue", model?.id || "");
    emit("change", model);
    isOpen.value = false;
    search.value = "";
}

async function loadModels() {
    if (loading.value) return;
    loading.value = true;
    try {
        providers.value = await apiGetAiProviders({
            supportedModelTypes: props.supportedModelTypes,
        });

        const findModel = (id?: string) => allModels.value.find((m) => m.id === id);

        if (!props.defaultSelected) {
            selected.value = findModel(props.modelValue) ?? null;
            return;
        }

        selected.value =
            findModel(localStorage.getItem("modelId") || "") ??
            findModel(props.modelValue) ??
            findModel((await apiGetDefaultAiModel().catch(() => null))?.id) ??
            allModels.value.find((m) => m.isDefault) ??
            allModels.value[0] ??
            null;

        selected.value && select(selected.value);
    } catch (e) {
        console.error("模型加载失败", e);
    } finally {
        loading.value = false;
    }
}

onMounted(loadModels);
</script>

<template>
    <UPopover v-model:open="isOpen" :disabled="props.disabled">
        <UButton
            :color="selected?.name ? 'primary' : 'neutral'"
            variant="ghost"
            class="flex items-center justify-between"
            :class="{ 'bg-primary/10': selected?.id }"
            :loading="loading"
            :disabled="props.disabled"
            v-bind="props.buttonUi"
            @click.stop
        >
            <span class="truncate">
                {{ selected?.name || t("console-common.placeholder.modelSelect") }}
            </span>
            <div class="flex items-center gap-2">
                <UIcon
                    name="i-lucide-x"
                    v-if="selected?.name && props.console"
                    @click.stop="select(null)"
                />

                <UIcon name="i-lucide-chevron-down" :class="{ 'rotate-180': isOpen }" />
            </div>
        </UButton>

        <template #content>
            <div class="bg-background w-80 overflow-hidden rounded-lg shadow-lg">
                <div class="border-b p-3">
                    <UInput
                        v-model="search"
                        :placeholder="t('console-common.placeholder.searchModel')"
                        size="lg"
                        :ui="{ root: 'w-full' }"
                    >
                        <template #leading><UIcon name="i-lucide-search" /></template>
                    </UInput>
                </div>

                <div
                    class="flex max-h-[calc((100vh-15rem)/3)] flex-col gap-3 p-2"
                    :class="{ 'md:grid-cols-2': filteredProviders.length > 1 }"
                >
                    <div
                        v-if="loading"
                        class="text-muted-foreground col-span-full py-10 text-center"
                    >
                        {{ t("console-common.loading") }}...
                    </div>

                    <div
                        v-else-if="!filteredProviders.length"
                        class="text-muted-foreground col-span-full py-10 text-center"
                    >
                        {{ t("console-common.empty") }}
                    </div>

                    <section
                        v-for="provider in filteredProviders"
                        :key="provider.id"
                        class="space-y-2"
                    >
                        <div class="flex flex-row items-center justify-between px-2">
                            <div class="flex flex-row items-center gap-2">
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
                            <div class="bg-muted-foreground/10 rounded-xl px-2 py-1 text-xs">
                                {{ provider.models?.length }}{{ t("common.unit.general.item")
                                }}{{ t("common.ai.model") }}
                            </div>
                        </div>
                        <ul class="space-y-1">
                            <li
                                v-for="model in provider.models"
                                :key="model.id"
                                class="group hover:bg-muted flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors"
                                :class="{ 'bg-secondary': selected?.id === model.id }"
                                @click="select(model)"
                            >
                                <div class="space-y-0.5 overflow-hidden">
                                    <p
                                        class="text-secondary-foreground truncate text-sm font-medium"
                                    >
                                        {{ model.name }}
                                    </p>
                                    <p
                                        v-if="props.showDescription && model.description"
                                        class="text-muted-foreground line-clamp-1 text-xs"
                                    >
                                        {{ model.description }}
                                    </p>
                                </div>
                                <UIcon
                                    v-if="selected?.id === model.id"
                                    name="i-lucide-check-circle"
                                    class="text-primary flex-none"
                                    size="lg"
                                />
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </template>
    </UPopover>
</template>
