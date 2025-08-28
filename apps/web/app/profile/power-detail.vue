<script lang="ts" setup>
import { ProPaginaction } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { resolveComponent } from "vue";
import { useI18n } from "vue-i18n";

import type { PowerDetaiItem, UserInfo } from "@/models/power-detail";
import { apiGetPowerDetailList } from "@/services/web/power-detail";

const { t } = useI18n();
const TimeDisplay = resolveComponent("TimeDisplay");
const tab = ref("all");
const items = [
    {
        value: "all",
        label: t("web-personal-rights.rechargeCenter.detail.tab.all"),
    },
    {
        value: "0",
        label: t("web-personal-rights.rechargeCenter.detail.tab.consume"),
    },
    {
        value: "1",
        label: t("web-personal-rights.rechargeCenter.detail.tab.get"),
    },
];

const columns: TableColumn<PowerDetaiItem>[] = [
    {
        accessorKey: "accountTypeDesc",
        header: t("web-personal-rights.rechargeCenter.detail.changeDetail"),
    },
    {
        accessorKey: "consumeSourceDesc",
        header: t("web-personal-rights.rechargeCenter.detail.consumeSourceDesc"),
    },
    {
        accessorKey: "changeAmount",
        header: t("web-personal-rights.rechargeCenter.detail.changeAmount"),
    },
    {
        accessorKey: "createdAt",
        header: t("web-personal-rights.rechargeCenter.detail.changeTime"),
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
];

// 算力详情列表
const powerDetailList = ref<PowerDetaiItem[]>([]);

const paging = ref({
    page: 1,
    pageSize: 10,
    total: 0,
});

const userInfo = ref<UserInfo>();

// 获取算力明细列表
const getPowerDetailList = async () => {
    const res = await apiGetPowerDetailList({
        page: paging.value.page,
        pageSize: paging.value.pageSize,
        action: tab.value === "all" ? "" : tab.value,
    });
    paging.value.page = res.page;
    paging.value.pageSize = res.pageSize;
    paging.value.total = res.total;
    userInfo.value = res.userInfo;
    powerDetailList.value = res.items;
};

onMounted(() => {
    getPowerDetailList();
});

definePageMeta({
    layout: "setting",
    title: "menu.powerDetail",
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div class="flex h-full flex-col space-y-4 p-2 pb-5">
        <div class="h-fit">
            <UCard>
                <div class="grid grid-cols-2 items-center text-center">
                    <div class="flex flex-col justify-between gap-2">
                        <div class="text-muted-foreground text-sm">
                            {{ t("web-personal-rights.rechargeCenter.detail.remainingPower") }}
                        </div>
                        <div class="text-lg font-medium">{{ userInfo?.power }}</div>
                    </div>
                    <!-- <span class="text-muted-foreground"> = </span>
                    <div class="flex flex-col justify-between gap-2">
                        <div class="text-muted-foreground text-sm">
                            {{ t("web-personal-rights.rechargeCenter.detail.rechargePower") }}
                        </div>
                        <div class="text-lg font-medium">1500</div>
                    </div>
                    <span class="text-muted-foreground"> + </span>
                    <div class="flex flex-col justify-between gap-2">
                        <div class="text-muted-foreground text-sm">
                            {{ t("web-personal-rights.rechargeCenter.detail.giftPower") }}
                        </div>
                        <div class="text-lg font-medium">20</div>
                    </div>
                    <span class="text-muted-foreground"> + </span> -->
                    <div class="flex flex-col items-center gap-2">
                        <div
                            class="text-muted-foreground flex flex-row items-center justify-center gap-1 text-sm"
                        >
                            {{
                                t("web-personal-rights.rechargeCenter.detail.dailyGiftPower.title")
                            }}
                            <UPopover mode="hover">
                                <UIcon name="tabler:help" size="14" />
                                <template #content>
                                    <div
                                        class="bg-background max-h-60 w-90 overflow-hidden rounded-lg shadow-lg"
                                    >
                                        <UCard>
                                            <div class="text-md space-y-2">
                                                <h4>
                                                    {{
                                                        t(
                                                            "web-personal-rights.rechargeCenter.detail.dailyGiftPower.title",
                                                        )
                                                    }}
                                                </h4>

                                                <div
                                                    class="space-y-2 rounded-lg border p-4 text-center"
                                                >
                                                    <div class="flex items-center justify-between">
                                                        <div>
                                                            {{
                                                                t(
                                                                    "web-personal-rights.rechargeCenter.detail.dailyGiftPower.giftPower",
                                                                )
                                                            }}
                                                        </div>
                                                        <div>0</div>
                                                    </div>
                                                    <div class="flex items-center justify-between">
                                                        <div>
                                                            {{
                                                                t(
                                                                    "web-personal-rights.rechargeCenter.detail.dailyGiftPower.powerValidity",
                                                                )
                                                            }}
                                                        </div>
                                                        <div>-</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </UCard>
                                    </div>
                                </template>
                            </UPopover>
                        </div>
                        <div class="text-lg font-medium">0</div>
                    </div>
                </div>
            </UCard>

            <UTabs
                v-model="tab"
                :content="false"
                :items="items"
                class="mt-8 w-fit"
                @update:model-value="getPowerDetailList"
            />
        </div>

        <div class="flex flex-1 flex-col overflow-hidden">
            <UTable
                sticky
                :columns="columns"
                :data="powerDetailList"
                :ui="{ root: 'border rounded-lg' }"
            >
                <template #accountType-cell="{ row }">
                    {{ row.original.accountTypeDesc }}
                </template>
                <template #changeAmount-cell="{ row }">
                    <span :class="row.original.action === 1 ? 'text-green-500' : 'text-red-500'">
                        {{ row.original.action === 1 ? "+" : "-" }}
                        {{ row.original.changeAmount }}
                    </span>
                </template>
            </UTable>
            <div class="flex items-center justify-end gap-3">
                <ProPaginaction
                    v-model:page="paging.page"
                    v-model:size="paging.pageSize"
                    :total="paging.total"
                    :ui="{ root: 'mt-4' }"
                    @change="getPowerDetailList"
                />
            </div>
        </div>
    </div>
</template>
