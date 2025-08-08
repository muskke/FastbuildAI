<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { useI18n } from "vue-i18n";

import type { RechargeConfigData, RechargeRule } from "@/models/package-management";
import { apiGetRechargeRules, saveRechargeRules } from "@/services/console/package-management";
const { t } = useI18n();

const toast = useMessage();
const rechargeStatus = ref(true);
const changeValue = ref(false);
const rechargeRules = ref<RechargeRule[]>([]);
const rechargeExplain = ref("");

const columns: TableColumn<RechargeRule>[] = [
    {
        id: "move",
        header: "#",
        size: 40,
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "rechargeValue",
        accessorKey: "rechargeValue",
        header: t("console-marketing.packageManagement.tab.rechargeValue"),
    },
    {
        id: "freeQuantity",
        accessorKey: "freeQuantity",
        header: t("console-marketing.packageManagement.tab.freeQuantity"),
    },
    {
        id: "price",
        accessorKey: "price",
        header: t("console-marketing.packageManagement.tab.price"),
    },
    {
        id: "label",
        accessorKey: "label",
        header: t("console-marketing.packageManagement.tab.label"),
    },
    // {
    //     id: "status",
    //     accessorKey: "status",
    //     header: t("console-marketing.packageManagement.tab.status"),
    // },
    {
        id: "action",
        header: t("console-marketing.packageManagement.tab.action"),
        size: 40, // 固定宽度
        enableSorting: false,
        enableHiding: false,
    },
];

const oldData = ref<RechargeConfigData>();

const getRechargeRules = async () => {
    const data = await apiGetRechargeRules();
    oldData.value = data;
    rechargeRules.value = data.rechargeRule.map((item) => ({ ...item }));
    rechargeStatus.value = data.rechargeStatus;
    rechargeExplain.value = data.rechargeExplain;
};

const addRow = () => {
    const newRow = ref<RechargeRule>({
        givePower: 0,
        label: "",
        power: 0,
        sellPrice: 0,
    });
    rechargeRules.value.push(newRow.value);
};

const deleteRow = (row: RechargeRule) => {
    rechargeRules.value = rechargeRules.value.filter((item) => item !== row);
};

const saveRules = async () => {
    try {
        await saveRechargeRules({
            rechargeRule: rechargeRules.value,
            rechargeStatus: rechargeStatus.value,
            rechargeExplain: rechargeExplain.value,
        });
        getRechargeRules();
        toast.success(t("console-marketing.packageManagement.saveSuccess"));
    } catch (error) {
        console.error(error);
        toast.error(t("console-marketing.packageManagement.saveFailed"));
    }
};

watch(rechargeStatus, () => {
    if (rechargeStatus.value !== oldData.value?.rechargeStatus) {
        changeValue.value = true;
    } else {
        changeValue.value = false;
    }
});
watch(rechargeExplain, () => {
    if (rechargeExplain.value !== oldData.value?.rechargeExplain) {
        changeValue.value = true;
    } else {
        changeValue.value = false;
    }
});

// 判断充值规则是否变化
const isEqual = (arr1: RechargeRule[], arr2: RechargeRule[] | undefined) => {
    if (!arr2) return false;
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => {
        if (
            item?.power !== arr2[index]?.power ||
            item?.givePower !== arr2[index]?.givePower ||
            item?.sellPrice !== arr2[index]?.sellPrice ||
            item?.label !== arr2[index]?.label
        ) {
            return false;
        } else {
            return true;
        }
    });
};

watch(
    rechargeRules,
    () => {
        if (!isEqual(rechargeRules.value, oldData.value?.rechargeRule)) {
            changeValue.value = true;
        } else {
            changeValue.value = false;
        }
    },
    { deep: true },
);

onMounted(() => {
    getRechargeRules();
});
</script>

<template>
    <div class="my-px space-y-4 pb-6">
        <div class="flex flex-col gap-6">
            <!-- 状态管理 -->
            <div class="">
                <div>
                    <div class="mb-4 flex flex-col gap-1">
                        <div class="text-secondary-foreground text-md font-bold">
                            {{ t("console-marketing.packageManagement.statusTitle") }}
                        </div>
                        <div class="text-muted-foreground text-xs">
                            {{ t("console-marketing.packageManagement.statusDescription") }}
                        </div>
                    </div>
                    <USwitch v-model="rechargeStatus" />
                </div>
            </div>

            <!-- 充值说明 -->
            <div v-if="rechargeStatus">
                <div class="mb-4 flex flex-col gap-1">
                    <div class="text-secondary-foreground text-md font-bold">
                        {{ t("console-marketing.packageManagement.rechargeInstructionsTitle") }}
                    </div>
                    <div class="text-muted-foreground text-xs">
                        {{
                            t("console-marketing.packageManagement.rechargeInstructionsDescription")
                        }}
                    </div>
                </div>
                <div class="w-full text-sm">
                    <UTextarea
                        class="w-full"
                        v-model="rechargeExplain"
                        :rows="6"
                        placeholder="请输入套餐充值说明..."
                    />
                </div>
            </div>
            <div class="flex-1">
                <div class="flex w-full items-center justify-between">
                    <div class="text-secondary-foreground text-md font-bold">
                        {{ t("console-marketing.packageManagement.rechargeRulesTitle") }}
                    </div>
                    <div class="flex items-center justify-between gap-2 px-4">
                        <UButton
                            color="primary"
                            variant="outline"
                            icon="tabler:plus"
                            :ui="{ leadingIcon: 'size-4' }"
                            @click="addRow"
                        >
                            {{ t("console-marketing.packageManagement.button.new") }}
                        </UButton>
                    </div>
                </div>
                <div class="mt-4">
                    <UTable
                        ref="table"
                        :data="rechargeRules"
                        :columns="columns"
                        :ui="{
                            base: 'table-fixed border-separate border-spacing-0',
                            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                            td: 'border-b border-default',
                            tr: '[&:has(>td[colspan])]:hidden',
                        }"
                    >
                        <template #move-cell="{ row }">
                            {{ row.index + 1 }}
                        </template>
                        <template #rechargeValue-cell="{ row }">
                            <UInput v-model="row.original.power" type="number" />
                        </template>
                        <template #freeQuantity-cell="{ row }">
                            <UInput v-model="row.original.givePower" type="number" />
                        </template>
                        <template #price-cell="{ row }">
                            <UInput
                                v-model="row.original.sellPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                :ui="{
                                    trailing:
                                        'bg-muted-foreground/15 pl-2 rounded-tr-lg rounded-br-lg',
                                }"
                            >
                                <template #trailing>
                                    <span>{{
                                        t("console-marketing.packageManagement.tab.priceUnit")
                                    }}</span>
                                </template>
                            </UInput>
                        </template>
                        <template #label-cell="{ row }">
                            <UInput v-model="row.original.label" />
                        </template>
                        <!-- <template #status-cell="{ row }">
                                <USwitch v-model="row.original.status" />
                            </template> -->
                        <template #action-cell="{ row }">
                            <UButton
                                icon="tabler:trash"
                                color="error"
                                variant="ghost"
                                @click="deleteRow(row.original)"
                            />
                        </template>
                    </UTable>
                </div>
            </div>
            <div class="flex justify-end">
                <AccessControl :codes="['recharge-config:setConfig']">
                    <UButton
                        color="primary"
                        :disabled="!changeValue"
                        :ui="{ base: 'w-16 flex justify-center items-center' }"
                        @click="saveRules"
                    >
                        {{ t("console-marketing.packageManagement.button.save") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>
    </div>
</template>
