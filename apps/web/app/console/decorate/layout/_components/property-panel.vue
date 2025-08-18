<script setup lang="ts">
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";

import { LinkType } from "@/common/components/console/link-picker/types";

import { layoutStyles } from "../data/layouts";
import { useLayoutStore } from "../stores/layout";
import type { MenuItem } from "../types";

const layoutStore = useLayoutStore();
const { t } = useI18n();

// 响应式状态
const selectedLayoutId = ref(layoutStore.currentLayoutId);
const menuItems = ref<MenuItem[]>([...layoutStore.currentMenus] as MenuItem[]);

// 计算布局选项
const layoutOptions = computed(() =>
    layoutStyles.map(({ name, id }) => ({
        label: name,
        value: id,
    })),
);

// 监听 store 的变化
watchEffect(() => {
    selectedLayoutId.value = layoutStore.currentLayoutId;
    menuItems.value = [...layoutStore.currentMenus] as MenuItem[];
});

// 布局风格切换处理
function handleLayoutChange(layoutId: string) {
    layoutStore.setCurrentLayout(layoutId);
}

// 添加菜单项
function addNewMenuItem() {
    const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        title: t("console-decorate.layout.property.newMenuTitle"),
        link: {
            type: LinkType.SYSTEM,
            name: "首页",
            path: "/",
            query: {},
        },
        icon: "i-heroicons-home",
    };

    layoutStore.updateMenus([...menuItems.value, newItem]);
}

// 删除菜单项
function removeMenuItem(index: number) {
    const newMenus = menuItems.value.toSpliced(index, 1);
    layoutStore.updateMenus(newMenus);
}

// 上移菜单项
function moveItemUp(index: number) {
    if (index <= 0) return;

    const newMenus = [...menuItems.value];
    [newMenus[index - 1], newMenus[index]] = [newMenus[index], newMenus[index - 1]];
    layoutStore.updateMenus(newMenus);
}

// 下移菜单项
function moveItemDown(index: number) {
    if (index >= menuItems.value.length - 1) return;

    const newMenus = [...menuItems.value];
    [newMenus[index], newMenus[index + 1]] = [newMenus[index + 1], newMenus[index]];
    layoutStore.updateMenus(newMenus);
}
</script>

<template>
    <div class="bg-background flex h-full min-h-0 w-60 shrink-0 flex-col space-y-6">
        <!-- 布局风格选择 -->
        <div class="space-y-3 pr-6">
            <UFormField :label="t('console-decorate.layout.property.layoutStyle')">
                <USelect
                    v-model="selectedLayoutId"
                    :items="layoutOptions"
                    label-key="label"
                    value-key="value"
                    :placeholder="t('console-decorate.layout.property.layoutStylePlaceholder')"
                    :ui="{ base: 'w-full' }"
                    @update:model-value="handleLayoutChange"
                />
            </UFormField>
        </div>

        <!-- 菜单项管理 -->
        <div class="flex min-h-0 flex-1 flex-col space-y-3">
            <UFormField
                :label="t('console-decorate.layout.property.navigationMenu')"
                class="flex items-center justify-between pr-6"
            >
                <UButton
                    icon="i-heroicons-plus"
                    size="xs"
                    variant="outline"
                    @click="addNewMenuItem"
                >
                    {{ t("console-common.add") }}
                </UButton>
            </UFormField>

            <!-- 菜单项列表 -->
            <ProScrollArea class="table h-full pr-6" type="hover" :scroll-hide-delay="0">
                <div
                    v-for="(item, index) in menuItems"
                    :key="item.id"
                    class="bg-muted mb-3 space-y-3 rounded-lg p-4"
                >
                    <!-- 操作栏 -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-accent-foreground text-sm font-medium">
                                {{
                                    t("console-decorate.layout.property.menuNumber", {
                                        number: index + 1,
                                    })
                                }}
                            </span>
                        </div>
                        <div class="flex items-center gap-1">
                            <UButton
                                variant="ghost"
                                size="xs"
                                icon="i-heroicons-arrow-up"
                                :disabled="index === 0"
                                @click="moveItemUp(index)"
                            />
                            <UButton
                                variant="ghost"
                                size="xs"
                                icon="i-heroicons-arrow-down"
                                :disabled="index === menuItems.length - 1"
                                @click="moveItemDown(index)"
                            />
                            <UButton
                                variant="ghost"
                                size="xs"
                                icon="i-heroicons-trash"
                                color="error"
                                :disabled="menuItems.length <= 1"
                                @click="removeMenuItem(index)"
                            />
                        </div>
                    </div>

                    <!-- 标题编辑 -->
                    <UFormField
                        :label="t('console-decorate.layout.property.menuTitle')"
                        size="xs"
                        class="flex w-full justify-between"
                        :ui="{ wrapper: 'flex', container: 'w-[120px]' }"
                    >
                        <UInput
                            v-model="item.title"
                            :placeholder="
                                t('console-decorate.layout.property.menuTitlePlaceholder')
                            "
                            size="md"
                        />
                    </UFormField>

                    <!-- 链接编辑 -->
                    <UFormField
                        :label="t('console-decorate.layout.property.menuLink')"
                        size="xs"
                        class="flex w-full justify-between"
                        :ui="{ wrapper: 'flex', container: 'w-[120px]' }"
                    >
                        <ConsoleLinkPicker v-model="item.link" />
                    </UFormField>

                    <!-- 图标选择 -->
                    <UFormField
                        :label="t('console-decorate.layout.property.menuIcon')"
                        size="xs"
                        class="flex w-full justify-between"
                        :ui="{ wrapper: 'flex', container: 'w-[120px]' }"
                    >
                        <ConsoleIconPicker v-model="item.icon" />
                    </UFormField>
                </div>
            </ProScrollArea>
        </div>
    </div>
</template>
