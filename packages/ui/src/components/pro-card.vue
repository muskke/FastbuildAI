<script setup lang="ts">
import { useSlots } from "vue";

/**
 * 通用卡片组件
 * 支持选择、操作菜单、图标展示等功能
 * 使用插槽系统实现高度定制化
 */

interface ActionItem {
    /** 菜单项标签 */
    label: string;
    /** 图标名称 */
    icon?: string;
    /** 颜色主题 */
    color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
    /** 菜单项类型 */
    type?: "separator";
    /** 点击回调 */
    onSelect?: () => void;
}

interface ProCardProps {
    /** 是否可选择 */
    selectable?: boolean;
    /** 是否选中 */
    selected?: boolean;
    /** 是否可点击 */
    clickable?: boolean;
    /** 卡片大小 */
    size?: "sm" | "md" | "lg" | "xl";
    /** 是否显示操作菜单 */
    showActions?: boolean;
    /** 操作菜单项 */
    actions?: ActionItem[];
    /** 卡片变体 */
    variant?: "default" | "outlined" | "elevated" | "flat";
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    class?: string;
    /** 加载状态 */
    loading?: boolean;
}

interface ProCardEmits {
    /** 选择状态变化 */
    (e: "select", selected: boolean | "indeterminate"): void;
    /** 卡片点击 */
    (e: "click", event: MouseEvent): void;
    /** 操作菜单点击 */
    (e: "action", action: ActionItem): void;
}

const props = withDefaults(defineProps<ProCardProps>(), {
    selectable: false,
    selected: false,
    clickable: false,
    size: "md",
    showActions: false,
    actions: () => [],
    variant: "default",
    disabled: false,
    loading: false,
});

const emit = defineEmits<ProCardEmits>();

/**
 * 获取卡片尺寸类名
 * 当存在底部插槽时，调整 md 尺寸的底部内边距
 */
const sizeClasses = computed(() => {
    const hasFooter = !!useSlots().footer;
    const sizeMap = {
        sm: "p-3",
        md: hasFooter ? "px-6 pt-6 pb-4" : "p-6",
        lg: "p-6",
        xl: "p-8",
    };
    return sizeMap[props.size];
});

/**
 * 获取卡片变体类名
 */
const variantClasses = computed(() => {
    const variantMap = {
        default: "bg-background shadow-default border border-transparent",
        outlined: "bg-background border border-border/70 hover:border-border hover:bg-muted/70",
        elevated: "bg-background shadow-lg",
        flat: "bg-background",
    };
    return variantMap[props.variant];
});

/**
 * 处理卡片点击
 */
function handleCardClick(event: MouseEvent) {
    if (props.disabled || props.loading) return;
    if (props.clickable) {
        emit("click", event);
    }
}

/**
 * 处理选择状态变化
 */
function handleSelect(value: boolean | "indeterminate") {
    if (props.disabled || props.loading) return;
    if (typeof value === "boolean") {
        emit("select", value);
    }
}

/**
 * 处理操作菜单点击
 */
function handleAction(action: ActionItem) {
    if (props.disabled || props.loading) return;
    if (action.onSelect) {
        action.onSelect();
    }
    emit("action", action);
}

/**
 * 过滤有效的操作项
 */
const filteredActions = computed(() => {
    return props.actions.filter(Boolean);
});

/**
 * 是否显示选择框
 */
const showCheckbox = computed(() => {
    return props.selectable && !props.disabled && !props.loading;
});
</script>

