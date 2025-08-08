<script setup lang="ts">
interface Props {
    /** 按钮颜色 */
    color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
    /** 按钮变体 */
    variant?: "solid" | "outline" | "soft" | "ghost" | "link";
    /** 是否显示用户头像 */
    showUserProfile?: boolean;
    /** 菜单是否已展开 */
    expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    color: "neutral",
    variant: "ghost",
    showUserProfile: true,
    expanded: false,
});

const emit = defineEmits<{
    /** 点击菜单按钮事件 */
    click: [];
}>();

/**
 * 处理菜单按钮点击
 */
const handleClick = () => {
    emit("click");
};
</script>

<template>
    <!-- 移动端右侧操作区域 -->
    <div class="flex flex-1 justify-end gap-2 lg:hidden" data-mobile-menu>
        <!-- 用户头像 -->
        <!-- <ConsoleUserProfile v-if="showUserProfile" size="sm" /> -->

        <!-- 移动端菜单按钮 -->
        <UButton
            :color="color"
            :variant="variant"
            icon="i-heroicons-bars-3"
            square
            :ui="{
                trailingIcon: 'md:size-5',
                base: 'transition-transform duration-200',
            }"
            size="md"
            padded
            :aria-expanded="expanded"
            aria-controls="mobile-menu"
            aria-label="打开菜单"
            @click="handleClick"
        />
    </div>
</template>
