<script setup lang="ts">
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";
import { DateFormatter } from "@internationalized/date";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { Composer } from "vue-i18n";

import { parseToDate } from "../utils/date-format.ts";
/** 组件属性接口定义 */
interface TimePickerProps {
    /** 绑定值，表示当前选中的时间 */
    modelValue?: Date | string | number | null;
    /** 时间格式样式，默认为 medium */
    timeStyle?: "full" | "long" | "medium" | "short";
    /** 是否禁用组件 */
    disabled?: boolean;
    /** 是否只读 */
    readonly?: boolean;
    /** 是否可清空 */
    clearable?: boolean;
    /** 输入框尺寸 */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** 是否显示秒选择器 */
    showSeconds?: boolean;
    /** 自定义图标 */
    icon?: string;
    /** 自定义弹出位置 */
    placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";
    /** 变体 */
    variant?: "outline" | "soft" | "subtle" | "ghost" | "none";
    /** 颜色 */
    color?: "primary" | "secondary" | "success" | "error" | "warning" | "neutral" | "info";
    /** UI 自定义配置 */
    ui?: {
        root?: string;
        base?: string;
        [key: string]: string | undefined;
    };
}

/** 组件事件接口定义 */
interface TimePickerEmits {
    /** 当选中的时间变化时触发 */
    (e: "update:modelValue", value: Date | string | number | null): void;
    /** 当用户确认选择时触发 */
    (e: "confirm", value: Date | string | number | null): void;
    /** 当用户取消选择时触发 */
    (e: "cancel"): void;
    /** 当输入框获得焦点时触发 */
    (e: "focus", event: FocusEvent): void;
    /** 当输入框失去焦点时触发 */
    (e: "blur", event: FocusEvent): void;
    /** 当用户点击清除按钮时触发 */
    (e: "clear"): void;
    /** 当下拉面板打开时触发 */
    (e: "open"): void;
    /** 当下拉面板关闭时触发 */
    (e: "close"): void;
    /** 修改时间时触发 */
    (e: "change", value: Date | string | number | null): void;
}

const { $i18n } = useNuxtApp();
const { t } = $i18n as Composer;

const props = withDefaults(defineProps<TimePickerProps>(), {
    modelValue: null,
    timeStyle: "medium",
    disabled: false,
    readonly: false,
    clearable: true,
    size: "md",
    showSeconds: true,
    icon: "i-lucide-clock-3",
    placement: "bottom-start",
});

const emit = defineEmits<TimePickerEmits>();

/** 是否打开弹出面板 */
const isOpen = ref(false);
/** 选中的小时 */
const selectedHour = ref(0);
/** 选中的分钟 */
const selectedMinute = ref(0);
/** 选中的秒 */
const selectedSecond = ref(0);
/** 临时存储的时间值 */
const tempTimeValue = ref<Date | null>(null);
/** 小时选择器DOM引用 */
const hoursRef = useTemplateRef("hoursRef");
/** 分钟选择器DOM引用 */
const minutesRef = useTemplateRef("minutesRef");
/** 秒选择器DOM引用 */
const secondsRef = useTemplateRef("secondsRef");
/** 输入框引用 */
const inputRef = ref<HTMLInputElement | null>(null);

/** 格式化显示的时间值 */
const displayValue = computed(() => {
    const date = parseToDate(props.modelValue);
    if (!date) return "";
    const formatter = new DateFormatter("zh-CN", {
        dateStyle: undefined,
        timeStyle: props.timeStyle,
    });

    return formatter.format(date);
});

/** 格式化时间单元 */
const formatTimeUnit = (unit: number): string => {
    return unit.toString().padStart(2, "0");
};

/** 时间单位类型 */
type TimeUnitType = "hour" | "minute" | "second";

/** 时间单位配置映射 */
const TIME_UNIT_CONFIG = {
    hour: {
        ref: () => hoursRef,
        selector: ".hour-item",
        max: 24,
        value: () => selectedHour,
    },
    minute: {
        ref: () => minutesRef,
        selector: ".minute-item",
        max: 60,
        value: () => selectedMinute,
    },
    second: {
        ref: () => secondsRef,
        selector: ".second-item",
        max: 60,
        value: () => selectedSecond,
    },
} as const;

