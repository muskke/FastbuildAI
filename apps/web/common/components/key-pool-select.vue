<script setup lang="ts">
import { ProScrollArea } from "@fastbuildai/ui";
import type { AccordionItem, ButtonProps } from "@nuxt/ui";
import { computed, nextTick, onMounted, ref, watch } from "vue";

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
    // 是否显示计费规则
    showBillingRule?: boolean;
    // 是否打开本地存储
    openLocalStorage?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {
    showDescription: true,
    defaultSelected: true,
    console: false,
    showBillingRule: false,
    openLocalStorage: false,
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
const scrollAreaRef = ref<any>(null);

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

function select(key: AiModel | null) {
    if (selected.value === key) {
        selected.value = null;
    } else {
        selected.value = key;
    }

    emit("update:modelValue", key?.id || "");
    emit("change", key);
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
            (props.openLocalStorage ? findModel(localStorage.getItem("modelId") || "") : null) ??
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

/**
 * 滚动到选中的模型
 */
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

const items = ref<AccordionItem[]>([
    {
        id: "1",
        name: "模版名称1",
        icon: "https://i.pravatar.cc/150?img=1",
        fieldName: "字段1",
        isActived: true,
        keyList: [
            {
                id: "1",
                name: "名称1",
                value: "值1",
                isActived: true,
                createdAt: "2025-01-01",
            },
            {
                id: "2",
                name: "名称2",
                value: "值2",
                isActived: true,
                createdAt: "2025-01-01",
            },
        ],
        createdAt: "2025-01-01",
    },
    {
        id: "2",
        name: "模版名称2",
        icon: "https://i.pravatar.cc/150?img=2",
        fieldName: "字段2",
        isActived: false,
        keyList: [
            {
                id: "3",
                name: "名称3",
                value: "值3",
                isActived: false,
                createdAt: "2025-01-02",
            },
        ],
        createdAt: "2025-01-02",
    },
]);

// 监听弹窗打开状态，打开时自动定位到选中模型
watch(isOpen, (newValue) => {
    if (newValue) {
        scrollToSelectedModel();
    }
});

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
                    class="flex h-[calc((100vh-15rem)/3)] flex-col gap-3 p-2"
                    :class="{ 'md:grid-cols-2': filteredProviders.length > 1 }"
                >
                    <ProScrollArea ref="scrollAreaRef" class="h-full" type="hover" :shadow="false">
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

                        <UAccordion :items="items">
                            <template #leading="{ item }">
                                <div class="flex items-center gap-2">
                                    <UAvatar
                                        :src="item.icon"
                                        size="sm"
                                        :ui="{ image: 'rounded-md' }"
                                    />
                                    <div>{{ item.name }}</div>
                                </div>
                            </template>
                            <template #content="{ item }">
                                <ul class="space-y-1 pb-2">
                                    <li
                                        v-for="key in item.keyList"
                                        :key="key.id"
                                        :data-model-id="key.id"
                                        class="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 ring-1 ring-transparent transition-colors"
                                        :class="[
                                            selected?.id === key.id
                                                ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/15 dark:hover:bg-primary/25'
                                                : 'hover:bg-muted',
                                        ]"
                                        @click="select(key)"
                                    >
                                        <div class="w-full overflow-hidden">
                                            <div class="flex items-start justify-between gap-2">
                                                <p
                                                    class="max-w-54 text-sm font-medium break-all whitespace-normal"
                                                    :class="
                                                        selected?.id === key.id
                                                            ? 'text-primary'
                                                            : 'text-secondary-foreground'
                                                    "
                                                >
                                                    {{ key.name }}
                                                </p>
                                                <div v-if="props.showBillingRule">
                                                    <span
                                                        v-if="key.billingRule.power === 0"
                                                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                        :class="
                                                            selected?.id === key.id
                                                                ? 'bg-muted-foreground/10 dark:bg-green-800 dark:text-green-400'
                                                                : 'bg-muted-foreground/10'
                                                        "
                                                    >
                                                        免费
                                                    </span>
                                                    <span
                                                        v-else
                                                        class="text-inverted inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                        :class="
                                                            selected?.id === key.id
                                                                ? 'bg-primary dark:bg-primary-800'
                                                                : 'bg-primary/10 text-primary'
                                                        "
                                                    >
                                                        <span>{{ key.billingRule.power }}算力</span>
                                                        <span>/</span>
                                                        <span
                                                            >{{
                                                                key.billingRule.tokens
                                                            }}Tokens</span
                                                        >
                                                    </span>
                                                </div>
                                            </div>
                                            <p
                                                v-if="props.showDescription && key.description"
                                                class="text-muted-foreground mt-0.5 line-clamp-1 text-xs"
                                            >
                                                {{ key.description }}
                                            </p>
                                        </div>
                                        <!-- <UIcon
                                        v-if="selected?.id === model.id"
                                        name="i-lucide-check-circle"
                                        class="text-primary flex-none"
                                        size="lg"
                                    /> -->
                                    </li>
                                </ul>
                            </template>
                            <template #trailing="{ item, open }">
                                <div class="flex flex-1 items-center justify-end space-x-1">
                                    <div
                                        class="bg-muted-foreground/10 w-fit rounded-xl px-2 py-1 text-xs"
                                    >
                                        {{ item.keyList?.length }}{{ t("common.unit.general.item")
                                        }}{{ t("common.ai.model") }}
                                    </div>
                                    <UIcon
                                        :name="
                                            open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
                                        "
                                        size="lg"
                                    />
                                </div>
                            </template>
                        </UAccordion>
                    </ProScrollArea>
                </div>
            </div>
        </template>
    </UPopover>
</template>
