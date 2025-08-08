<script lang="ts" setup>
import { ProModal, useMessage } from "@fastbuildai/ui";
import { useRouter } from "vue-router";

import type { RechargeRule } from "@/models/package-management";
import type { OrderInfo, PrepaidInfo, RechargeCenterInfo } from "@/models/recharge-center";
import {
    getPayResult,
    getRechargeCenterInfo,
    prepaid,
    recharge,
} from "@/services/web/recharge-center";

/**
 * 支付方式接口
 */
interface PaymentMethod {
    /** 支付方式ID */
    value: number;
    /** 支付方式名称 */
    label: string;
    /** 支付方式图标 */
    icon: string;
}

// 组合式函数
const { t } = useI18n();
const toast = useMessage();
const userStore = useUserStore();
const router = useRouter();
// 付款信息
const prepaidData = ref<PrepaidInfo | null>(null);

// 订单信息
const orderInfo = ref<OrderInfo | null>(null);

// 充值套餐选项
const rechargeOptions = ref<RechargeRule[]>([]);

// 支付方式
const paymentMethods = ref<PaymentMethod[]>([]);

// 选中的充值选项索引
const selectedOptionIndex = ref(0);

// 选中的支付方式
const selectedPaymentMethod = ref<number>(1);

// 充值说明
const rechargeInstructions = ref<string>();

// 充值中心信息
const rechargeCenterInfo = ref<RechargeCenterInfo | null>(null);
let interval: ReturnType<typeof setInterval> | null = null;
// 充值成功提示
const rechargeSuccess = ref<boolean>(false);

// 获取充值中心信息
const getRechargeInfo = async () => {
    const res = await getRechargeCenterInfo();
    rechargeCenterInfo.value = res;
    paymentMethods.value = res.payWayList.map((item) => ({
        value: item.payType,
        label: item.name,
        icon: item.logo,
    }));
    rechargeInstructions.value = res.rechargeExplain;
    rechargeOptions.value = res.rechargeRule;
};

/**
 * 获取当前选中的充值选项
 */
const currentOption: any = computed(() => {
    if (rechargeOptions.value.length === 0) {
        return null;
    }
    return rechargeOptions.value[selectedOptionIndex.value];
});

/**
 * 处理充值操作
 */
const handleRecharge = async () => {
    try {
        const res = await recharge({
            id: currentOption.value.id,
            payType: selectedPaymentMethod.value,
        });
        orderInfo.value = res;
        const prepaidInfo = await prepaid({
            from: "recharge",
            orderId: res.orderId,
            payType: selectedPaymentMethod.value,
        });
        prepaidData.value = prepaidInfo;
        startPolling();
    } catch (error) {
        console.error(error);
        toast.error(t("web-personal-rights.rechargeCenter.qrCodeFailed"));
    }
};

// 轮询支付状态
const startPolling = () => {
    interval = setInterval(async () => {
        try {
            const res = await getPayResult({
                orderId: orderInfo.value?.orderId,
                from: "recharge",
            });
            if (res.payStatus === 1) {
                clearInterval(interval!);
                prepaidData.value = null;
                getRechargeInfo();
                userStore.getUser();
                rechargeSuccess.value = true;
            }
        } catch (error) {
            console.error(error);
            toast.error(t("web-personal-rights.rechargeCenter.payFailed"));
        }
    }, 3000);
};

const tokenDetail = () => {
    router.push("/profile/power-detail");
};

const handleModalClose = () => {
    prepaidData.value = null;
    clearInterval(interval!);
    toast.warning(t("web-personal-rights.rechargeCenter.cancelPay"));
};

// 跳转服务条款
const toServiceTerms = () => {
    window.open("/agreement?type=agreement&item=payment", "_blank");
};

// 关闭充值成功提示
const close = () => {
    rechargeSuccess.value = false;
};

onMounted(() => {
    getRechargeInfo();
});

