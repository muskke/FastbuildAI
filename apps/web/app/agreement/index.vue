<script lang="ts" setup>
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";

import type { AgreementItem, AgreementMenuItem } from "@/models/global";
import { apiGetAgreementConfig } from "@/services/common";

useHead({
    title: "政策协议",
});

definePageMeta({
    layout: "full-screen",
    auth: false,
});

const route = useRoute();

// 使用 SSR 方式获取协议配置数据
const { data: agreementConfigData, pending: configLoading } = await useAsyncData(
    () => apiGetAgreementConfig(),
    {
        transform: (data) => {
            const agreement = data.agreement;
            if (!agreement) {
                console.warn("未找到协议配置信息");
                return [];
            }

            const agreementList: AgreementItem[] = [];

            // 添加服务协议
            if (agreement.serviceTitle && agreement.serviceContent) {
                agreementList.push({
                    title: agreement.serviceTitle,
                    type: "service",
                    content: agreement.serviceContent,
                    updateAt: agreement.updateAt || new Date().toISOString(),
                });
            }

            // 添加隐私协议
            if (agreement.privacyTitle && agreement.privacyContent) {
                agreementList.push({
                    title: agreement.privacyTitle,
                    type: "privacy",
                    content: agreement.privacyContent,
                    updateAt: agreement.updateAt || new Date().toISOString(),
                });
            }

            // 添加支付协议
            if (agreement.paymentTitle && agreement.paymentContent) {
                agreementList.push({
                    title: agreement.paymentTitle,
                    type: "payment",
                    content: agreement.paymentContent,
                    updateAt: agreement.updateAt || new Date().toISOString(),
                });
            }

            return agreementList;
        },
    },
);

// 如果没有获取到协议数据，抛出404错误
if (!agreementConfigData.value || agreementConfigData.value.length === 0) {
    console.error("未找到协议配置数据");
}

const isOpen = ref<boolean>(false);
defineShortcuts({
    o: () => (isOpen.value = !isOpen.value),
});

const contentLoading = ref<boolean>(false);

// 当前显示的协议内容
const currentAgreement = ref<AgreementItem | null>(null);

// 构建菜单项数据
const items = computed<AgreementMenuItem[]>(() => [
    {
        id: "agreement",
        value: "agreement",
        label: "政策协议",
        defaultOpen: true,
        list: agreementConfigData.value || [],
    },
]);

/**
 * 切换显示内容
 * @param id 菜单项ID
 * @param item 协议项数据
 */
async function changeContent(id: string, item: AgreementItem) {
    contentLoading.value = true;

    // 立即更新当前显示内容
    currentAgreement.value = item;

    // 更新URL参数
    await navigateTo(
        {
            path: "/agreement",
            query: {
                type: id,
                item: item.type,
            },
        },
        {
            replace: true,
        },
    );

    await nextTick();
    document.getElementById("__read_area__")?.scrollTo({ top: 0, behavior: "smooth" });
    contentLoading.value = false;
}