/** 初始化时间选择器的值 */
const initTimeValue = () => {
    // 如果没有值，使用当前时间
    const date = parseToDate(props.modelValue) || new Date();
    selectedHour.value = date.getHours();
    selectedMinute.value = date.getMinutes();
    selectedSecond.value = date.getSeconds();
    tempTimeValue.value = new Date(date);
};

/** 更新临时时间值 */
const updateTempTimeValue = () => {
    tempTimeValue.value = new Date();
    tempTimeValue.value.setHours(selectedHour.value, selectedMinute.value, selectedSecond.value);
};

/** 处理弹出层状态更新 */
const handlePopoverUpdate = (val: boolean) => {
    if (val) {
        // 打开面板时初始化时间值
        initTimeValue();
        emit("open");
        scrollToSelected();
    } else {
        emit("close");
    }
};

/** 滚动到指定项并居中显示 */
const scrollToItem = (type: TimeUnitType, index: number) => {
    nextTick(() => {
        const config = TIME_UNIT_CONFIG[type];
        const ref = config.ref().value;
        const viewport = ref?.getViewportElement?.()?.viewportElement;
        const items = viewport?.querySelectorAll(config.selector);
        const selectedItem = items?.[index];

        selectedItem?.scrollIntoView({ block: "center" });
    });
};

/** 滚动到所有选中项 */
const scrollToSelected = () => {
    // 使用setTimeout确保DOM完全渲染
    setTimeout(() => {
        scrollToItem("hour", selectedHour.value);
        scrollToItem("minute", selectedMinute.value);
        if (props.showSeconds) {
            scrollToItem("second", selectedSecond.value);
        }
    }, 50);
};

/** 处理滚动事件并找到最接近中心的项 */
const handleTimeScroll = (event: Event, type: TimeUnitType) => {
    if (!event.target) return;
    const target = event.target as HTMLElement;
    const { scrollTop, clientHeight } = target;
    const config = TIME_UNIT_CONFIG[type];
    const valueRef = config.value();

    // 获取所有项
    const items = target.querySelectorAll(config.selector);
    if (!items.length) return;

    // 找到最接近中心的项
    let closestItem: Element | null = null;
    let minDistance = Infinity;
    const centerY = target.getBoundingClientRect().top + clientHeight / 2;

    items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - centerY);

        if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
        }
    });

    // 如果找到最接近中心的项，更新选中的值
    if (closestItem) {
        const value = parseInt(closestItem?.textContent?.trim() || "0");
        valueRef.value = value;
        updateTempTimeValue();
        // 使用防抖函数确保滚动停止后才执行吸附
        debouncedSnap(type, value);
    }
};

// 使用防抖处理滚动结束事件
const debouncedSnap = useDebounceFn((type: TimeUnitType, value: number) => {
    scrollToItem(type, value);
}, 200);

/** 处理小时滚动事件 */
const handleHoursScroll = (event: Event) => {
    handleTimeScroll(event, "hour");
};

/** 处理分钟滚动事件 */
const handleMinutesScroll = (event: Event) => {
    handleTimeScroll(event, "minute");
};

/** 处理秒滚动事件 */
const handleSecondsScroll = (event: Event) => {
    handleTimeScroll(event, "second");
};

/** 处理时间单位点击 */
const handleTimeUnitClick = (type: TimeUnitType, value: number) => {
    const valueRef = TIME_UNIT_CONFIG[type].value();
    valueRef.value = value;
    updateTempTimeValue();
    scrollToItem(type, value);
};

/** 处理小时点击 */
const handleHourClick = (hour: number) => {
    handleTimeUnitClick("hour", hour);
};

/** 处理分钟点击 */
const handleMinuteClick = (minute: number) => {
    handleTimeUnitClick("minute", minute);
};

/** 处理秒点击 */
const handleSecondClick = (second: number) => {
    handleTimeUnitClick("second", second);
};

/** 处理输入框获得焦点 */
const handleFocus = (event: FocusEvent) => {
    if (!props.disabled && !props.readonly) {
        emit("focus", event);
    }
};

/** 处理输入框失去焦点 */
const handleBlur = (event: FocusEvent) => {
    emit("blur", event);
};

/** 处理清除按钮点击 */
const handleClear = (event: Event) => {
    event.stopPropagation();
    emit("update:modelValue", null);
    emit("clear");
    emit("change", null);
    isOpen.value = false;
};

