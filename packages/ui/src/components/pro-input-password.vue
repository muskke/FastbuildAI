<script setup lang="ts">
import { ref } from "vue";

// 定义组件接收的所有属性，通过v-bind="$attrs"传递给UInput
defineOptions({ inheritAttrs: false });

// 定义默认插槽
defineSlots();

// 密码可见状态
const visiblePassword = ref(false);
</script>

<template>
    <UInput v-bind="$attrs" :type="visiblePassword ? 'text' : 'password'">
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>

        <template #trailing>
            <slot name="trailing-before" />
            <UIcon
                :name="visiblePassword ? 'tabler:eye-off' : 'tabler:eye'"
                class="text-foreground/70 cursor-pointer"
                :size="20"
                @click="visiblePassword = !visiblePassword"
            />
            <slot name="trailing-after" />
        </template>
    </UInput>
</template>
