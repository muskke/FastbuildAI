<script setup lang="ts">
import { ProScrollArea } from "@fastbuildai/ui";
import type { ButtonProps } from "@nuxt/ui";
import { computed, nextTick, onMounted, ref, watch } from "vue";

import type { ModelType } from "@/models";
import type { KeyConfig, KeyTemplateRequest } from "@/models/key-templates";
import { getApiKeyTemplateListAll } from "@/services/console/api-key-type";

interface Props {
    modelValue?: string;
    disabled?: boolean;
    showDescription?: boolean;
    defaultSelected?: boolean;
    console?: boolean;
    supportedModelTypes?: ModelType[];
    buttonUi?: ButtonProps;
    showBillingRule?: boolean;
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
    "update:modelValue": [value: string];
    change: [value: KeyConfig | null];
}>();

const loading = ref(false);
const isOpen = ref(false);
const search = ref("");
const selected = ref<KeyConfig | null>(null);
const scrollAreaRef = ref<InstanceType<typeof ProScrollArea> | null>(null);
const items = ref<KeyTemplateRequest[]>([]);
const expandedItems = ref<Set<string>>(new Set());

// Computed: Filtered items based on search query
const filteredItems = computed(() => {
    const query = search.value.trim().toLowerCase();
    return query
        ? items.value
              .map((item) => ({
                  ...item,
                  keyConfigs: item.keyConfigs.filter(
                      (key) =>
                          key.name.toLowerCase().includes(query) ||
                          item.name.toLowerCase().includes(query),
                  ),
              }))
              .filter(
                  (item) => item.name.toLowerCase().includes(query) || item.keyConfigs.length > 0,
              )
        : items.value;
});

// Computed: Display text for selected model
const selectedDisplayText = computed(() => {
    if (!selected.value) return "";
    const parentPool = items.value.find((item) =>
        item.keyConfigs.some((key) => key.id === selected.value?.id),
    );
    return parentPool ? `${parentPool.name}/${selected.value.name}` : selected.value.name;
});

// Computed: All key configs for lookup
const allKeyConfigs = computed(() => items.value.flatMap((item) => item.keyConfigs));

// Select a key config and emit events
function selectModel(keyConfig: KeyConfig | null) {
    selected.value = keyConfig;
    emit("update:modelValue", keyConfig?.id ?? "");
    emit("change", keyConfig);
    isOpen.value = false;
    search.value = "";
}

// Load data from API
async function loadData() {
    if (loading.value) return;
    loading.value = true;
    try {
        items.value = await getApiKeyTemplateListAll();

        // Ensure all items are expanded by default
        expandedItems.value = new Set(items.value.map((item) => item.id));

        const findKeyConfig = (id?: string) => allKeyConfigs.value.find((k) => k.id === id);
        if (!props.defaultSelected) {
            selected.value = findKeyConfig(props.modelValue) ?? null;
            return;
        }

        selected.value =
            (props.openLocalStorage
                ? findKeyConfig(localStorage.getItem("modelId") ?? "")
                : null) ??
            findKeyConfig(props.modelValue) ??
            allKeyConfigs.value[0] ??
            null;

        if (selected.value) selectModel(selected.value);
    } catch (error) {
        console.error("Failed to load key templates:", error);
    } finally {
        loading.value = false;
    }
}

