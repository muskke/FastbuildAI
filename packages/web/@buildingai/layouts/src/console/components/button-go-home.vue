<script setup lang="ts">
const router = useRouter();

function reloadPage() {
    router.push("/");
}
</script>

<template>
    <div @click="reloadPage">
        <UTooltip :text="$t('layouts.goHome')" :delay-duration="0">
            <UButton
                data-sidebar="trigger"
                variant="ghost"
                color="neutral"
                size="xs"
                :ui="{ base: 'py-2' }"
            >
                <UIcon name="i-lucide-house" class="size-4" />
                <span>{{ $t("common.goHomeText") }}</span>
            </UButton>
        </UTooltip>
    </div>
</template>
