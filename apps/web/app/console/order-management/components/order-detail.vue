<script setup lang="ts">
import { ProModal, useMessage, useModal } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";

import type { OrderDetailData } from "@/models/order-recharge";
import { apiRefund } from "@/services/console/order-recharge";

const props = defineProps<{
    order?: OrderDetailData | null;
}>();

const emits = defineEmits<{
    (e: "close"): void;
    (e: "get-list"): void;
}>();

// 获取国际化函数
const { t } = useI18n();

interface Order {
    rechargeQuantity?: number;
    freeQuantity?: number;
    quantityReceived?: number;
    paidInAmount?: string;
}
const columns: TableColumn<Order>[] = [
    {
        id: "rechargeQuantity",
        header: t("console-order-management.recharge.list.rechargeQuantity"),
        cell: ({ row }) => row.original.rechargeQuantity,
    },

    {
        id: "freeQuantity",
        header: t("console-order-management.recharge.list.freeQuantity"),
        cell: ({ row }) => row.original.freeQuantity,
    },
    {
        id: "quantityReceived",
        header: t("console-order-management.recharge.list.quantityReceived"),
        cell: ({ row }) => row.original.quantityReceived,
    },
    {
        id: "paidInAmount",
        accessorKey: "paidInAmount",
        header: t("console-order-management.recharge.list.paidInAmount"),
        cell: ({ row }) => {
            const paidInAmount = Number.parseFloat(row.getValue("paidInAmount"));
            const formattedPaidInAmount = new Intl.NumberFormat("zh-CN", {
                style: "currency",
                currency: "CNY",
            }).format(paidInAmount);
            return formattedPaidInAmount;
        },
    },
];
const toast = useMessage();

const tableData = ref<Order[]>([
    {
        rechargeQuantity: props.order?.power,
        freeQuantity: props.order?.givePower,
        quantityReceived: props.order?.totalPower,
        paidInAmount: props.order?.orderAmount,
    },
]);

// 退款
const handleRefund = async () => {
    await useModal({
        title: "退款",
        description: "是否确定退款？",
        color: "warning",
    });

    await apiRefund(props.order?.id || "");
    toast.success("退款成功");
    getOrderList();
    handleClose();
};

const getOrderList = () => {
    emits("get-list");
};

const handleClose = () => {
    emits("close");
};
</script>

<template>
    <ProModal :model-value="true" @update:model-value="() => handleClose()">
        <div class="grid grid-cols-1 gap-x-6 gap-y-5 py-4 pb-4 md:grid-cols-2">
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.list.orderNo") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.orderNo }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.orderSource") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.terminalDesc }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.userInfo") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.user?.username }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.orderType") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.orderType }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.paymentStatus") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.payStatus === 1 ? "已支付" : "未支付" }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.paymentMethod") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.payTypeDesc }}
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.createdAt") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    <TimeDisplay
                        v-if="order?.createdAt"
                        :datetime="order.createdAt"
                        mode="datetime"
                    />
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.paidAt") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    <TimeDisplay v-if="order?.payTime" :datetime="order.payTime" mode="datetime" />
                </div>
            </div>
            <div>
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.refundStatus") }}
                </div>
                <div v-if="order?.refundStatus" class="mt-1 truncate text-red-500">
                    {{ order?.refundStatusDesc }}
                </div>
                <div v-else class="text-secondary-foreground mt-1 truncate">-</div>
            </div>
            <div v-if="order?.refundStatus">
                <div class="text-muted-foreground text-sm">
                    {{ t("console-order-management.recharge.detail.serialNumber") }}
                </div>
                <div class="text-secondary-foreground mt-1 truncate">
                    {{ order?.refundNo }}
                </div>
            </div>
        </div>
        <UTable ref="table" :data="tableData" :columns="columns" class="flex-1"></UTable>

        <template #footer>
            <div class="flex items-center justify-end gap-2">
                <UButton
                    v-if="order?.refundStatus === 0 && order?.payStatus === 1"
                    color="primary"
                    @click="handleRefund"
                    >{{ t("console-order-management.recharge.detail.refund") }}</UButton
                >
                <UButton color="neutral" variant="soft" @click="handleClose">{{
                    t("console-order-management.recharge.detail.close")
                }}</UButton>
            </div>
        </template>
    </ProModal>
</template>
