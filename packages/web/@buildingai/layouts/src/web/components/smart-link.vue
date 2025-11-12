<script setup lang="ts">
/**
 * Smart Link Component
 *
 * Automatically renders as NuxtLink in main app or as <a> tag in plugin
 * to avoid baseURL conflicts while maintaining proper navigation behavior
 */

const props = withDefaults(
    defineProps<{
        /** Target path or URL */
        to: string;
        /** Link target (_blank, _self, etc.) */
        target?: string;
        /** Rel attribute for external links */
        rel?: string;
    }>(),
    {
        target: "_self",
    },
);

const { smartNavigate, isPlugin } = useSmartNavigate();

/**
 * Handle click event for plugin mode
 */
const handleClick = (event: MouseEvent) => {
    // Prevent default navigation
    event.preventDefault();

    // Only handle click in plugin mode
    if (!isPlugin) return;

    // External links: let browser handle it
    if (props.to.startsWith("http://") || props.to.startsWith("https://")) {
        return;
    }

    // Use smart navigation
    smartNavigate(props.to, { newTab: props.target === "_blank" });
};

// Determine rel attribute for external links
const computedRel = computed(() => {
    if (props.rel) return props.rel;
    if (
        props.to.startsWith("http://") ||
        props.to.startsWith("https://") ||
        props.target === "_blank"
    ) {
        return "noopener noreferrer";
    }
    return undefined;
});
</script>

<template>
    <!-- Main app: Use NuxtLink -->
    <NuxtLink v-if="!isPlugin" :to="to" :target="target" :rel="computedRel" v-bind="$attrs">
        <slot />
    </NuxtLink>

    <!-- Plugin: Use plain <a> tag -->
    <NuxtLink
        v-else
        :to="to"
        :target="target"
        :rel="computedRel"
        v-bind="$attrs"
        @click="handleClick"
    >
        <slot />
    </NuxtLink>
</template>