// 监听路由变化，同步当前协议
watch(
    () => route.query,
    (newQuery) => {
        const activeType = newQuery.type as string;
        const activeItem = newQuery.item as string;
        const agreementList = agreementConfigData.value || [];

        if (activeType === "agreement" && activeItem) {
            const targetItem = agreementList.find((item) => item.type === activeItem);
            if (targetItem) {
                currentAgreement.value = targetItem;
                return;
            }
        }

        // 如果没有找到对应协议或没有参数，显示第一个协议
        if (agreementList[0] && !currentAgreement.value) {
            currentAgreement.value = agreementList[0];
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="bg-background flex size-full overflow-hidden">
        <div class="fixed bottom-1/2 left-0 md:hidden">
            <UButton icon="tabler:list" :ui="{ base: 'rounded-s-none' }" @click="isOpen = true" />
        </div>
        <USlideover v-model:open="isOpen" side="left" :ui="{ content: '!w-fit flex-0 max-w-fit' }">
            <template #content>
                <div class="relative flex h-full w-52 flex-col">
                    <div class="absolute -right-7 bottom-1/2 md:hidden">
                        <UButton
                            icon="tabler:text-wrap"
                            :ui="{ base: 'rounded-s-none' }"
                            @click="isOpen = false"
                        />
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <ProScrollArea class="h-full px-4">
                            <UAccordion
                                :items="items"
                                type="multiple"
                                style="--ui-border: transparent"
                                :default-value="['agreement']"
                                :ui="{
                                    trigger: 'text-md',
                                    trailingIcon: 'size-4',
                                }"
                            >
                                <template #content="{ item }">
                                    <div v-if="configLoading" class="h-full space-y-3">
                                        <USkeleton class="h-6 w-full" />
                                        <USkeleton class="h-6 w-full" />
                                        <USkeleton class="h-6 w-full" />
                                    </div>
                                    <div v-else class="flex flex-col gap-3">
                                        <div
                                            v-for="listItem in (item as AgreementMenuItem).list"
                                            :key="listItem.type"
                                            class="hover:text-foreground active:text-primary cursor-pointer truncate pr-3 pl-6"
                                            :class="{
                                                'text-primary hover:!text-primary':
                                                    listItem.type === currentAgreement?.type,
                                            }"
                                            @click="
                                                () => {
                                                    changeContent(
                                                        (item as AgreementMenuItem).id,
                                                        listItem,
                                                    );
                                                    isOpen = false;
                                                }
                                            "
                                        >
                                            {{ listItem.title }}
                                        </div>
                                    </div>
                                </template>
                            </UAccordion>
                        </ProScrollArea>
                    </div>
                    <div class="mt-auto px-4 py-2">
                        <ClientOnly>
                            <ThemeToggle />
                        </ClientOnly>
                    </div>
                </div>
            </template>
        </USlideover>
        <div class="bg-muted w-0 overflow-x-hidden transition-[width] md:w-44 lg:w-52">
            <div class="flex h-full w-full min-w-44 flex-col gap-4">
                <div class="flex-1 overflow-hidden">
                    <ProScrollArea class="h-full pr-4 pl-2">
                        <UAccordion
                            :items="items"
                            type="multiple"
                            :default-value="['agreement']"
                            style="--ui-border: transparent"
                            :ui="{ trailingIcon: 'size-4' }"
                        >
                            <template #content="{ item }">
                                <div v-if="configLoading" class="h-full space-y-3">
                                    <USkeleton class="h-6 w-full" />
                                    <USkeleton class="h-6 w-full" />
                                    <USkeleton class="h-6 w-full" />
                                </div>
                                <div v-else class="flex flex-col gap-3 text-sm">
                                    <div
                                        v-for="listItem in (item as AgreementMenuItem).list"
                                        :key="listItem.type"
                                        class="hover:text-foreground active:text-primary cursor-pointer truncate pr-3 pl-6"
                                        :class="{
                                            'text-primary hover:!text-primary':
                                                listItem.type === currentAgreement?.type,
                                        }"
                                        @click="
                                            changeContent((item as AgreementMenuItem).id, listItem)
                                        "
                                    >
                                        {{ listItem.title }}
                                    </div>
                                </div>
                            </template>
                        </UAccordion>
                    </ProScrollArea>
                </div>
                <div class="mt-auto px-4 py-2">
                    <ClientOnly>
                        <ThemeToggle />
                    </ClientOnly>
                </div>
            </div>
        </div>
        <div id="__read_area__" class="flex-1 overflow-y-auto">
            <div class="mx-auto flex w-full flex-col gap-4 p-6 md:max-w-prose">
                <div v-if="contentLoading" class="space-y-4">
                    <USkeleton class="h-6 w-[250px]" />
                    <USkeleton class="h-4 w-[200px]" />
                    <div class="!mt-8 space-y-6">
                        <USkeleton v-for="item in 15" :key="item" class="h-4 w-full" />
                    </div>
                </div>
                <div v-else class="space-y-4">
                    <h1 class="text-2xl font-medium">
                        {{ currentAgreement?.title }}
                    </h1>
                    <p class="text-foreground/60 text-xs">
                        {{ $t("common.updateAt") }}:
                        <TimeDisplay
                            v-if="currentAgreement?.updateAt"
                            :datetime="currentAgreement.updateAt"
                            mode="datetime"
                        />
                        <span v-else>-</span>
                    </p>
                    <div
                        v-dompurify-html="currentAgreement?.content"
                        class="prose dark:prose-invert"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
