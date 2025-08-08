<script lang="ts" setup>
/**
 * 链接选择器组件
 * @description 支持系统页面、插件页面、自定义链接的选择器
 */
import ProModal from "@fastbuildai/ui/components/pro-modal.vue";
import { computed, ref } from "vue";

import type { LinkItem, LinkPickerEmits, LinkPickerProps } from "./types";
const LinkPickerContent = defineAsyncComponent(() => import("./link-picker-content.vue"));

const { t } = useI18n();

// 组件属性
const props = withDefaults(defineProps<LinkPickerProps>(), {
    placeholder: "",
    clearable: true,
    size: "md",
});

// 组件事件
const emit = defineEmits<LinkPickerEmits>();

// 响应式状态
const isModalOpen = ref(false);
const selectedLink = ref<LinkItem | null>(props.modelValue || null);

// 计算属性
const displayValue = computed(() => {
    if (!selectedLink.value) return "";
    return selectedLink.value.name || selectedLink.value.path || "";
});

const placeholderText = computed(() => {
    return props.placeholder || t("console-common.linkPicker.placeholder");
});

const hasValue = computed(() => !!selectedLink.value);

/**
 * 打开选择器模态框
 */
const openPicker = () => {
    isModalOpen.value = true;
};

/**
 * 清除选择
 */
const clearSelection = () => {
    selectedLink.value = null;
    emit("update:modelValue", null);
    emit("change", null);
};

/**
 * 处理链接选择
 */
const handleLinkSelect = (link: LinkItem) => {
    selectedLink.value = link;
    emit("update:modelValue", link);
    emit("change", link);
    isModalOpen.value = false;
};

/**
 * 处理模态框关闭
 */
const handleModalClose = () => {
    isModalOpen.value = false;
};

// 监听外部值变化
watch(
    () => props.modelValue,
    (newValue) => {
        selectedLink.value = newValue || null;
    },
    { immediate: true },
);
</script>

<template>
    <div class="link-picker w-full">
        <!-- 选择器模态框 -->
        <ProModal
            v-model="isModalOpen"
            :title="t('console-common.linkPicker.title')"
            :description="t('console-common.linkPicker.description')"
            :ui="{
                content: 'max-w-5xl max-h-[80vh]',
                body: 'p-0',
            }"
            @close="handleModalClose"
        >
            <template #trigger>
                <!-- 触发输入框 -->
                <UInput
                    :model-value="displayValue"
                    :placeholder="placeholderText"
                    :size="size"
                    readonly
                    :ui="{ base: 'cursor-pointer' }"
                    @click="openPicker"
                >
                    <template #trailing>
                        <div class="flex items-center gap-1">
                            <!-- 清除按钮 -->
                            <UButton
                                v-if="clearable && hasValue"
                                icon="i-heroicons-x-mark"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                                @click.stop="clearSelection"
                            />
                        </div>
                    </template>
                </UInput>
            </template>

            <LinkPickerContent
                :selected="selectedLink"
                @select="handleLinkSelect"
                @close="handleModalClose"
            />
        </ProModal>
    </div>
</template>
