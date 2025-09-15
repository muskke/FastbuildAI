<script setup lang="ts">
import { ProPaginaction } from "@fastbuildai/ui";
import type { Column, Row } from "@tanstack/table-core";
import { resolveComponent } from "vue";
import { useI18n } from "vue-i18n";

import type { AccountBalanceListItem } from "@/models/account-balance";
import { getAccountBalanceList } from "@/services/console/account-balance";
const TimeDisplay = resolveComponent("TimeDisplay");
const UButton = resolveComponent("UButton");
const { t } = useI18n();

const inputValue = ref("");
const selectValue = ref<string | null>(null);

const columns = computed(() => [
    {
        accessorKey: "accountNo",
        header: t("console-financial.accountBalance.table.userNo"),
    },
    {
        accessorKey: "nickname",
        header: t("console-financial.accountBalance.table.nickname"),
    },
    {
        accessorKey: "changeAmount",
        header: t("console-financial.accountBalance.table.changeAmount"),
    },
    {
        accessorKey: "leftAmount",
        header: t("console-financial.accountBalance.table.leftAmount"),
    },
    {
        accessorKey: "accountTypeDesc",
        header: t("console-financial.accountBalance.table.accountTypeDesc"),
    },
    {
        accessorKey: "consumeSourceDesc",
        header: t("console-financial.accountBalance.table.consumeSourceDesc"),
    },
    {
        accessorKey: "associationUser",
        header: t("console-financial.accountBalance.table.associationUser"),
    },
    {
        accessorKey: "createdAt",
        header: ({ column }: { column: Column<AccountBalanceListItem> }) => {
            const isSorted = column.getIsSorted();

            return h(UButton, {
                color: "neutral",
                variant: "ghost",
                label: t("console-financial.accountBalance.table.createdAt"),
                icon: isSorted
                    ? isSorted === "asc"
                        ? "i-lucide-arrow-up-narrow-wide"
                        : "i-lucide-arrow-down-wide-narrow"
                    : "i-lucide-arrow-up-down",
                class: "-mx-2.5",
                onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
            });
        },
        cell: ({ row }: { row: Row<AccountBalanceListItem> }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
]);

const accountBalanceList = ref<AccountBalanceListItem[]>([]);

const paging = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
});

const items = ref<any[]>([]);

const getLists = async () => {
    const res = await getAccountBalanceList({
        page: paging.page,
        pageSize: paging.pageSize,
        accountType: selectValue.value ?? undefined,
        keyword: inputValue.value,
    });
    accountBalanceList.value = res.items;
    paging.total = res.total;
};

const handleSearch = () => {
    getLists();
};

onMounted(() => {
    getLists();
});
</script>

<template>
    <div class="flex h-full flex-col space-y-4">
        <!-- 搜索区域 -->
        <div class="flex items-center gap-4 pb-2">
            <UInput
                class="w-56"
                v-model="inputValue"
                :placeholder="t('console-financial.accountBalance.searchPlaceholder')"
                @update:model-value="handleSearch"
            />
            <USelect
                class="w-56"
                v-model="selectValue"
                :items="[
                    {
                        label: t('console-plugins.market.allTypes'),
                        value: null,
                    },
                    {
                        label: t('console-financial.accountBalance.userRecharge'),
                        value: '100',
                    },
                    {
                        label: t('console-financial.accountBalance.userRechargeGift'),
                        value: '101',
                    },
                    {
                        label: t('console-financial.accountBalance.userRechargeRefund'),
                        value: '102',
                    },
                    {
                        label: t('console-financial.accountBalance.systemIncreasePower'),
                        value: '200',
                    },
                    {
                        label: t('console-financial.accountBalance.systemDecreasePower'),
                        value: '201',
                    },
                    {
                        label: t('console-financial.accountBalance.basicConversation'),
                        value: '300',
                    },
                    {
                        label: t('console-financial.accountBalance.agentConversation'),
                        value: '400',
                    },
                    {
                        label: t('console-financial.accountBalance.sharedAgentConversation'),
                        value: '401',
                    },
                    {
                        label: t('console-financial.accountBalance.pluginConsumption'),
                        value: '500',
                    },
                ]"
                @update:model-value="getLists"
                placeholder="变动类型"
            />
        </div>

        <!-- 表格区域 -->
        <div class="flex-1 overflow-hidden">
            <div class="h-full">
                <UTable
                    sticky
                    :columns="columns"
                    :data="accountBalanceList"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default',
                    }"
                    class="h-[calc(100vh-13rem)] shrink-0"
                >
                    <template #userNo-cell="{ row }">
                        {{ row.original.accountNo }}
                    </template>
                    <template #nickname-cell="{ row }">
                        <UAvatar v-if="row.original.user?.avatar" :src="row.original.user.avatar" />
                        <UAvatar
                            v-else
                            icon="i-heroicons-user"
                            :name="row.original.user?.username"
                        />
                        {{ row.original.user?.username }}
                    </template>
                    <template #changeAmount-cell="{ row }">
                        <span v-if="row.original.action === 1" class="text-green-500">
                            +{{ row.original.changeAmount }}
                        </span>
                        <span v-else class="text-red-500"> -{{ row.original.changeAmount }} </span>
                    </template>
                </UTable>
            </div>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end py-4">
            <ProPaginaction
                v-model:page="paging.page"
                v-model:size="paging.pageSize"
                :total="paging.total"
                @change="getLists"
            />
        </div>
    </div>
</template>
