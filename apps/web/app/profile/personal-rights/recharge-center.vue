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

const appStore = useAppStore();

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
// const rechargeCenterInfo = ref<RechargeCenterInfo | null>(null);
let interval: ReturnType<typeof setInterval> | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
// 充值成功提示
const rechargeSuccess = ref<boolean>(false);
// 二维码是否失效
const isQrCodeExpired = ref<boolean>(false);

const { data: rechargeCenterInfo } = await useAsyncData(
    "rechargeCenterInfo",
    () => getRechargeCenterInfo(),
    {
        transform: (data) => {
            paymentMethods.value = data.payWayList.map((item) => ({
                value: item.payType,
                label: item.name,
                icon: item.logo,
            }));
            rechargeInstructions.value = data.rechargeExplain;
            rechargeOptions.value = data.rechargeRule;
            return data;
        },
    },
);

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
    }
};

// 轮询支付状态
const startPolling = () => {
    // 重置二维码失效状态
    isQrCodeExpired.value = false;

    interval = setInterval(async () => {
        try {
            const res = await getPayResult({
                orderId: orderInfo.value?.orderId,
                from: "recharge",
            });
            if (res.payStatus === 1) {
                clearInterval(interval!);
                clearTimeout(timeoutTimer!);
                prepaidData.value = null;
                getRechargeInfo();
                userStore.getUser();
                rechargeSuccess.value = true;
            }
        } catch (error) {
            console.error(error);
        }
    }, 3000);

    // 设置120秒超时
    timeoutTimer = setTimeout(() => {
        clearInterval(interval!);
        isQrCodeExpired.value = true;
    }, 120000); // 120秒
};

const tokenDetail = () => {
    router.push("/profile/power-detail");
};

const handleModalClose = () => {
    prepaidData.value = null;
    clearInterval(interval!);
    clearTimeout(timeoutTimer!);
    isQrCodeExpired.value = false;
    toast.warning(t("web-personal-rights.rechargeCenter.cancelPay"));
};

/**
 * 刷新二维码
 */
const handleRefreshQrCode = async () => {
    try {
        // 清理现有定时器
        clearInterval(interval!);
        clearTimeout(timeoutTimer!);

        // 检查订单ID是否存在
        if (!orderInfo.value?.orderId) {
            console.error("订单ID不存在");
            return;
        }

        // 重新获取支付二维码
        const prepaidInfo = await prepaid({
            from: "recharge",
            orderId: orderInfo.value.orderId,
            payType: selectedPaymentMethod.value,
        });
        prepaidData.value = prepaidInfo;

        // 重新开始轮询
        startPolling();
    } catch (error) {
        console.error(error);
    }
};

// 跳转服务条款
const toServiceTerms = () => {
    window.open("/agreement?type=agreement&item=payment", "_blank");
};

// 关闭充值成功提示
const close = () => {
    rechargeSuccess.value = false;
};

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

