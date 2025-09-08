<script setup lang="ts">
import { usePollingTask } from "@fastbuildai/ui/composables/usePollingTask";
import { da } from "@nuxt/ui/runtime/locale/index.js";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { WECHAT_LOGIN_STATUS, type WechatLoginStatus } from "@/common/constants";
import type { LoginResponse } from "@/models/user";
import { apiCheckTicket, apiGetWxCode } from "@/services/web/user";

const PrivacyTerms = defineAsyncComponent(() => import("../privacy-terms.vue"));

interface StatusConfigType {
    icon: string;
    color: string;
    message: string;
    showRefresh?: boolean;
}

const emits = defineEmits<{
    (e: "updateStyle", v: { width: string; height: string }): void;
    (e: "update:showLoginMethods", v: boolean): void;
    (e: "success", v: LoginResponse): void;
}>();

const appStore = useAppStore();
const userStore = useUserStore();
const qrCodeUrl = ref<string>("");
const qrCodeKey = ref<string>("");
const loginStatus = ref<WechatLoginStatus>(WECHAT_LOGIN_STATUS.NORMAL);
const isLoading = ref<boolean>(false);

// 状态相关计算属性
const statusConfig = computed<StatusConfigType>(() => {
    const configMap: Record<number, StatusConfigType> = {
        // [WECHAT_LOGIN_STATUS.SCANNED_CODE]: {
        //     icon: "i-lucide-check",
        //     color: "text-green-500",
        //     message: "已扫码，请在微信上确认登录",
        // },
        [WECHAT_LOGIN_STATUS.LOGIN_SUCCESS]: {
            icon: "i-lucide-check-circle",
            color: "text-green-500",
            message: "登录成功，正在跳转...",
        },
        [WECHAT_LOGIN_STATUS.INVALID]: {
            icon: "i-lucide-alert-circle",
            color: "text-red-500",
            message: "二维码已过期，请刷新",
            showRefresh: true,
        },
        [WECHAT_LOGIN_STATUS.LOGIN_FAIL]: {
            icon: "i-lucide-alert-circle",
            color: "text-red-500",
            message: "登录失败，请重试",
            showRefresh: true,
        },
        [WECHAT_LOGIN_STATUS.CODE_ERROR]: {
            icon: "i-lucide-alert-circle",
            color: "text-red-500",
            message: "获取二维码失败，请重试",
            showRefresh: true,
        },
    };
    return configMap[loginStatus.value] || { message: "", icon: "", color: "" };
});

const { start: startPolling, clear: stopPolling } = usePollingTask(
    async (stopFn) => {
        if (!qrCodeKey.value) {
            stopFn();
            return;
        }

        try {
            const data = await apiCheckTicket({ key: qrCodeKey.value });

            if (data.is_scan) {
                loginStatus.value = WECHAT_LOGIN_STATUS.LOGIN_SUCCESS;
                stopPolling();

                handleLoginSuccess(data.user);
            }
        } catch (error) {
            console.error("检查登录状态失败:", error);
            stopPolling();
            loginStatus.value = WECHAT_LOGIN_STATUS.INVALID;
        }
    },
    {
        interval: 2000,
        maxWaitTime: 5 * 60 * 1000,
        onEnded: () => {
            if (loginStatus.value === WECHAT_LOGIN_STATUS.NORMAL) {
                loginStatus.value = WECHAT_LOGIN_STATUS.INVALID;
            }
        },
    },
);

async function fetchQrCode(): Promise<void> {
    try {
        isLoading.value = true;
        stopPolling();
        loginStatus.value = WECHAT_LOGIN_STATUS.NORMAL;
        const data = await apiGetWxCode();
        qrCodeUrl.value = data.url;
        qrCodeKey.value = data.key || "";
        startPolling();
    } catch (error) {
        console.error("获取微信二维码失败:", error);
        loginStatus.value = WECHAT_LOGIN_STATUS.CODE_ERROR;
    } finally {
        isLoading.value = false;
    }
}

function handleLoginSuccess(v: LoginResponse): void {
    emits("success", v);
}

onMounted(() => {
    emits("updateStyle", { width: "400px", height: "372px" });
    emits("update:showLoginMethods", true);
    fetchQrCode();
});

onUnmounted(stopPolling);
</script>

<template>
    <div class="flex flex-col items-center justify-between px-8 pt-8">
        <Motion
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{
                type: 'tween',
                stiffness: 200,
                damping: 30,
                delay: 0.3,
            }"
            class="pb-3 text-center"
        >
            <h2 class="mb-2 text-xl font-bold">微信扫码登录</h2>
            <p class="text-muted-foreground mb-4 text-sm">请使用微信扫描二维码登录</p>

            <!-- 二维码容器 -->
            <div
                class="relative flex h-50 w-50 items-center justify-center overflow-hidden rounded-lg border p-1 dark:border-gray-700"
            >
                <template v-if="isLoading">
                    <div class="h-40 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </template>

                <template v-else>
                    <img
                        :src="qrCodeUrl"
                        alt="微信登录二维码"
                        class="pointer-events-none h-full w-full select-none"
                        v-if="qrCodeUrl"
                    />

                    <!-- 协议覆盖层 -->
                    <div
                        v-if="
                            !userStore.isAgreed &&
                            !!appStore.loginWay.loginAgreement &&
                            appStore.loginSettings?.showPolicyAgreement
                        "
                        class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm dark:bg-gray-800/60"
                    >
                        <UIcon
                            name="i-lucide-alert-triangle"
                            class="mb-2 text-5xl text-yellow-500"
                        />
                        <p class="text-sm text-gray-700 dark:text-gray-300">请先阅读并勾选协议</p>
                    </div>

                    <!-- 状态覆盖层 -->
                    <div
                        v-if="statusConfig.message"
                        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm dark:bg-gray-800/60"
                    >
                        <UIcon
                            :name="statusConfig.icon"
                            :class="statusConfig.color"
                            class="mb-2 text-5xl"
                        />
                        <p class="mb-3 text-sm text-gray-700 dark:text-gray-300">
                            {{ statusConfig.message }}
                        </p>
                        <UButton v-if="statusConfig.showRefresh" size="xs" @click="fetchQrCode">
                            刷新二维码
                        </UButton>
                    </div>
                </template>
            </div>
        </Motion>

        <Motion
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{
                type: 'tween',
                stiffness: 200,
                damping: 30,
                delay: 0.5,
            }"
            class="relative"
        >
            <div class="mt-2 mb-8 text-left">
                <PrivacyTerms
                    v-if="appStore.loginSettings?.showPolicyAgreement"
                    v-model="userStore.isAgreed"
                />
            </div>
        </Motion>
    </div>
</template>