<template>
    <div
        class="group relative flex flex-col overflow-hidden rounded-lg transition-all duration-200"
        :class="[
            variantClasses,
            {
                'ring-primary-500 ring-2 ring-offset-2 dark:ring-offset-gray-800': selected,
                'cursor-pointer hover:shadow-lg':
                    clickable && !disabled && !loading && variant !== 'outlined',
                'hover:shadow-md': !clickable && !disabled && !loading && variant !== 'outlined',
                'cursor-not-allowed opacity-60': disabled,
                'pointer-events-none': loading,
            },
            props.class,
        ]"
        @click="handleCardClick"
    >
        <!-- 加载遮罩 -->
        <div
            v-if="loading"
            class="bg-background/80 absolute inset-0 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm"
        >
            <UIcon name="i-lucide-loader-2" class="text-primary h-6 w-6 animate-spin" />
        </div>

        <!-- 右上角操作菜单 -->
        <div
            v-if="showActions && filteredActions.length > 0 && !disabled && !loading"
            class="absolute top-4 right-4 z-40"
            @click.stop
        >
            <UDropdownMenu
                :items="[
                    filteredActions.map((action) => ({
                        ...action,
                        onSelect: () => handleAction(action),
                    })),
                ]"
                :popper="{ placement: 'bottom-end' }"
            >
                <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-ellipsis-vertical"
                    size="sm"
                />
            </UDropdownMenu>
        </div>

        <!-- 卡片主体内容 -->
        <div :class="cn('flex-1', sizeClasses)">
            <!-- 图标/头像区域 -->
            <div v-if="$slots.icon" class="group/icon relative inline-block" @click.stop>
                <!-- 左上角选择框 -->
                <div v-if="showCheckbox" class="absolute top-0 left-0 z-10 size-12">
                    <div
                        class="flex h-full w-full items-center justify-center rounded-full"
                        v-ripple
                    >
                        <UCheckbox
                            :model-value="selected"
                            @update:model-value="handleSelect"
                            class="opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100"
                            :class="{ 'opacity-100': selected }"
                            size="xl"
                        />
                    </div>
                </div>

                <!-- 图标内容插槽 -->
                <slot
                    name="icon"
                    :selected="selected"
                    :disabled="disabled"
                    :loading="loading"
                    :group-hover-class="showCheckbox ? 'group-hover/icon:opacity-0' : ''"
                    :selected-class="showCheckbox && selected ? 'opacity-0' : ''"
                />
            </div>

            <!-- 主要内容区域 -->
            <div v-if="$slots.default" class="space-y-2" :class="{ 'mt-4': $slots.icon }">
                <slot :selected="selected" :disabled="disabled" :loading="loading" />
            </div>

            <!-- 标题区域 -->
            <div
                v-if="$slots.title"
                class="space-y-2"
                :class="{ 'mt-4': $slots.icon || $slots.default }"
            >
                <slot name="title" :selected="selected" :disabled="disabled" :loading="loading" />
            </div>

            <!-- 描述区域 -->
            <div
                v-if="$slots.description"
                class="space-y-2"
                :class="{ 'mt-2': $slots.title || $slots.icon || $slots.default }"
            >
                <slot
                    name="description"
                    :selected="selected"
                    :disabled="disabled"
                    :loading="loading"
                />
            </div>

            <!-- 标签区域 -->
            <div
                v-if="$slots.tags"
                class="flex flex-wrap gap-2"
                :class="{
                    'mt-3': $slots.description || $slots.title || $slots.icon || $slots.default,
                }"
            >
                <slot name="tags" :selected="selected" :disabled="disabled" :loading="loading" />
            </div>

            <!-- 详细信息区域 -->
            <div
                v-if="$slots.details"
                class="space-y-2"
                :class="{
                    'mt-4':
                        $slots.tags ||
                        $slots.description ||
                        $slots.title ||
                        $slots.icon ||
                        $slots.default,
                }"
            >
                <slot name="details" :selected="selected" :disabled="disabled" :loading="loading" />
            </div>
        </div>

        <!-- 底部操作区域 -->
        <div v-if="$slots.footer" class="border-default border-t px-6 py-3">
            <slot name="footer" :selected="selected" :disabled="disabled" :loading="loading" />
        </div>

        <!-- 扩展插槽：用于特殊布局 -->
        <slot name="extra" :selected="selected" :disabled="disabled" :loading="loading" />
    </div>
</template>