/** 处理确认按钮点击 */
const handleConfirm = () => {
    updateTempTimeValue();
    emit("update:modelValue", tempTimeValue.value);
    emit("confirm", tempTimeValue.value);
    emit("change", tempTimeValue.value);
    isOpen.value = false;
};

/** 处理取消按钮点击 */
const handleCancel = () => {
    emit("cancel");
    emit("change", null);
    isOpen.value = false;
};

/** 设置为当前时间并确认 */
const setNow = () => {
    const now = new Date();
    selectedHour.value = now.getHours();
    selectedMinute.value = now.getMinutes();
    selectedSecond.value = now.getSeconds();
    tempTimeValue.value = new Date(now);
    handleConfirm();
};

/** 阻止点击事件冒泡 */
const handlePanelClick = (event: MouseEvent) => {
    event.stopPropagation();
};

/** 监听modelValue变化 */
watch(
    () => props.modelValue,
    async (val) => {
        if (!val) return;
        initTimeValue();
        if (isOpen.value) {
            await nextTick();
            scrollToSelected();
        }
    },
);

/** 监听isOpen变化 */
watch(
    () => isOpen.value,
    (val) => {
        handlePopoverUpdate(val);
    },
    { immediate: false },
);

/** 组件挂载时初始化键盘事件和时间值 */
onMounted(() => {
    // 初始化时间值
    initTimeValue();
});

/** 暴露组件方法 */
defineExpose({
    /** 打开下拉面板 */
    open: () => {
        if (!props.disabled && !props.readonly) {
            isOpen.value = true;
        }
    },

    /** 关闭下拉面板 */
    close: () => {
        isOpen.value = false;
    },

    /** 聚焦输入框 */
    focus: () => {
        inputRef.value?.focus?.();
    },

    /** 使输入框失去焦点 */
    blur: () => {
        inputRef.value?.blur?.();
    },

    /** 清空选择 */
    clear: () => {
        emit("update:modelValue", null);
        emit("clear");
    },

    /** 获取当前选中的时间值 */
    getTime: () => tempTimeValue.value,

    /** 设置时间值 */
    setTime: (time: Date | string | number) => {
        const date = parseToDate(time);
        if (date) {
            emit("update:modelValue", date);
            selectedHour.value = date.getHours();
            selectedMinute.value = date.getMinutes();
            selectedSecond.value = date.getSeconds();
            tempTimeValue.value = new Date(date);
        }
    },

    /** 设置为当前时间并确认 */
    setNow: () => {
        const now = new Date();
        selectedHour.value = now.getHours();
        selectedMinute.value = now.getMinutes();
        selectedSecond.value = now.getSeconds();
        tempTimeValue.value = new Date(now);
        handleConfirm();
    },
});

defineShortcuts({
    o: () => (isOpen.value = !isOpen.value),
});
</script>

