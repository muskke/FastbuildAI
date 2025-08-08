<script lang="ts" setup>
/**
 * 专业滑动条组件
 * @description 左侧USlider + 右侧数值输入框的组合组件
 */
import { computed } from "vue";

interface Props {
    /** 当前值 */
    modelValue?: number;
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步长 */
    step?: number;
    /** 组件尺寸 */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** 是否禁用 */
    disabled?: boolean;
    /** 滑块颜色 */
    color?: string;
    /** 输入框宽度 */
    inputWidth?: string;
    /** 数值显示格式 */
    formatter?: (value: number) => string;
    /** 数值解析函数 */
    parser?: (displayValue: string) => number;
}

interface Emits {
    /** 更新值 */
    (e: "update:modelValue", value: number): void;
    /** 值改变事件 */
    (e: "change", value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    size: "sm",
    disabled: false,
    color: "primary",
    inputWidth: "60px",
    formatter: (value: number) => value.toString(),
    parser: (displayValue: string) => parseFloat(displayValue) || 0,
});

const emit = defineEmits<Emits>();

// 计算属性
const currentValue = computed({
    get: () => props.modelValue || 0,
    set: (value: number) => {
        // 确保值在合理范围内
        const clampedValue = Math.min(Math.max(value, props.min), props.max);
        emit("update:modelValue", clampedValue);
        emit("change", clampedValue);
    },
});

// 格式化显示值
const displayValue = computed({
    get: () => props.formatter(currentValue.value),
    set: (value: string) => {
        const numericValue = props.parser(value);
        if (!isNaN(numericValue)) {
            currentValue.value = numericValue;
        }
    },
});

/**
 * 处理滑块值变化
 */
function handleSliderChange(value: number) {
    currentValue.value = value;
}

/**
 * 处理输入框失焦
 */
function handleInputBlur() {
    // 确保输入值在范围内
    if (currentValue.value < props.min) {
        currentValue.value = props.min;
    } else if (currentValue.value > props.max) {
        currentValue.value = props.max;
    }
}
</script>

<template>
    <div class="flex items-center gap-3">
        <!-- 滑动条 -->
        <div class="flex-1">
            <USlider
                :model-value="currentValue"
                :min="min"
                :max="max"
                :step="step"
                :size="size"
                :disabled="disabled"
                :color="color"
                @update:model-value="handleSliderChange"
            />
        </div>

        <!-- 数值输入框 -->
        <div class="flex-shrink-0" :style="{ width: inputWidth }">
            <UInput
                v-model="displayValue"
                :size="size"
                :disabled="disabled"
                type="number"
                :min="min"
                :max="max"
                :step="step"
                class="text-center"
                :ui="{
                    base: 'text-center',
                }"
                @blur="handleInputBlur"
            />
        </div>
    </div>
</template> 