//跳转到充值记录
const toRechargeRecord = () => {
    close();
    router.push("/profile/power-detail");
};
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
                            class="text-muted-foreground flex cursor-pointer items-center gap-1"
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
                        v-if="rechargeOptions.length > 0"
                        class="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        <div
                            v-for="(option, index) in rechargeOptions"
                            :key="index"
                            class="border-muted relative cursor-pointer rounded-lg border p-4 transition-all duration-200"
                            :class="{
                                'border-primary-500 bg-muted': selectedOptionIndex === index,
                                'bg-primary/5': selectedOptionIndex === index,
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
                                <UIcon name="i-lucide-zap" class="text-primary text-xl" />
                                <span class="text-xl font-bold">{{ option.power }}</span>
                            </div>

                            <!-- 价格 -->
                            <div class="mb-4 text-lg font-medium">¥ {{ option.sellPrice }}</div>

                            <!-- 描述列表 -->
                            <ul class="space-y-2">
                                <li v-if="option.givePower" class="flex items-center gap-2">
                                    <UIcon name="i-lucide-check" class="text-sm text-green-500" />
                                    <span class="space-x-1 text-sm text-gray-600">
                                        <span>{{
                                            t("web-personal-rights.rechargeCenter.add")
                                        }}</span>
                                        <span class="font-bold"> {{ option.givePower }} </span>
                                        <span>{{
                                            t("web-personal-rights.rechargeCenter.power")
                                        }}</span>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div v-else class="text-muted-foreground">
                        {{ t("web-personal-rights.rechargeCenter.noRechargeOptions") }}
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
                        v-if="rechargeInstructions"
                        v-html="rechargeInstructions"
                        class="text-muted-foreground space-y-2 text-sm whitespace-pre-wrap"
                    ></div>
                    <div v-else class="text-muted-foreground text-sm">
                        {{ t("web-personal-rights.rechargeCenter.rechargeInstructions.content") }}
                    </div>
                </div>
            </div>

            <!-- 支付按钮 -->
            <div class="flex items-center justify-between border-t pt-4">
                <div class="text-lg">
                    <span class="text-muted-foreground text-sm">{{
                        t("web-personal-rights.rechargeCenter.agreement")
                    }}</span>
                    <UButton variant="link" class="p-0" @click="toServiceTerms">
                        《{{
                            appStore.siteConfig?.agreement.paymentTitle ||
                            t("web-personal-rights.rechargeCenter.payment")
                        }}》
                    </UButton>
                </div>
                <div class="flex items-center gap-4">
                    <div v-if="currentOption" class="text-xl font-bold">
                        ¥ {{ currentOption?.sellPrice }}
                    </div>
                    <UButton
                        color="primary"
                        size="lg"
                        :disabled="!rechargeCenterInfo?.rechargeRule.length"
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
                        <div class="relative h-52 w-52">
                            <img
                                class="w-full"
                                :src="prepaidData?.qrCode.code_url"
                                alt="微信支付码"
                            />
                            <div
                                v-if="isQrCodeExpired"
                                class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm dark:bg-gray-800/60"
                            >
                                <UIcon
                                    name="i-lucide-alert-triangle"
                                    class="mb-2 text-5xl text-yellow-500"
                                />
                                <p class="mb-2 text-sm text-gray-700 dark:text-gray-300">
                                    {{ t("web-personal-rights.rechargeCenter.qrCodeExpired") }}
                                </p>
                                <UButton
                                    class="cursor-pointer"
                                    size="xs"
                                    @click="handleRefreshQrCode"
                                >
                                    {{ t("web-personal-rights.rechargeCenter.refreshQrCode") }}
                                </UButton>
                            </div>
                        </div>
                        <div>
                            <span class="text-lg font-medium">
                                {{ t("web-personal-rights.rechargeCenter.total") }}：
                            </span>
                            <span class="text-xl font-bold text-red-500">
                                ¥{{ orderInfo?.orderAmount }}
                            </span>
                        </div>
                        <div class="text-center text-lg">
                            {{ t("web-personal-rights.rechargeCenter.use")
                            }}{{
                                prepaidData?.payType === 1
                                    ? t("web-personal-rights.rechargeCenter.wxPay")
                                    : t("web-personal-rights.rechargeCenter.alipayPay")
                            }}{{ t("web-personal-rights.rechargeCenter.pay") }}
                        </div>
                        <div class="text-muted-foreground pt-2 text-center text-sm">
                            {{ t("web-personal-rights.rechargeCenter.contact") }}
                        </div>
                    </div>
                </template>
            </ProModal>

            <ProModal
                :ui="{
                    content: 'max-w-xs overflow-y-auto h-fit',
                }"
                :title="t('web-personal-rights.rechargeCenter.systemTip')"
                :model-value="rechargeSuccess"
                @update:model-value="close"
            >
                <div class="space-y-4">
                    <div class="flex flex-col items-center justify-center gap-2 p-4">
                        <div class="flex items-center justify-center gap-2">
                            <UIcon
                                name="tabler:circle-check-filled"
                                class="text-2xl text-green-500"
                            />
                            <h1 class="text-xl font-bold">
                                {{ t("web-personal-rights.rechargeCenter.rechargeSuccess") }}
                            </h1>
                        </div>
                        <p class="text-muted-foreground text-sm">
                            {{ t("web-personal-rights.rechargeCenter.rechargeSuccessTip") }}
                        </p>
                    </div>
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="soft" @click="close"> 继续充值 </UButton>
                        <UButton color="primary" type="submit" @click="toRechargeRecord">
                            查看记录
                        </UButton>
                    </div>
                </div>
            </ProModal>
        </div>
        <div v-else class="h-full">
            <div class="flex justify-center p-20">
                <div class="w-full max-w-md p-8 text-center">
                    <UIcon name="i-lucide-lock" class="text-primary mx-auto mb-4 text-4xl" />
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
