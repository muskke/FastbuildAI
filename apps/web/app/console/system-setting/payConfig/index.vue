<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui";
import { useThrottleFn } from "@vueuse/core";
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { PayconfigTableData } from "@/models/payconfig.d.ts";
import type { BooleanNumberType } from "@/models/payconfig.d.ts";
import { apiGetPayconfigList, apiUpdatePayconfigStatus } from "@/services/console/payconfig";

const message = useMessage();
// const Card = defineAsyncComponent(() => import("./_components/card.vue"));
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const payconfigList = ref<PayconfigTableData[]>([]);
const updatePayconfigStatus = useThrottleFn(async (id: string, isEnable: BooleanNumberType) => {
    try {
        await apiUpdatePayconfigStatus(id, isEnable);
        message.success(t("console-system.website.messages.saveSuccess"));
        getPayconfigList();
    } catch (error) {
        message.error(t("console-system.website.messages.saveFailed"));
    }
}, 1000);
const getPayconfigList = async () => {
    const data = await apiGetPayconfigList();
    payconfigList.value = data.map(({ id, name, payType, isEnable, logo, isDefault, sort }) => ({
        id,
        name,
        payType,
        isEnable,
        logo,
        isDefault,
        sort,
    }));
};

const columns = computed(() => {
    return [
        {
            accessorKey: "logo",
            header: t("console-payconfig.logo"),
        },
        {
            accessorKey: "payType",
            header: t("console-payconfig.payType"),
        },
        {
            accessorKey: "name",
            header: t("console-payconfig.name"),
        },

        {
            accessorKey: "isEnable",
            header: t("console-payconfig.isEnable"),
        },
        {
            accessorKey: "isDefault",
            header: t("console-payconfig.isDefault"),
        },
        {
            accessorKey: "sort",
            header: t("console-payconfig.sort"),
        },
        {
            accessorKey: "action",
            header: t("console-payconfig.action"),
        },
    ];
});

const edit = (id: string) => {
    router.push({
        path: useRoutePath("system-payconfig:update"),
        query: {
            id,
        },
    });
};

onMounted(() => {
    getPayconfigList();
});
</script>

<template>
    <div class="system-payConfig p-2">
        <!-- 页面头部 -->
        <div class="mb-6">
            <h1 class="text-secondary-foreground text-2xl font-bold">
                {{ $t("console-payconfig.title") }}
            </h1>
        </div>
        <UTable
            :columns="columns"
            :data="payconfigList"
            :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                tr: '[&:has(>td[colspan])]:hidden',
            }"
        >
            <template #logo-cell="{ row }">
                <UAvatar
                    :src="row.original.logo"
                    :alt="
                        row.original.payType === 1
                            ? t('console-payconfig.wxPay')
                            : t('console-payconfig.alipayPay')
                    "
                    size="md"
                    :ui="{ root: 'rounded-lg' }"
                />
            </template>
            <template #payType-cell="{ row }">
                {{
                    row.original.payType === 1
                        ? t("console-payconfig.wxPay")
                        : t("console-payconfig.aliPay")
                }}
            </template>
            <template #isEnable-cell="{ row }">
                <USwitch
                    :model-value="row.original.isEnable === 1"
                    @update:model-value="updatePayconfigStatus(row.original.id, $event ? 1 : 0)"
                    size="md"
                />
            </template>
            <template #isDefault-cell="{ row }">
                <UBadge
                    v-if="row.original.isDefault === 1"
                    :label="t('console-common.default')"
                    color="success"
                />
                <div v-else></div>
            </template>
            <template #action-cell="{ row }">
                <UButton size="md" variant="ghost" color="primary" @click="edit(row.original.id)">
                    {{ $t("console-common.edit") }}
                </UButton>
            </template>
        </UTable>

        <!-- 支付卡片网格 -->
        <!-- <div class="grid grid-cols-1 gap-6 py-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card
                v-for="item in payconfigList"
                :key="item.id"
                :payconfig="item"
                @update:isEnable="updatePayconfigStatus(item.id, $event ? 1 : 0)"
            />
        </div> -->
    </div>
</template>
