<script setup lang="ts">
import type { NavigationConfig } from "@/app/console/decorate/layout/types";

interface Props {
    /** 导航配置 */
    navigationConfig: NavigationConfig;
    /** 是否显示移动端菜单 */
    modelValue: boolean;
    /** 是否显示工作台按钮 */
    showWorkspaceButton?: boolean;
    /** 工作台按钮链接 */
    workspaceUrl?: string;
    /** 工作台按钮文本 */
    workspaceText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    showWorkspaceButton: true,
    workspaceUrl: "/console",
    workspaceText: "我的工作台",
});

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
}>();

// 使用 v-model
const isOpen = useVModel(props, "modelValue", emit);

// 获取用户状态
const userStore = useUserStore();

/**
 * 处理菜单项点击，关闭菜单
 */
const handleMenuClick = () => {
    isOpen.value = false;
};

/**
 * 处理按钮点击，关闭菜单
 */
const handleButtonClick = () => {
    isOpen.value = false;
};
</script>

<template>
    <!-- 移动端侧边滑出菜单 -->
    <USlideover v-model="isOpen">
        <template #content>
            <!-- 滑出菜单头部 -->
            <div class="flex items-center justify-between p-4">
                <h1 class="text-xl font-bold">页面导航</h1>
                <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-heroicons-x-mark"
                    square
                    padded
                    @click="isOpen = false"
                />
            </div>

            <!-- 导航菜单列表 -->
            <div class="flex flex-1 flex-col p-4 pt-0">
                <template v-for="item in navigationConfig.items" :key="item.id">
                    <!-- 普通菜单项 -->
                    <NuxtLink
                        v-if="!item.children?.length"
                        :to="item.link.path || '/'"
                        :target="item.link.path?.startsWith('http') ? '_blank' : '_self'"
                        :rel="item.link.path?.startsWith('http') ? 'noopener noreferrer' : ''"
                        class="hover:bg-primary/5 active:bg-primary/5 active:text-primary flex items-center gap-2 rounded-xl p-4 transition-colors"
                        @click="handleMenuClick"
                    >
                        <UIcon v-if="item.icon" :name="item.icon" size="18" />
                        <span class="font-medium">{{ item.title }}</span>
                    </NuxtLink>

                    <!-- 带子菜单的项目 -->
                    <UAccordion
                        v-else
                        :items="[
                            {
                                label: item.title,
                                icon: item.icon,
                                defaultOpen: false,
                                slot: `item-${item.id}`,
                            },
                        ]"
                        class="w-full"
                        :ui="{
                            wrapper: 'w-full',
                            item: {
                                root: 'w-full',
                                trigger:
                                    'w-full p-4 rounded-xl hover:bg-primary/5 transition-colors',
                                content: 'pb-0',
                            },
                        }"
                    >
                        <template #[`item-${item.id}`]>
                            <div class="space-y-1 pl-4">
                                <NuxtLink
                                    v-for="child in item.children"
                                    :key="child.id"
                                    :to="child.link.path || '/'"
                                    :target="
                                        child.link.path?.startsWith('http') ? '_blank' : '_self'
                                    "
                                    :rel="
                                        child.link.path?.startsWith('http')
                                            ? 'noopener noreferrer'
                                            : ''
                                    "
                                    class="hover:bg-primary/5 active:bg-primary/5 active:text-primary flex items-center gap-2 rounded-lg p-3 text-sm transition-colors"
                                    @click="handleMenuClick"
                                >
                                    <UIcon v-if="child.icon" :name="child.icon" size="16" />
                                    <span class="font-medium">{{ child.title }}</span>
                                </NuxtLink>
                            </div>
                        </template>
                    </UAccordion>
                </template>
            </div>

            <!-- 滑出菜单底部 -->
            <div class="flex flex-col gap-2 border-t p-4">
                <!-- 主题切换 -->
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">主题切换</span>
                    <ThemeToggle />
                </div>

                <!-- 工作台按钮 -->
                <UButton
                    v-if="showWorkspaceButton && userStore.isLogin"
                    :to="workspaceUrl"
                    color="primary"
                    size="sm"
                    block
                    @click="handleButtonClick"
                >
                    {{ workspaceText }}
                </UButton>

                <!-- 用户操作 -->
                <div class="flex items-center justify-center pt-2">
                    <!-- <ConsoleUserProfile size="sm" /> -->
                </div>
            </div>
        </template>
    </USlideover>
</template>
