<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { computed, nextTick, onMounted, ref, shallowRef, watch } from "vue";
import type { Composer } from "vue-i18n";

import { formatDate, mergeTimeToDate, parseDateValue, parseToDate } from "../utils/date-format.ts";
import ProTimePicker from "./pro-time-picker.vue";

/** 组件属性接口定义 */
interface DatePickerProps {
    /** 绑定值，表示当前选中的日期 */
    modelValue?: Date | string | number | null;
    /** 日期格式样式，默认为 'medium' */
    dateStyle?: "full" | "long" | "medium" | "short";
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
    /** 是否显示时间选择器 */
    showTime?: boolean;
    /** 时间选择器格式 */
    timeFormat?: string;
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
interface DatePickerEmits {
    /** 当选中的日期变化时触发 */
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
    /** 修改日期时触发 */
    (e: "change", value: Date | string | number | null): void;
}

const { $i18n } = useNuxtApp();
const { t, locale } = $i18n as Composer;

const props = withDefaults(defineProps<DatePickerProps>(), {
    modelValue: null,
    dateStyle: "medium",
    timeStyle: "medium",
    disabled: false,
    readonly: false,
    clearable: true,
    size: "md",
    showTime: false,
    timeFormat: "HH:mm:ss",
    icon: "i-lucide-calendar",
    placement: "bottom",
});

const emit = defineEmits<DatePickerEmits>();

/** 是否打开弹出面板 */
const isOpen = ref(false);
/** 当前选中的日期 */
const selectedDate = shallowRef<CalendarDate | null>(null);
/** 当前选中的时间 */
const selectedTime = ref<Date | null>(null);
/** 时间选择器引用 */
const timePickerRef = useTemplateRef("timePickerRef");

/** 当前显示的月份和年份 */
const currentDate = computed(() => {
    if (selectedDate.value) {
        return selectedDate.value;
    }
    // 默认当前日期
    return new CalendarDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate(),
    );
});

/** 可选的月份列表 */
const months = [
    { value: 1, label: t("console-common.month.january") },
    { value: 2, label: t("console-common.month.february") },
    { value: 3, label: t("console-common.month.march") },
    { value: 4, label: t("console-common.month.april") },
    { value: 5, label: t("console-common.month.may") },
    { value: 6, label: t("console-common.month.june") },
    { value: 7, label: t("console-common.month.july") },
    { value: 8, label: t("console-common.month.august") },
    { value: 9, label: t("console-common.month.september") },
    { value: 10, label: t("console-common.month.october") },
    { value: 11, label: t("console-common.month.november") },
    { value: 12, label: t("console-common.month.december") },
];

/** 当前显示的月份 */
const currentMonth = computed({
    get: () => currentDate.value.month,
    set: (value: number) => {
        if (selectedDate.value) {
            // 使用 CalendarDate 的 set 方法创建新的日期对象
            selectedDate.value = selectedDate.value.set({ month: value });
        }
    },
});

/** 当前显示的年份 */
const currentYear = computed({
    get: () => currentDate.value.year,
    set: (value: number) => {
        if (selectedDate.value) {
            // 使用 CalendarDate 的 set 方法创建新的日期对象
            selectedDate.value = selectedDate.value.set({ year: value });
        }
    },
});

/** 可选的年份列表 */
const years = computed(() => {
    const currentYearValue = new Date().getFullYear();
    const years = [];
    for (let i = currentYearValue - 100; i <= currentYearValue + 10; i++) {
        years.push({ value: i, label: `${i}年` });
    }
    return years;
});

/** 格式化日期显示 */
const formattedDate = computed(() =>
    formatDate(props.modelValue, locale.value, props.dateStyle, props.timeStyle, props.showTime),
);

/** 初始化日期选择器的值 */
const initDateValue = () => {
    // 解析日期值
    selectedDate.value = parseDateValue(props.modelValue);

    // 初始化时间选择器
    if (props.showTime && props.modelValue) {
        const date = parseToDate(props.modelValue);
        const formatter = new DateFormatter("zh-CN", {
            dateStyle: undefined,
            timeStyle: props.timeStyle,
        });
        selectedTime.value = formatter.format(date as Date) as unknown as Date;
    }
};

/** 处理弹出层状态更新 */
const handlePopoverUpdate = (val: boolean) => {
    if (val) {
        emit("open");
        nextTick(() => {
            initDateValue();
        });
    } else {
        emit("close");
    }
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
    selectedDate.value = null;
    selectedTime.value = null;
    emit("update:modelValue", null);
    emit("clear");
    emit("change", null);
    isOpen.value = false;
};

