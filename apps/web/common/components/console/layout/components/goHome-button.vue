<script setup lang="ts">
/**
 * 返回前台按钮组件
 */

const router = useRouter();

/** 刷新页面 */
function reloadPage() {
    router.push("/");
}
</script>

<template>
    <div @click="reloadPage">
        <UTooltip :text="$t('common.goHome')" :delay-duration="0">
            <UButton
                data-sidebar="trigger"
                variant="ghost"
                color="neutral"
                size="xs"
                :ui="{ base: 'py-2' }"
            >
                <span class="sr-only">Go Home</span>
                <UIcon name="i-lucide-house" class="size-4" />
            </UButton>
        </UTooltip>
    </div>
</template>