// Scroll to selected key config
async function scrollToSelected() {
    if (!selected.value || !isOpen.value || !scrollAreaRef.value) return;
    await nextTick();
    const selectedElement = document.querySelector(`[data-model-id="${selected.value.id}"]`);
    selectedElement?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Toggle item expansion
function toggleExpanded(itemId: string) {
    const newSet = new Set(expandedItems.value);
    newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
    expandedItems.value = newSet;
}

// Watch popover state
watch(isOpen, (open) => {
    if (open) scrollToSelected();
});

// Initialize on mount
onMounted(() => {
    loadData();
});
</script>

<template>
    <UPopover v-model:open="isOpen" :disabled="props.disabled">
        <UButton
            :color="selected ? 'primary' : 'neutral'"
            variant="ghost"
            class="flex w-full items-center justify-between"
            :class="{ 'bg-primary/10': selected?.id }"
            :loading="loading"
            :disabled="props.disabled"
            v-bind="props.buttonUi"
            @click.stop
        >
            <span class="truncate">
                {{ selectedDisplayText || t("console-common.placeholder.modelSelect") }}
            </span>
            <div class="flex items-center gap-2">
                <UIcon
                    v-if="selected && props.console"
                    name="i-lucide-x"
                    class="h-4 w-4"
                    @click.stop="selectModel(null)"
                />
                <UIcon
                    name="i-lucide-chevron-down"
                    class="h-4 w-4"
                    :class="{ 'rotate-180': isOpen }"
                />
            </div>
        </UButton>

        <template #content>
            <div class="border-border bg-background w-[380px] rounded-lg border shadow-lg">
                <!-- Search bar -->
                <div class="p-3">
                    <UInput
                        v-model="search"
                        :placeholder="t('console-common.placeholder.searchModel')"
                        size="sm"
                        class="w-full"
                        :ui="{
                            base: 'bg-muted/30 border-border/50 focus:border-primary/50 focus:ring-primary/20',
                        }"
                    >
                        <template #leading>
                            <UIcon name="i-lucide-search" class="text-muted-foreground h-4 w-4" />
                        </template>
                    </UInput>
                </div>

                <!-- Content area -->
                <div class="grid h-full">
                    <ProScrollArea
                        ref="scrollAreaRef"
                        class="max-h-[400px] min-h-[200px] px-2 pb-2"
                        type="hover"
                        :shadow="false"
                    >
                        <!-- Loading state -->
                        <div
                            v-if="loading"
                            class="text-muted-foreground flex flex-col items-center justify-center py-12"
                        >
                            <UIcon name="i-lucide-loader-2" class="mb-2 h-6 w-6 animate-spin" />
                            <span class="text-sm">{{ t("console-common.loading") }}</span>
                        </div>

                        <!-- Empty state -->
                        <div
                            v-if="!filteredItems.length"
                            class="text-muted-foreground flex flex-col items-center justify-center py-12"
                        >
                            <UIcon name="i-lucide-database" class="mb-3 h-8 w-8 opacity-50" />
                            <span class="text-sm font-medium">
                                {{ search ? "没有找到匹配的结果" : t("console-common.empty") }}
                            </span>
                            <span class="mt-1 text-xs">
                                {{ search ? "请尝试其他关键词" : "暂无可用的密钥池" }}
                            </span>
                        </div>

                        <!-- Tree list -->
                        <div v-else class="py-1">
                            <template v-for="item in filteredItems" :key="item.id">
                                <div v-if="item.keyConfigs.length > 0" class="mb-1">
                                    <!-- Parent item (key template) -->
                                    <div
                                        class="group hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                                        @click="toggleExpanded(item.id)"
                                    >
                                        <img
                                            :src="item.icon"
                                            alt="icon"
                                            class="h-4 w-4 flex-shrink-0"
                                        />
                                        <span class="text-foreground flex-1 truncate font-medium">{{
                                            item.name
                                        }}</span>
                                        <div
                                            class="text-muted-foreground flex items-center gap-1 text-xs"
                                        >
                                            <span>({{ item.keyConfigs.length }})</span>
                                            <UBadge
                                                :color="
                                                    item.isEnabled === 1 ? 'success' : 'neutral'
                                                "
                                                variant="solid"
                                                size="xs"
                                            />
                                        </div>
                                        <UIcon
                                            :name="
                                                expandedItems.has(item.id)
                                                    ? 'i-lucide-chevron-down'
                                                    : 'i-lucide-chevron-right'
                                            "
                                            class="text-muted-foreground h-3 w-3 transition-transform duration-150"
                                        />
                                    </div>

                                    <!-- Child items (key configs) -->
                                    <Transition
                                        enter-active-class="transition-all duration-150 ease-out"
                                        enter-from-class="opacity-0 -translate-y-1"
                                        enter-to-class="opacity-100 translate-y-0"
                                        leave-active-class="transition-all duration-150 ease-in"
                                        leave-from-class="opacity-100 translate-y-0"
                                        leave-to-class="opacity-0 -translate-y-1"
                                    >
                                        <div
                                            v-if="expandedItems.has(item.id)"
                                            class="border-border/30 ml-4 border-l pl-3"
                                        >
                                            <div
                                                v-for="key in item.keyConfigs"
                                                :key="key.id"
                                                :data-model-id="key.id"
                                                class="group/key hover:bg-muted/30 hover:text-foreground flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                                                :class="{
                                                    'bg-primary/10 text-primary':
                                                        selected?.id === key.id,
                                                }"
                                                @click="selectModel(key)"
                                            >
                                                <UIcon
                                                    name="i-lucide-file-key-2"
                                                    class="h-4 w-4 flex-shrink-0"
                                                    :class="{
                                                        'text-primary': selected?.id === key.id,
                                                        'text-muted-foreground/70':
                                                            selected?.id !== key.id,
                                                    }"
                                                />
                                                <span class="flex-1 truncate font-medium">{{
                                                    key.name
                                                }}</span>
                                                <UBadge
                                                    :color="
                                                        key.status === 1 ? 'success' : 'neutral'
                                                    "
                                                    variant="solid"
                                                    size="xs"
                                                />
                                                <UIcon
                                                    v-if="selected?.id === key.id"
                                                    name="i-lucide-check"
                                                    class="text-primary h-3 w-3"
                                                />
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </template>
                        </div>
                    </ProScrollArea>
                </div>
            </div>
        </template>
    </UPopover>
</template>
