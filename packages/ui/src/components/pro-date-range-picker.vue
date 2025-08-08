<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import type { Composer } from "vue-i18n";

import { formatDate, mergeTimeToDate, parseDateValue, parseToDate } from "../utils/date-format.ts";
import ProTimePicker from "./pro-time-picker.vue";

/** 组件属性接口定义 */
interface DateRangePickerProps {
    /** 开始日期绑定值 */
    start?: Date | string | number | null;
    /** 结束日期绑定值 */
    end?: Date | string | number | null;
    /** 日期格式，默认为 'medium' */
    dateStyle?: "full" | "long" | "medium" | "short";
    /** 是否禁用组件 */
    disabled?: boolean;
    /** 占位文本 */
    placeholder?: string;
    /** 是否只读 */
    readonly?: boolean;
    /** 是否可清空 */
    clearable?: boolean;
    /** 输入框尺寸 */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** 自定义图标 */
    icon?: string;
    /** 自定义弹出位置 */
    placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";
    /** 变体 */
    variant?: "outline" | "soft" | "subtle" | "ghost" | "none";
    /** 颜色 */
    color?: "primary" | "secondary" | "success" | "error" | "warning" | "neutral" | "info";
    /** 显示的月份数量 */
    numberOfMonths?: number;
    /** 是否显示时间选择器 */
    showTime?: boolean;
    /** 时间选择器格式 */
    timeFormat?: string;
    /** UI 自定义配置 */
    ui?: {
        root?: string;
        base?: string;
        [key: string]: string | undefined;
    };
}

/** 组件事件接口定义 */
interface DateRangePickerEmits {
    /** 当开始日期变化时触发 */
    (e: "update:start", value: Date | null): void;
    /** 当结束日期变化时触发 */
    (e: "update:end", value: Date | null): void;
    /** 当用户确认选择时触发 */
    (e: "confirm", start: Date | null, end: Date | null): void;
    /** 当用户取消选择时触发 */
    (e: "cancel"): void;
    /** 当用户清除按钮时触发 */
    (e: "clear"): void;
    /** 当下拉面板打开时触发 */
    (e: "open"): void;
    /** 当下拉面板关闭时触发 */
    (e: "close"): void;
    /** 修改日期范围时触发 */
    (e: "change", start: Date | null, end: Date | null): void;
}

const { $i18n } = useNuxtApp();
const { t, locale } = $i18n as Composer;

const props = withDefaults(defineProps<DateRangePickerProps>(), {
    start: null,
    end: null,
    dateStyle: "medium",
    disabled: false,
    readonly: false,
    clearable: true,
    size: "md",
    icon: "i-lucide-calendar-range",
    placement: "bottom",
    numberOfMonths: 2,
    showTime: false,
    timeFormat: "HH:mm:ss",
});

const emit = defineEmits<DateRangePickerEmits>();

/** 是否打开弹出面板 */
const isOpen = ref(false);

/** 当前选中的日期范围 */
const selectedRange = shallowRef<{ start: CalendarDate | null; end: CalendarDate | null }>({
    start: null,
    end: null,
});

/** 当前选中的开始和结束时间 */
const selectedStartTime = ref<Date | null>(null);
const selectedEndTime = ref<Date | null>(null);

/** 格式化开始和结束日期显示 */
const formattedStartDate = computed(() =>
    formatDate(props.start, locale.value, props.dateStyle, "short", false),
);
const formattedEndDate = computed(() =>
    formatDate(props.end, locale.value, props.dateStyle, "short", false),
);

/** 初始化日期选择器的值 */
const initDateValue = () => {
    // 解析开始日期和结束日期
    const start = parseDateValue(props.start);
    const end = parseDateValue(props.end);

    // 更新选中范围
    selectedRange.value = { start, end };

    // 初始化时间选择器
    if (props.showTime) {
        selectedStartTime.value = initTimeValue(props.start);
        selectedEndTime.value = initTimeValue(props.end);
    }
};

/** 处理弹出层状态更新 */
const handlePopoverUpdate = (val: boolean) => {
    if (val) {
        emit("open");
    } else {
        emit("close");
    }
};

/** 处理清除按钮点击 */
const handleClear = (event: Event) => {
    if (props.disabled || props.readonly) return;
    event.stopPropagation();

    // 清空选中和确认的值
    selectedRange.value = { start: null, end: null };
    selectedStartTime.value = null;
    selectedEndTime.value = null;

    // 触发事件
    emit("update:start", null);
    emit("update:end", null);
    emit("clear");
    emit("change", null, null);
    isOpen.value = false;
};

/** 处理确认按钮点击 */
const handleConfirm = () => {
    // 转换日期并应用时间
    const startDate = selectedRange.value.start?.toDate(getLocalTimeZone());
    const endDate = selectedRange.value.end?.toDate(getLocalTimeZone());

    // 应用时间组件
    if (startDate) {
        mergeTimeToDate(startDate, props.showTime ? selectedStartTime.value : null);
    }

    if (endDate) {
        mergeTimeToDate(endDate, props.showTime ? selectedEndTime.value : null);
    }

    // 触发事件并关闭弹出面板
    emit("update:start", startDate || null);
    emit("update:end", endDate || null);
    emit("confirm", startDate || null, endDate || null);
    emit("change", startDate || null, endDate || null);
    isOpen.value = false;
};