// 页面销毁时清除轮询
onUnmounted(() => {
    if (interval) clearInterval(interval);
});

// 页面元信息
definePageMeta({
    layout: "setting",
    title: "menu.rechargeCenter",
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div class="h-full">
        <div v-if="rechargeCenterInfo?.rechargeStatus" class="flex h-full flex-col space-y-4 p-6">
            <div class="flex flex-1 flex-col space-y-8 overflow-y-auto">
                <!-- 用户信息 -->
                <div class="bg-muted flex items-center gap-4 rounded-lg p-4">
                    <UAvatar :src="userStore.userInfo!.avatar" size="3xl" />
                    <div>
                        <div class="text-lg font-medium">
                            <span>{{
                                userStore.userInfo!.nickname || t("common.profile.notSet")
                            }}</span>
                        </div>
                        <div
                            class="text-muted-foreground flex items-center gap-1"
                            @click="tokenDetail"
                        >
                            <span class="text-center">
                                {{ t("web-personal-rights.rechargeCenter.powerBalance") }}：
                                {{ rechargeCenterInfo?.user.power }}
                            </span>
                            <UIcon name="i-lucide-chevron-right" class="text-sm" />
                        </div>
                    </div>
                </div>

                <!-- 充值选项 -->
                <div class="space-y-4">
                    <h2 class="text-lg font-medium">
                        {{ t("web-personal-rights.rechargeCenter.selectRechargePackage") }}
                    </h2>
                    <div
                        class="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        <div
                            v-for="(option, index) in rechargeOptions"
                            :key="index"
                            class="border-muted relative cursor-pointer rounded-lg border p-4 transition-all duration-200"
                            :class="{
                                'border-primary-500 bg-muted': selectedOptionIndex === index,
                                'hover:border-primary-300 border-gray-200':
                                    selectedOptionIndex !== index,
                            }"
                            @click="selectedOptionIndex = index"
                        >
                            <!-- 特惠标签 -->
                            <div
                                v-if="option.label"
                                class="absolute -top-4 left-0 rounded-tl-md rounded-br-md bg-[#352B00] px-2 py-0.5 text-xs text-[#FFE7B5]"
                            >
                                {{ option.label }}
                            </div>

                            <!-- 电力值 -->
                            <div class="mb-2 flex items-center gap-2">
                                <UIcon name="i-lucide-zap" class="text-xl text-blue-500" />
                                <span class="text-xl font-bold">{{ option.power }}</span>
                            </div>

                            <!-- 价格 -->
                            <div class="mb-4 text-lg font-medium text-gray-700">
                                ¥ {{ option.sellPrice }}
                            </div>

                            <!-- 描述列表 -->
                            <ul class="space-y-2">
                                <li v-if="option.givePower" class="flex items-center gap-2">
                                    <UIcon name="i-lucide-check" class="text-sm text-green-500" />
                                    <span class="text-sm text-gray-600">
                                        <span>{{
                                            t("web-personal-rights.rechargeCenter.add")
                                        }}</span>
                                        <span class="font-bold">{{ option.givePower }}</span>
                                        <span>{{
                                            t("web-personal-rights.rechargeCenter.power")
                                        }}</span>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 支付方式 -->
                <div class="space-y-4">
                    <h2 class="text-lg font-medium">
                        {{ t("web-personal-rights.rechargeCenter.paymentMethod") }}
                    </h2>
                    <div class="flex flex-row items-center justify-start gap-6">
                        <URadioGroup
                            v-model="selectedPaymentMethod"
                            orientation="horizontal"
                            variant="card"
                            color="primary"
                            :items="paymentMethods"
                        >
                            <template #label="{ item }: { item: PaymentMethod }">
                                <div class="flex items-center gap-2">
                                    <UAvatar :src="item?.icon" size="2xs" />
                                    <span>{{ item?.label }}</span>
                                </div>
                            </template>
                        </URadioGroup>
                    </div>
                </div>

                <!-- 充值说明 -->
                <div class="space-y-4">
                    <h2 class="text-lg font-medium">
                        {{ t("web-personal-rights.rechargeCenter.rechargeInstructions.title") }}
                    </h2>
                    <div
                        v-html="rechargeInstructions"
                        class="space-y-2 text-sm whitespace-pre-wrap text-gray-600"
                    ></div>
                </div>
            </div>

            <!-- 支付按钮 -->
            <div class="flex items-center justify-between border-t pt-4">
                <div class="text-lg">
                    <span class="text-muted-foreground text-sm">{{
                        t("web-personal-rights.rechargeCenter.agreement")
                    }}</span>
                    <UButton variant="link" class="p-0" @click="toServiceTerms">
                        《{{ t("web-personal-rights.rechargeCenter.payment") }}》
                    </UButton>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-xl font-bold">¥ {{ currentOption?.sellPrice }}</div>
                    <UButton
                        color="primary"
                        size="lg"
                        :disabled="!rechargeCenterInfo?.rechargeStatus"
                        @click="handleRecharge"
                    >
                        {{ t("web-personal-rights.rechargeCenter.immediatelyPurchase") }}
                    </UButton>
                </div>
            </div>

            <!-- 支付码 -->
            <ProModal
                v-if="prepaidData"
                :ui="{
                    content: 'max-w-sm overflow-y-auto h-fit',
                }"
                :title="
                    prepaidData?.payType === 1
                        ? t('web-personal-rights.rechargeCenter.wxPay')
                        : t('web-personal-rights.rechargeCenter.alipayPay')
                "
                :model-value="true"
                @update:model-value="handleModalClose"
            >
                <template #default>
                    <div class="flex flex-col items-center justify-center gap-2">
                        <img class="w-52" :src="prepaidData?.qrCode.code_url" alt="prepaidData" />
                        <div>
                            <span class="text-lg font-medium">合计：</span>
                            <span class="text-xl font-bold text-red-500">
                                ¥{{ orderInfo?.orderAmount }}
                            </span>
                        </div>
                        <div class="text-center text-lg">请使用微信扫码支付</div>
                        <div class="text-muted-foreground pt-2 text-center text-sm">
                            如遇问题无法解决时，请联系站点管理员
                        </div>
                    </div>
                </template>
            </ProModal>

            <ProModal
                :ui="{
                    content: 'max-w-xs overflow-y-auto h-fit',
                }"
                title="系统提示"
                :model-value="rechargeSuccess"
                @update:model-value="close"
            >
                <div class="flex flex-col items-center justify-center gap-2 p-4">
                    <div class="flex items-center justify-center gap-2">
                        <UIcon name="tabler:circle-check-filled" class="text-2xl text-green-500" />
                        <h1 class="text-xl font-bold">
                            {{ t("web-personal-rights.rechargeCenter.rechargeSuccess") }}
                        </h1>
                    </div>
                    <p class="text-muted-foreground text-sm">
                        {{ t("web-personal-rights.rechargeCenter.rechargeSuccessTip") }}
                    </p>
                </div>
            </ProModal>
        </div>
        <div v-else class="h-full">
            <div class="flex justify-center p-20">
                <div class="w-full max-w-md p-8 text-center">
                    <UIcon name="lucide:lock" class="text-primary mx-auto mb-4 text-4xl" />
                    <h1 class="mb-2 text-2xl font-bold">
                        {{ t("web-personal-rights.rechargeCenter.notOpen") }}
                    </h1>
                    <p class="text-muted-foreground text-sm">
                        {{ t("web-personal-rights.rechargeCenter.notOpenTip") }}
                    </p>
                    <UButton
                        class="mt-6"
                        icon="i-tabler-arrow-left"
                        variant="soft"
                        @click="$router.back()"
                    >
                        {{ t("web-personal-rights.rechargeCenter.back") }}
                    </UButton>
                </div>
            </div>
        </div>
    </div>
</template>
