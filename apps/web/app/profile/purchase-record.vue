<script lang="ts" setup>
import { ProPaginaction } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { ref } from "vue";
import { resolveComponent } from "vue";
import { useI18n } from "vue-i18n";

import type { PurchaseRecordItem } from "@/models/purchase-record";
import { apiPurchaseRecord } from "@/services/web/purchase-record";

const { t } = useI18n();

// 项目列表
const orders = ref<PurchaseRecordItem[]>([]);
const TimeDisplay = resolveComponent("TimeDisplay");

const paging = ref({
    page: 1,
    pageSize: 10,
    total: 0,
});

const changePageSize = () => {
    paging.value.page = 1;
    getLists();
};

// 列定义
const columns: TableColumn<PurchaseRecordItem>[] = [
    {
        accessorKey: "orderNo",
        header: t("common.recharge.list.orderNo"),
        cell: ({ row }) => row.original.orderNo,
    },
    {
        accessorKey: "power",
        header: t("common.recharge.list.rechargeQuantity"),
        cell: ({ row }) => row.original.power,
    },
    {
        accessorKey: "givePower",
        header: t("common.recharge.list.freeQuantity"),
        cell: ({ row }) => row.original.givePower,
    },
    {
        accessorKey: "totalPower",
        header: t("common.recharge.list.quantityReceived"),
        cell: ({ row }) => row.original.totalPower,
    },
    {
        accessorKey: "orderAmount",
        header: t("common.recharge.list.paidInAmount"),
        cell: ({ row }) => {
            const amount = Number.parseFloat(row.getValue("orderAmount"));
            const formattedAmount = new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: "CNY",
            }).format(amount);
            return formattedAmount;
        },
    },
    {
        accessorKey: "payTypeDesc",
        header: t("common.recharge.list.paymentMethod"),
    },
    {
        accessorKey: "createdAt",
        header: t("common.recharge.list.createdAt"),
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
                timeZone: "UTC",
            });
        },
    },
];

const changePage = () => {
    if (paging.value.page < 1) paging.value.page = 1;
    getLists();
};

const getLists = async () => {
    const res = await apiPurchaseRecord({
        page: paging.value.page,
        pageSize: paging.value.pageSize,
    });
    orders.value = res.items;
    paging.value.total = res.total;
};

onMounted(() => {
    getLists();
});

definePageMeta({
    layout: "setting",
    title: "menu.buyRecord",
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div class="flex h-full flex-col space-y-4 p-2 px-1">
        <UCard class="max-h-full" :ui="{ body: 'h-full overflow-hidden flex flex-col' }">
            <UTable ref="table" sticky :data="orders" :columns="columns" class="max-h-full flex-1">
                <template #payTypeDesc-cell="{ row }">
                    <div class="flex flex-col items-center">
                        <div v-if="row.original.payType === 1">
                            {{ t("common.recharge.list.wechat") }}
                        </div>
                        <div v-else-if="row.original.payType === 2">
                            {{ t("common.recharge.list.alipay") }}
                        </div>
                        <UBadge v-if="row.original.refundStatus === 1" color="warning">
                            {{ t("common.recharge.list.refunded") }}
                        </UBadge>
                    </div>
                </template>
            </UTable>
            <!-- 分页 -->
            <div
                class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4"
            >
                <div class="text-muted flex items-center gap-2 text-sm">
                    <span>共 {{ paging.total }} 条</span>
                    <USelect
                        v-model="paging.pageSize"
                        size="lg"
                        :items="[
                            { label: '10 条/页', value: 10 },
                            { label: '20 条/页', value: 20 },
                            { label: '50 条/页', value: 50 },
                            { label: '100 条/页', value: 100 },
                        ]"
                        class="w-28"
                        @change="changePageSize()"
                    />
                </div>
                <div class="flex items-center gap-1.5">
                    <ProPaginaction
                        v-model:page="paging.page"
                        v-model:size="paging.pageSize"
                        show-edges
                        :total="paging.total"
                        @change=""
                    />
                    <div class="text-muted flex items-center gap-2 text-sm">
                        <span>前往</span>
                        <UInput
                            v-model="paging.page"
                            size="lg"
                            type="number"
                            class="w-18"
                            @change="changePage()"
                        />
                        <span>页</span>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>
