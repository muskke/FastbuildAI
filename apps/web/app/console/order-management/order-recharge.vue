<script setup lang="ts">
import { ProPaginaction, useMessage, useModal } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { type Row } from "@tanstack/table-core";
import { resolveComponent } from "vue";
import { useI18n } from "vue-i18n";

import type { OrderDetailData, OrderListItem, Statistics } from "@/models/order-recharge";
import { apiGetOrderDetail, apiGetOrderList, apiRefund } from "@/services/console/order-recharge";

import OrderDetail from "./components/order-detail.vue";

const TimeDisplay = resolveComponent("TimeDisplay");
const { t } = useI18n();
const UButton = resolveComponent("UButton");
const { hasAccessByCodes } = useAccessControl();
const UDropdownMenu = resolveComponent("UDropdownMenu");
const toast = useMessage();
const orderDetailVisible = ref(false);
const statistics = ref<Statistics>({
    totalAmount: 0,
    totalIncome: 0,
    totalOrder: 0,
    totalRefundAmount: 0,
    totalRefundOrder: 0,
});

// 统计卡片配置
const statisticsItems = [
    {
        key: "totalOrder",
        unit: "console-common.unit",
        label: "console-order-management.recharge.rechargeCount",
    },
    {
        key: "totalAmount",
        unit: "console-common.yuan",
        label: "console-order-management.recharge.totalRechargeAmount",
    },
    {
        key: "totalRefundOrder",
        unit: "console-common.unit",
        label: "console-order-management.recharge.refundCount",
    },
    {
        key: "totalRefundAmount",
        unit: "console-common.yuan",
        label: "console-order-management.recharge.totalRefundAmount",
    },
    {
        key: "totalIncome",
        unit: "console-common.yuan",
        label: "console-order-management.recharge.netIncome",
    },
] as const;
const orderDetail = ref<OrderDetailData | null>(null);

const keyword = ref<string>("");
const orderNo = ref<string>("");
const payType = ref<string | undefined>(undefined);
const payStatus = ref<string | undefined>(undefined);
const refundStatus = ref<string | undefined>(undefined);

const paging = ref({
    page: 1,
    pageSize: 10,
    total: 0,
});

// 项目列表
const orders = ref<OrderListItem[]>([]);

// 列定义
const columns: TableColumn<OrderListItem>[] = [
    {
        accessorKey: "orderNo",
        header: t("console-order-management.recharge.list.orderNo"),
    },
    {
        accessorKey: "user",
        header: t("console-order-management.recharge.list.user"),
    },
    {
        accessorKey: "power",
        header: t("console-order-management.recharge.list.rechargeQuantity"),
    },
    {
        accessorKey: "givePower",
        header: t("console-order-management.recharge.list.freeQuantity"),
    },
    {
        accessorKey: "totalPower",
        header: t("console-order-management.recharge.list.quantityReceived"),
    },
    {
        accessorKey: "orderAmount",
        header: t("console-order-management.recharge.list.paidInAmount"),
        cell: ({ row }) => {
            const paidInAmount = Number.parseFloat(row.getValue("orderAmount"));
            const formattedPaidInAmount = new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: "CNY",
            }).format(paidInAmount);
            return formattedPaidInAmount;
        },
    },
    {
        accessorKey: "payTypeDesc",
        header: t("console-order-management.recharge.list.paymentMethod"),
    },
    {
        accessorKey: "paymentStatus",
        header: t("console-order-management.recharge.list.paymentStatus"),
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            const isSorted = column.getIsSorted();

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: t("console-order-management.recharge.list.createdAt"),
                icon: isSorted
                    ? isSorted === "asc"
                        ? "i-lucide-arrow-up-narrow-wide"
                        : "i-lucide-arrow-down-wide-narrow"
                    : "i-lucide-arrow-up-down",
                class: "-mx-2.5",
                onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
            });
        },
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
    {
        accessorKey: "actions",
        header: () => t("console-order-management.recharge.list.actions"),
        size: 40, // 固定宽度
        enableSorting: false,
        enableHiding: true,
    },
];

const refund = async (id?: string) => {
    await useModal({
        title: t("console-order-management.recharge.list.refund"),
        description: t("console-common.confirmRefund"),
        color: "warning",
    });
    await apiRefund(id || "");
    getOrderList();
    toast.success(t("console-common.refundSuccess"));
};

