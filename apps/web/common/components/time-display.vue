<script setup lang="ts">
/**
 * 统一的时间显示组件
 * 基于 NuxtTime 组件，提供项目中常用的时间显示格式
 */

import { useI18n } from "vue-i18n";

import { STORAGE_KEYS } from "@/common/constants/storage.constant";

type TimeDisplayMode = "relative" | "datetime" | "date" | "time" | "short" | "long" | "year";

interface TimeDisplayProps {
    /** 日期时间值 */
    datetime: Date | number | string;
    /** 显示模式 */
    mode?: TimeDisplayMode;
    /** 自定义区域设置 */
    locale?: string;
    /** 自定义时区（优先级高于全局时区设置） */
    timeZone?: string;
    /** 是否显示年份（仅在 date 和 datetime 模式下有效） */
    showYear?: boolean;
    /** 自定义类名 */
    class?: string;
}

const props = withDefaults(defineProps<TimeDisplayProps>(), {
    mode: "relative",
    locale: undefined,
    showYear: true,
});

// 获取当前语言设置作为默认 locale
const { locale: currentLocale } = useI18n();

// 全局时区设置 Cookie
const globalTimeZoneCookie = useCookie<string>(STORAGE_KEYS.USER_TIMEZONE, {
    default: () => Intl.DateTimeFormat().resolvedOptions().timeZone, // 默认使用系统时区
});

// 时间格式配置映射表
const TIME_FORMAT_CONFIGS: Record<TimeDisplayMode, any> = {
    relative: {
        relative: true,
        numeric: "auto",
        style: "long",
    },
    datetime: (showYear: boolean, timeZone?: string) => ({
        year: showYear ? "numeric" : undefined,
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
    }),
    date: (showYear: boolean, timeZone?: string) => ({
        year: showYear ? "numeric" : undefined,
        month: "short",
        day: "numeric",
        timeZone,
    }),
    time: (showYear: boolean, timeZone?: string) => ({
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
    }),
    short: (showYear: boolean, timeZone?: string) => ({
        month: "numeric",
        day: "numeric",
        timeZone,
    }),
    long: (showYear: boolean, timeZone?: string) => ({
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long",
        timeZone,
    }),
    year: (showYear: boolean, timeZone?: string) => ({
        year: "numeric",
        timeZone,
    }),
};

/**
 * 生成 NuxtTime 组件属性
 */
const timeProps = computed(() => {
    // 为 year 模式强制使用无后缀的英文区域，避免出现“年”字样，仅显示数字年份
    const effectiveLocale = props.mode === "year" ? "en" : props.locale || currentLocale.value;

    const baseProps = {
        datetime: props.datetime,
        locale: effectiveLocale,
    };

    // 确定使用的时区：属性时区 > 全局时区设置 > 系统默认
    const effectiveTimeZone = props.timeZone || globalTimeZoneCookie.value;

    const formatConfig = TIME_FORMAT_CONFIGS[props.mode];

    // 处理函数类型的配置（支持 showYear 和 timeZone 参数）
    const config =
        typeof formatConfig === "function"
            ? formatConfig(props.showYear, effectiveTimeZone)
            : { ...formatConfig, timeZone: effectiveTimeZone };

    return { ...baseProps, ...config };
});
</script>

<template>
    <NuxtTime v-bind="timeProps" :class="props.class" />
</template>
