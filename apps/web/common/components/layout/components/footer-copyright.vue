<script setup lang="ts">
import { computed } from "vue";

import type { WebsiteCopyright } from "~/models/website";

/**
 * 底部版权信息组件
 * @description 展示网站底部的版权信息，支持多项，支持图标和链接。
 * @props copyright 版权信息数组，类型为 WebsiteCopyright[]
 */

const props = defineProps<{ copyright?: WebsiteCopyright[] }>();

const copyrightList = computed(() => props.copyright || []);
</script>

<template>
    <footer class="footer-copyright flex items-center justify-center gap-4 py-4">
        <template v-for="item in copyrightList" :key="item.url">
            <a
                class="hover:text-primary-500 flex items-center gap-1 text-xs text-gray-500 transition-colors"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    v-if="item.iconUrl"
                    :src="item.iconUrl"
                    :alt="item.displayName"
                    class="inline-block h-4 w-4 align-middle"
                />
                <span>{{ item.displayName }}</span>
            </a>
        </template>
    </footer>
</template>
