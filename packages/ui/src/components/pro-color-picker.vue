<script lang="ts" setup>
/**
 * 专业颜色选择器组件
 * @description 基于 UPopover 和 UColorPicker 的颜色选择器，支持点击弹出选择颜色
 */
import { computed, h, ref } from "vue";
import type { Composer } from "vue-i18n";

import { useModal } from "../composables/useModal";

interface Props {
    /** 当前颜色值 */
    modelValue?: string;
    /** 组件尺寸 */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** 是否禁用 */
    disabled?: boolean;
    /** 占位文本 */
    placeholder?: string;
    /** 显示格式 */
    format?: "hex" | "rgb" | "hsl";
    /** 预设颜色 */
    presets?: string[];
    /** 是否显示透明度滑块 */
    alpha?: boolean;
    /** 颜色块宽度 */
    colorWidth?: string;
    /** 颜色块高度 */
    colorHeight?: string;
}

interface Emits {
    /** 更新颜色值 */
    (e: "update:modelValue", value: string): void;
    /** 颜色改变事件 */
    (e: "change", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    size: "sm",
    disabled: false,
    placeholder: "",
    format: "hex",
    alpha: false,
    colorWidth: "22px",
    colorHeight: "22px",
    presets: () => ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082"],
});

const emit = defineEmits<Emits>();

// 国际化
const { $i18n } = useNuxtApp();
const { t } = $i18n as Composer;

// 弹出层状态
const isOpen = ref(false);
// 内部颜色值（用于UColorPicker）
const internalColor = ref("#000000");
const UInput = resolveComponent("UInput");

// 计算属性
const currentColor = computed({
    get: () => props.modelValue || "",
    set: (value: string) => {
        emit("update:modelValue", value);
        emit("change", value);
    },
});

// 检查是否为CSS变量
const isCssVar = computed(() => {
    return currentColor.value.startsWith("var(");
});

// 显示的颜色值（处理透明或空值）
const displayColor = computed(() => {
    if (!currentColor.value || currentColor.value === "transparent") {
        return "transparent";
    }
    return currentColor.value;
});

// 占位符文本
const placeholderText = computed(() => {
    return props.placeholder || t("console-common.placeholder.colorSelect");
});

// 颜色块样式
const colorBlockStyle = computed(() => {
    const baseStyle = {
        width: props.colorWidth,
        height: props.colorHeight,
    };

    if (!currentColor.value || currentColor.value === "transparent") {
        return {
            ...baseStyle,
            backgroundColor: "transparent",
            backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
        };
    }

    // 如果是CSS变量，直接使用
    if (isCssVar.value) {
        return {
            ...baseStyle,
            backgroundColor: currentColor.value,
        };
    }

    // 普通颜色值
    return {
        ...baseStyle,
        backgroundColor: currentColor.value,
    };
});

/**
 * 处理颜色选择
 */
function handleColorChange(color: string) {
    internalColor.value = color;
    currentColor.value = color;
}

/**
 * 处理弹出层打开
 */
function handleOpen() {
    // 如果当前值不是CSS变量且有值，设置到内部颜色
    if (!isCssVar.value && currentColor.value && currentColor.value !== "transparent") {
        internalColor.value = currentColor.value;
    }
}

/**
 * 处理弹出层关闭
 */
function handleClose() {
    isOpen.value = false;
}

/**
 * 处理预设颜色点击
 */
function handlePresetClick(color: string) {
    currentColor.value = color;
    internalColor.value = color;
    isOpen.value = false;
}

/**
 * 处理清空颜色
 */
function handleClear() {
    currentColor.value = "transparent";
    isOpen.value = false;
}

/**
 * 处理使用CSS变量
 */