// 操作栏
function getRowItems(row: Row<OrderListItem>) {
    return [
        hasAccessByCodes(["menu:add"])
            ? {
                  label: t("console-order-management.recharge.list.viewDetails"),
                  icon: "i-lucide-eye",
                  color: "info",
                  onClick: () => {
                      getOrderDetail(row.original.id);
                  },
              }
            : null,
        row.original.payStatus === 1 &&
        hasAccessByCodes(["menu:delete"]) &&
        row.original.refundStatus === 0
            ? {
                  label: t("console-order-management.recharge.list.refund"),
                  icon: "tabler:arrow-back",
                  color: "error",
                  onSelect() {
                      // 调用退款接口
                      refund(row.original.id);
                  },
              }
            : null,
    ].filter(Boolean);
}

// 设置操作列固定在右侧
const columnPinning = ref({
    left: [],
    right: ["actions"],
});

// 获取订单列表
const getOrderList = async () => {
    try {
        const res = await apiGetOrderList({
            page: paging.value.page,
            pageSize: paging.value.pageSize,
            keyword: keyword.value,
            orderNo: orderNo.value,
            payType: payType.value,
            payStatus: payStatus.value,
            refundStatus: refundStatus.value,
        });
        orders.value = res.items;
        paging.value = {
            page: res.page,
            pageSize: res.pageSize,
            total: res.total,
        };
        statistics.value = res.statistics;
    } catch (error) {
        console.error(error);
    }
};

// 获取订单详情
const getOrderDetail = async (id: string | undefined) => {
    if (!id) return;
    try {
        const res = await apiGetOrderDetail(id);
        orderDetailVisible.value = true;
        orderDetail.value = res;
    } catch (error) {
        console.error(error);
    }
};
const changePageSize = () => {
    paging.value.page = 1;
    getOrderList();
};

const changePage = () => {
    getOrderList();
};

const changeSelect = () => {
    if (payType.value === "all") {
        payType.value = undefined;
    }
    if (payStatus.value === "all") {
        payStatus.value = undefined;
    }
    if (refundStatus.value === "all") {
        refundStatus.value = undefined;
    }
    getOrderList();
};

onMounted(() => {
    getOrderList();
});
</script>