/** 处理确认按钮点击 */
const handleConfirm = () => {
    isOpen.value = false;

    // 创建合并最终日期对象
    const finalDate = mergeTimeToDate(
        selectedDate?.value?.toDate(getLocalTimeZone()) as Date,
        selectedTime.value,
    );

    // 触发事件
    emit("update:modelValue", finalDate);
    emit("confirm", finalDate);
    emit("change", finalDate);
};

/** 处理取消按钮点击 */
const handleCancel = () => {
    isOpen.value = false;
    emit("cancel");
    emit("change", null);
};

/** 上一个月 */
const prevMonth = () => {
    if (selectedDate.value) {
        selectedDate.value = selectedDate.value.subtract({ months: 1 });
    }
};

/** 下一个月 */
const nextMonth = () => {
    if (selectedDate.value) {
        selectedDate.value = selectedDate.value.add({ months: 1 });
    }
};

/** 设置为当前时间并确认 */
const setNow = () => {
    const now = new Date();
    // 使用 CalendarDate 的构造函数直接创建日期
    selectedDate.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

    if (props.showTime) {
        selectedTime.value = new Date(now);
        if (timePickerRef.value) {
            timePickerRef.value.setTime(now);
        }
    }

    // 直接确认选择
    handleConfirm();
};

/** 监听modelValue变化 */
watch(
    () => props.modelValue,
    async (val) => {
        if (!val) return;
        initDateValue();
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

/** 组件挂载时初始化日期值 */
onMounted(initDateValue);
</script>

<template>
    <div
        class="pro-date-picker relative inline-flex w-full"
        :class="[size, { 'cursor-not-allowed opacity-60': disabled }]"
    >
        <UPopover
            v-model:open="isOpen"
            :disabled="disabled || readonly"
            :placement="placement"
            :popper="{ placement, strategy: 'fixed' }"
            :ui="{ width: 'w-auto' }"
            :prevent-close="true"
        >
            <!-- 输入框触发器 -->
            <div class="relative w-full" :class="ui?.root">
                <UInput
                    v-model="formattedDate"
                    :placeholder="t('console-common.placeholder.dateSelect')"
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
                            :class="formattedDate ? 'text-highlighted' : 'text-dimmed'"
                        />
                    </template>
                    <template #trailing>
                        <UButton
                            v-if="clearable && formattedDate && !disabled && !readonly"
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

            <template #content>
                <div class="pro-date-picker-panel bg-default w-[320px] p-4" @click.stop="">
                    <!-- 日历头部 -->
                    <div class="mb-2 flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <!-- 年份选择 -->
                            <USelect
                                v-model="currentYear"
                                :items="years"
                                option-attribute="value"
                                :ui="{
                                    base: 'min-w-[100px]',
                                    select: { base: 'py-1' },
                                }"
                                size="sm"
                            />

                            <!-- 月份选择 -->
                            <USelect
                                v-model="currentMonth"
                                :items="months"
                                option-attribute="value"
                                :ui="{
                                    base: 'min-w-[100px]',
                                    select: { base: 'py-1' },
                                }"
                                size="sm"
                            />
                        </div>

                        <!-- 月份导航按钮 -->
                        <div class="flex items-center space-x-1">
                            <UButton
                                icon="i-lucide-chevron-left"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                :padded="false"
                                @click="prevMonth"
                            />
                            <UButton
                                icon="i-lucide-chevron-right"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                :padded="false"
                                @click="nextMonth"
                            />
                        </div>
                    </div>

                    <!-- 日历主体 -->
                    <UCalendar
                        v-model="selectedDate"
                        :month-controls="false"
                        :year-controls="false"
                        color="primary"
                        size="sm"
                    />

                    <!-- 时间选择器（可选） -->
                    <div v-if="showTime" class="b mt-2 pt-2">
                        <ProTimePicker
                            ref="timePickerRef"
                            v-model="selectedTime"
                            :format="timeFormat"
                            :disabled="disabled"
                            :readonly="readonly"
                            :clearable="false"
                            size="sm"
                            :ui="{ root: 'w-full' }"
                        />
                    </div>

                    <!-- 操作按钮区域 -->
                    <div class="b mt-2 flex justify-between gap-2 pt-2">
                        <div>
                            <UButton size="sm" variant="soft" @click="setNow">
                                {{ t("console-common.now") }}
                            </UButton>
                        </div>
                        <div class="flex gap-2">
                            <UButton
                                size="sm"
                                variant="ghost"
                                icon="i-lucide-x"
                                @click="handleCancel"
                            ></UButton>
                            <UButton
                                size="sm"
                                icon="i-lucide-check"
                                :disabled="!selectedDate && !disabled"
                                @click="handleConfirm"
                            ></UButton>
                        </div>
                    </div>
                </div>
            </template>
        </UPopover>
    </div>
</template>