/** 处理取消按钮点击 */
const handleCancel = () => {
    // 恢复为之前确认的值
    selectedRange.value = { start: null, end: null };
    selectedStartTime.value = null;
    selectedEndTime.value = null;

    emit("cancel");
    emit("change", null, null);
    isOpen.value = false;
};

/** 设置日期范围快捷方式 */
const setDateRange = (days = 0, months = 0) => {
    const today = new CalendarDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate(),
    );
    const end = today;

    // 创建开始日期，根据指定的天数或月数向前推
    let start: CalendarDate;
    if (days > 0) {
        start = today.subtract({ days });
    } else if (months > 0) {
        start = today.subtract({ months });
    } else {
        start = today;
    }

    selectedRange.value = { start, end };
};

/** 初始化时间值 */
const initTimeValue = (dateValue: Date | string | number | null): Date => {
    if (!dateValue) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }

    return parseToDate(dateValue) || new Date();
};

/** 监听props变化 */
watch([() => props.start, () => props.end], () => {
    if (!isOpen.value) {
        initDateValue();
    }
});

/** 监听isOpen变化 */
watch(() => isOpen.value, handlePopoverUpdate);

/** 组件挂载时初始化日期值 */
onMounted(initDateValue);
</script>

<template>
    <div
        class="pro-date-range-picker relative inline-flex"
        :class="[size, { 'cursor-not-allowed opacity-60': disabled }]"
    >
        <UPopover
            v-model:open="isOpen"
            :disabled="disabled || readonly"
            :placement="placement"
            :ui="{ width: 'w-auto' }"
        >
            <!-- 输入框触发器 -->
            <div class="relative w-full" :class="ui?.root">
                <UInput
                    placeholder=""
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
                >
                    <template #leading>
                        <UIcon :name="icon" class="text-dimmed" />
                        <div
                            class="text-dimmed ml-3 flex items-center justify-between text-sm select-none"
                            :class="formattedStartDate ? 'text-highlighted' : 'text-dimmed'"
                        >
                            <template v-if="formattedStartDate">
                                <span>{{ formattedStartDate }}</span>
                                <span class="mx-4">-</span>
                                <span>{{ formattedEndDate }}</span>
                            </template>
                            <template v-else>
                                {{ t("console-common.placeholder.dateRange") }}
                            </template>
                        </div>
                    </template>
                    <template #trailing>
                        <UButton
                            v-if="clearable && !disabled && !readonly && formattedStartDate"
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
                <div class="p-4">
                    <div class="flex">
                        <!-- 快捷方式按钮 -->
                        <div class="flex flex-col gap-2 pr-3">
                            <UButton
                                :label="t('console-common.time.lastNDays', { n: 7 })"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="setDateRange(7)"
                            />
                            <UButton
                                :label="t('console-common.time.lastNDays', { n: 15 })"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="setDateRange(15)"
                            />
                            <UButton
                                :label="t('console-common.time.lastNDays', { n: 30 })"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="setDateRange(30)"
                            />
                            <UButton
                                :label="t('console-common.time.lastNMonth', { n: 3 })"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="setDateRange(0, 3)"
                            />
                            <UButton
                                :label="t('console-common.time.lastNMonth', { n: 6 })"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="setDateRange(0, 6)"
                            />
                        </div>

                        <div>
                            <!-- 日历主体 -->
                            <UCalendar
                                v-model="selectedRange"
                                range
                                :fixedWeeks="false"
                                :number-of-months="numberOfMonths"
                                color="primary"
                                size="sm"
                            />

                            <!-- 时间选择器（可选） -->
                            <div v-if="showTime" class="mt-2 grid grid-cols-2 gap-4">
                                <ProTimePicker
                                    v-model="selectedStartTime"
                                    :format="timeFormat"
                                    :disabled="disabled"
                                    :readonly="readonly"
                                    :clearable="false"
                                    size="sm"
                                    :ui="{ root: 'w-full' }"
                                />
                                <ProTimePicker
                                    v-model="selectedEndTime"
                                    :format="timeFormat"
                                    :disabled="disabled"
                                    :readonly="readonly"
                                    :clearable="false"
                                    size="sm"
                                    :ui="{ root: 'w-full' }"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮区域 -->
                    <div class="flex justify-end gap-2 pt-2">
                        <UButton
                            size="sm"
                            variant="ghost"
                            icon="i-lucide-x"
                            @click="handleCancel"
                        />
                        <UButton
                            size="sm"
                            icon="i-lucide-check"
                            :disabled="!selectedRange.start && !disabled"
                            @click="handleConfirm"
                        />
                    </div>
                </div>
            </template>
        </UPopover>
    </div>
</template>