<template>
    <div class="flex h-full flex-col space-y-4 pb-6">
        <!-- 信息卡片 -->
        <div class="grid grid-cols-2 gap-4 pt-px md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <UCard v-for="(item, index) in statisticsItems" :key="index">
                <div class="flex items-center justify-center">
                    <div class="flex flex-col items-center">
                        <div>
                            <span class="text-2xl font-bold">
                                {{ statistics[item.key as keyof Statistics] }}
                            </span>
                            <span class="text-muted-foreground ml-1 text-xs">
                                {{ t(item.unit) }}
                            </span>
                        </div>
                        <div class="text-muted-foreground text-xs">
                            {{ t(item.label) }}
                        </div>
                    </div>
                </div>
            </UCard>
        </div>
        <!-- 订单列表 -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <div class="h-fit py-5">
                <div class="flex items-center space-x-2">
                    <UInput
                        :placeholder="t('console-order-management.recharge.list.searchOrderNo')"
                        icon="i-heroicons-magnifying-glass"
                        v-model="orderNo"
                        @update:modelValue="getOrderList"
                    />
                    <UInput
                        :placeholder="t('console-order-management.recharge.list.searchUser')"
                        icon="i-heroicons-magnifying-glass"
                        v-model="keyword"
                        @update:modelValue="getOrderList"
                    />
                    <USelect
                        class="ml-auto"
                        :placeholder="t('console-order-management.recharge.list.paymentMethod')"
                        :items="[
                            {
                                label: t('console-common.all'),
                                value: 'all',
                            },
                            {
                                label: t('console-order-management.recharge.list.wechatPay'),
                                value: '1',
                            },
                            {
                                label: t('console-order-management.recharge.list.alipayPay'),
                                value: '2',
                            },
                        ]"
                        v-model="payType"
                        @update:modelValue="changeSelect()"
                    />
                    <USelect
                        :placeholder="t('console-order-management.recharge.list.paymentStatus')"
                        :items="[
                            {
                                label: t('console-common.all'),
                                value: 'all',
                            },
                            {
                                label: t('console-order-management.recharge.list.paid'),
                                value: '1',
                            },
                            {
                                label: t('console-order-management.recharge.list.unpaid'),
                                value: '0',
                            },
                        ]"
                        v-model="payStatus"
                        @update:modelValue="changeSelect()"
                    />
                    <USelect
                        :placeholder="t('console-order-management.recharge.list.refundStatus')"
                        :items="[
                            {
                                label: t('console-common.all'),
                                value: 'all',
                            },
                            {
                                label: t('console-order-management.recharge.list.refunded'),
                                value: '1',
                            },
                            {
                                label: t('console-order-management.recharge.list.notRefunded'),
                                value: '0',
                            },
                        ]"
                        v-model="refundStatus"
                        @update:modelValue="changeSelect()"
                    />
                </div>
            </div>

            <UTable
                ref="table"
                sticky
                :data="orders"
                :columns="columns"
                v-model:column-pinning="columnPinning"
                :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'border-b border-default',
                    tr: '[&:has(>td[colspan])]:hidden',
                }"
                class=""
            >
                <template #user-cell="{ row }">
                    <UAvatar v-if="row.original.user?.avatar" :src="row.original.user?.avatar" />
                    <UAvatar v-else icon="i-heroicons-user" :name="row.original.user?.username" />
                    {{ row.original.user?.username }}
                </template>
                <template #paymentStatus-cell="{ row }">
                    <div class="flex flex-col items-start">
                        <div class="flex flex-col items-center">
                            <div
                                v-if="row.original.refundStatus === 1"
                                class="text-muted-foreground mb-1 flex justify-center text-xs font-medium"
                            >
                                {{ t("console-order-management.recharge.list.paid") }}
                            </div>
                            <UBadge
                                :color="
                                    row.original.refundStatus === 1
                                        ? 'warning'
                                        : row.original.payStatus === 1
                                          ? 'success'
                                          : 'error'
                                "
                            >
                                {{
                                    row.original.refundStatus === 1
                                        ? t("console-order-management.recharge.list.refunded")
                                        : row.original.payStatus === 1
                                          ? t("console-order-management.recharge.list.paid")
                                          : t("console-order-management.recharge.list.unpaid")
                                }}
                            </UBadge>
                        </div>
                    </div>
                </template>
                <template #actions-cell="{ row }">
                    <UDropdownMenu :items="getRowItems(row)">
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                            aria-label="Actions"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>

            <!-- 分页 -->
            <div
                class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4"
            >
                <div class="text-muted flex items-center gap-2 text-sm">
                    <span
                        >{{ t("console-common.total") }} {{ paging.total }}
                        {{ t("console-common.items") }}</span
                    >
                    <USelect
                        v-model="paging.pageSize"
                        size="lg"
                        :items="[
                            {
                                label:
                                    '10 ' +
                                    t('console-common.items') +
                                    '/' +
                                    t('console-common.page'),
                                value: 10,
                            },
                            {
                                label:
                                    '20 ' +
                                    t('console-common.items') +
                                    '/' +
                                    t('console-common.page'),
                                value: 20,
                            },
                            {
                                label:
                                    '50 ' +
                                    t('console-common.items') +
                                    '/' +
                                    t('console-common.page'),
                                value: 50,
                            },
                            {
                                label:
                                    '100 ' +
                                    t('console-common.items') +
                                    '/' +
                                    t('console-common.page'),
                                value: 100,
                            },
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
                        <span>{{ t("console-common.goTo") }}</span>
                        <UInput
                            v-model="paging.page"
                            size="lg"
                            type="number"
                            class="w-18"
                            @change="changePage()"
                        />
                        <span>{{ t("console-common.page") }}</span>
                    </div>
                </div>
            </div>
        </div>

        <OrderDetail
            v-if="orderDetailVisible"
            :title="t('console-order-management.recharge.detail.pageTitle')"
            :order="orderDetail"
            :ui="{
                content: 'max-w-2xl overflow-y-auto h-fit',
            }"
            @get-list="getOrderList()"
            @close="orderDetailVisible = false"
        />
    </div>
</template>