async function handleUseCssVar() {
    const inputValue = ref("");

    // 如果当前已经是CSS变量，提取变量名作为默认值
    if (isCssVar.value) {
        const match = currentColor.value.match(/var\(([^)]+)\)/);
        if (match) {
            inputValue.value = match[1];
        }
    }

    try {
        const CssVarInput = markRaw({
            setup() {
                return () =>
                    h("div", { class: "space-y-4" }, [
                        h(
                            "div",
                            { class: "text-sm text-gray-600" },
                            t("console-common.colorPicker.cssVariableInputTip"),
                        ),
                        h(UInput, {
                            modelValue: inputValue.value,
                            "onUpdate:modelValue": (value: string) => {
                                inputValue.value = value;
                            },
                            placeholder: t("console-common.colorPicker.cssVariablePlaceholder"),
                            class: "w-full",
                            size: "md",
                        }),
                    ]);
            },
        });

        await useModal({
            title: t("console-common.colorPicker.setCssVariable"),
            description: t("console-common.colorPicker.setCssVariableDesc"),
            content: CssVarInput,
            confirmText: t("console-common.confirm"),
            cancelText: t("console-common.cancel"),
            color: "primary",
        });

        // 用户点击确定后的处理
        if (inputValue.value.trim()) {
            const varName = inputValue.value.trim();
            const cssVar = varName.startsWith("--") ? `var(${varName})` : `var(--${varName})`;
            currentColor.value = cssVar;
            isOpen.value = false;
        }
    } catch (error) {
        // 用户取消或关闭弹窗，不做任何处理
        console.log("用户取消了CSS变量设置");
    }
}
</script>

<template>
    <UPopover
        v-model:open="isOpen"
        :disabled="disabled"
        placement="bottom-start"
        @open="handleOpen"
    >
        <div class="relative">
            <!-- 触发按钮 -->
            <UButton
                variant="outline"
                :disabled="disabled"
                :size="size"
                class="w-full justify-between gap-2"
                :class="[disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer']"
            >
                <div class="flex items-center gap-2">
                    <!-- 颜色块 -->
                    <div
                        :style="colorBlockStyle"
                        class="size-2 rounded border border-gray-200 shadow-sm"
                        :class="{ 'ring-1 ring-blue-500': isCssVar }"
                    />

                    <!-- 颜色值显示 -->
                    <span
                        class="text-foreground text-left text-xs"
                        :class="{ 'text-blue-600': isCssVar }"
                    >
                        {{ displayColor || placeholderText }}
                    </span>
                </div>

                <!-- CSS变量标识 -->
                <span v-if="isCssVar" class="text-xs text-blue-500">{{
                    t("console-common.colorPicker.cssVariable")
                }}</span>
            </UButton>
        </div>

        <template #content>
            <div class="bg-background w-64 rounded-lg p-2">
                <!-- 颜色选择器 - 只在非CSS变量时显示 -->
                <div class="mb-4">
                    <UColorPicker
                        v-model="internalColor"
                        :format="format"
                        :alpha="alpha"
                        @update:model-value="handleColorChange"
                    />
                </div>

                <!-- CSS变量提示 -->
                <div v-if="isCssVar" class="mb-4 rounded bg-blue-50 p-2 text-xs text-blue-700">
                    {{ t("console-common.colorPicker.currentCssVariable") }}: {{ currentColor }}
                </div>

                <!-- 预设颜色 -->
                <div v-if="presets.length > 0" class="mb-4">
                    <div class="mb-2 text-xs font-medium text-gray-700">
                        {{ t("console-common.colorPicker.presetColors") }}
                    </div>
                    <div class="grid grid-cols-6 gap-2">
                        <button
                            v-for="preset in presets"
                            :key="preset"
                            type="button"
                            class="h-6 w-6 rounded ring-0 transition-transform outline-none hover:scale-110"
                            :style="{ backgroundColor: preset }"
                            @click="handlePresetClick(preset)"
                        />
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex justify-between gap-2">
                    <div class="flex gap-2">
                        <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="handleClear">
                            {{ t("console-common.colorPicker.clear") }}
                        </UButton>

                        <UButton
                            size="sm"
                            variant="ghost"
                            icon="i-lucide-code"
                            @click="handleUseCssVar"
                        >
                            {{ t("console-common.colorPicker.cssVariable") }}
                        </UButton>
                    </div>

                    <UButton size="sm" icon="i-lucide-check" @click="handleClose">
                        {{ t("console-common.confirm") }}
                    </UButton>
                </div>
            </div>
        </template>
    </UPopover>
</template>

<style scoped>
/* 透明背景棋盘格纹理 */
.transparent-bg {
    background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position:
        0 0,
        0 4px,
        4px -4px,
        -4px 0px;
}
</style>