<template>
    <div
        class="pro-time-picker relative inline-flex w-full"
        :class="[{ 'cursor-not-allowed opacity-60': disabled }]"
    >
        <UPopover
            v-model:open="isOpen"
            :disabled="disabled || readonly"
            :placement="placement"
            :popper="{ strategy: 'fixed' }"
            :ui="{ width: 'w-auto' }"
            :prevent-close="true"
        >
            <!-- 输入框触发器 -->
            <div class="relative w-full" :class="ui?.root">
                <UInput
                    v-model="displayValue"
                    :placeholder="t('console-common.placeholder.timeSelect')"
                    :disabled="disabled"
                    :readonly="true"
                    :size="size"
                    :color="color"
                    :variant="variant"
                    :class="{ 'cursor-default': readonly }"
                    :ui="{
                        ...ui,
                        root: ui?.root || 'w-full',
                        base: `${isOpen ? 'ring-2 ring-inset ring-primary' : ''} text-left ${ui?.base}`,
                    }"
                    @focus="handleFocus"
                    @blur="handleBlur"
                >
                    <template #leading>
                        <UIcon
                            :name="icon"
                            :class="displayValue ? 'text-highlighted' : 'text-dimmed'"
                        />
                    </template>
                    <template #trailing>
                        <UButton
                            v-if="clearable && displayValue && !disabled && !readonly"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-x"
                            :padded="false"
                            size="xs"
                            @click.stop="handleClear"
                        />
                    </template>
                </UInput>
            </div>

            <!-- 时间选择面板 -->
            <template #content>
                <div class="bg-default flex w-[240px] flex-col p-4" @click="handlePanelClick">
                    <div class="">
                        <!-- 时间选择区域 -->
                        <div class="flex h-[200px] justify-between">
                            <!-- 小时选择 -->
                            <div class="mx-1 flex flex-1 flex-col text-center">
                                <div class="text-foreground py-2 text-sm">
                                    {{ t("console-common.time.hour") }}
                                </div>
                                <ProScrollArea
                                    class="relative flex-1"
                                    type="hover"
                                    :shadow="false"
                                    ref="hoursRef"
                                    @scroll="handleHoursScroll"
                                >
                                    <!-- 顶部填充 -->
                                    <div class="h-[70px]"></div>

                                    <div
                                        v-for="hour in 24"
                                        :key="`hour-${hour - 1}`"
                                        class="hour-item text-foreground cursor-pointer py-1.5 text-sm transition-all select-none"
                                        :class="{
                                            'text-primary-500 font-semibold':
                                                selectedHour === hour - 1,
                                        }"
                                        @click="handleHourClick(hour - 1)"
                                    >
                                        {{ formatTimeUnit(hour - 1) }}
                                    </div>

                                    <!-- 底部填充 -->
                                    <div class="h-[70px]"></div>
                                </ProScrollArea>
                            </div>

                            <!-- 分钟选择 -->
                            <div class="mx-1 flex flex-1 flex-col text-center">
                                <div class="text-foreground py-2 text-sm">
                                    {{ t("console-common.time.minute") }}
                                </div>
                                <ProScrollArea
                                    class="relative flex-1"
                                    type="hover"
                                    :shadow="false"
                                    ref="minutesRef"
                                    @scroll="handleMinutesScroll"
                                >
                                    <!-- 顶部填充 -->
                                    <div class="h-[70px]"></div>

                                    <div
                                        v-for="minute in 60"
                                        :key="`minute-${minute - 1}`"
                                        class="minute-item text-foreground cursor-pointer py-1.5 text-sm transition-all select-none"
                                        :class="{
                                            'text-primary-500 font-semibold':
                                                selectedMinute === minute - 1,
                                        }"
                                        @click="handleMinuteClick(minute - 1)"
                                    >
                                        {{ formatTimeUnit(minute - 1) }}
                                    </div>

                                    <!-- 底部填充 -->
                                    <div class="h-[70px]"></div>
                                </ProScrollArea>
                            </div>

                            <!-- 秒选择（可选） -->
                            <div v-if="showSeconds" class="mx-1 flex flex-1 flex-col text-center">
                                <div class="text-foreground py-2 text-sm">
                                    {{ t("console-common.time.second") }}
                                </div>
                                <ProScrollArea
                                    class="relative flex-1"
                                    type="hover"
                                    :shadow="false"
                                    ref="secondsRef"
                                    @scroll="handleSecondsScroll"
                                >
                                    <!-- 顶部填充 -->
                                    <div class="h-[70px]"></div>

                                    <div
                                        v-for="second in 60"
                                        :key="`second-${second - 1}`"
                                        class="second-item text-foreground cursor-pointer py-1.5 text-sm transition-all select-none"
                                        :class="{
                                            'text-primary-500 font-semibold':
                                                selectedSecond === second - 1,
                                        }"
                                        @click="handleSecondClick(second - 1)"
                                    >
                                        {{ formatTimeUnit(second - 1) }}
                                    </div>

                                    <!-- 底部填充 -->
                                    <div class="h-[70px]"></div>
                                </ProScrollArea>
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮区域 -->
                    <div class="flex justify-between gap-2 pt-2">
                        <div>
                            <UButton size="sm" variant="ghost" @click="setNow">
                                {{ t("console-common.now") }}
                            </UButton>
                        </div>
                        <div class="flex gap-2">
                            <UButton
                                size="sm"
                                icon="i-lucide-x"
                                variant="ghost"
                                @click="handleCancel"
                            ></UButton>
                            <UButton
                                size="sm"
                                icon="i-lucide-check"
                                @click="handleConfirm"
                            ></UButton>
                        </div>
                    </div>
                </div>
            </template>
        </UPopover>
    </div>
</template>
