<script setup lang="ts">
import { AspectRatio } from "reka-ui";

/**
 * 组件属性接口
 */
interface ProAspectRatioProps {
    /**
     * 宽高比
     * @default 16 / 9
     */
    ratio?: number;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ProAspectRatioProps>(), {
    ratio: 16 / 9,
});
</script>

<template>
    <AspectRatio :ratio="props.ratio" class="pro-aspect-ratio" v-bind="$attrs">
        <slot />
    </AspectRatio>
</template>

<style scoped>
.pro-aspect-ratio {
    display: block;
}
</style>
