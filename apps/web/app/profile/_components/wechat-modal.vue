<script setup lang="ts">
import { usePollingTask } from "@fastbuildai/ui/composables/usePollingTask";
import ProModal from "@fastbuildai/ui/components/pro-modal.vue";
import { useI18n } from "vue-i18n";
import { apiCheckTicket, apiGetWechatAuthorizedStatus, apiGetWechatBindStatus, apiGetWxCode } from "@/services/web/user";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";

import { WECHAT_LOGIN_STATUS, type WechatLoginStatus } from "@/common/constants";
import type { LoginResponse } from "@/models";

interface StatusConfigType {
    icon: string;
    color: string;
    message: string;
    showRefresh?: boolean;
}

const props = defineProps<{
    loading?: boolean;
}>();

const emits = defineEmits<{
    (e: "success", v: LoginResponse): void;
    (e: "close", v: boolean): void;
}>();

// 国际化
const { t } = useI18n();
const toast = useMessage();
const userStore = useUserStore();

const isOpen = ref(false);
const isLoading = ref<boolean>(false);
const qrCodeKey = ref<string>("");
const qrCodeUrl = ref<string>("");
const loginStatus = ref<WechatLoginStatus>(WECHAT_LOGIN_STATUS.NORMAL);

// 状态相关计算属性
const statusConfig = computed<StatusConfigType>(() => {
    const configMap: Record<number, StatusConfigType> = {
        [WECHAT_LOGIN_STATUS.SCANNED_CODE]: {
            icon: "i-lucide-check",
            color: "text-green-500",
            message: "已扫码，请在微信上确认授权",
        },
        [WECHAT_LOGIN_STATUS.LOGIN_SUCCESS]: {
            icon: "i-lucide-check-circle",
            color: "text-green-500",
            message: "绑定成功，正在跳转...",
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
            message: "绑定失败，请重试",
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
            const data = await apiGetWechatBindStatus({ key: qrCodeKey.value, id: userStore.userInfo?.id });
            
            // 未注册用户：需要先授权
            if ((data as any)?.need_authorization === true) {
                loginStatus.value = WECHAT_LOGIN_STATUS.SCANNED_CODE;
                // 切换到授权状态轮询
                stopPolling();
                if (!isAuthPolling.value) {
                    isAuthPolling.value = true;
                    startAuthPolling();
                }
                return;
            }

            // 已绑定过的微信，提示用户
            if (data?.is_scan && (data as any)?.error) {
                loginStatus.value = WECHAT_LOGIN_STATUS.LOGIN_FAIL;
                stopPolling();
                stopAuthPolling();
                toast.error((data as any)?.error || "绑定失败，请重试");
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

// 二次轮询：等待手机端网页授权完成
const isAuthPolling = ref(false);
const { start: startAuthPolling, clear: stopAuthPolling } = usePollingTask(
    async (stopFn) => {
        if (!qrCodeKey.value) {
            stopFn();
            isAuthPolling.value = false;
            return;
        }
        try {
            const status = await apiGetWechatAuthorizedStatus({ key: qrCodeKey.value });
            if ((status as any)?.expired) {
                stopFn();
                isAuthPolling.value = false;
                loginStatus.value = WECHAT_LOGIN_STATUS.INVALID;
                return;
            }

            if (status?.is_authorized === true) {
                // 授权完成后，触发一次票据检查以完成注册/登录
                const data = await apiCheckTicket({ key: qrCodeKey.value });
                if ((data as any)?.user?.token) {
                    loginStatus.value = WECHAT_LOGIN_STATUS.LOGIN_SUCCESS;
                    stopFn();
                    isAuthPolling.value = false;
                    handleLoginSuccess((data as any).user);
                    handleClose(false)
                }
            }
        } catch (err) {
            console.error("检查授权状态失败:", err);
            stopFn();
            isAuthPolling.value = false;
            loginStatus.value = WECHAT_LOGIN_STATUS.LOGIN_FAIL;
            toast.error(t("common.profile.wechatBindFailed"));
        }
    },
    {
        interval: 1500,
        maxWaitTime: 5 * 60 * 1000,
        onEnded: () => {
            isAuthPolling.value = false;
        },
    },
);

function handleLoginSuccess(v: LoginResponse): void {
    emits("success", v);
}

async function fetchQrCode(): Promise<void> {
    try {
        isLoading.value = true;
        stopPolling();
        stopAuthPolling();
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

function handleClose(reconnecting: boolean): void {
    emits("close", reconnecting);
}

onMounted(() => {
    fetchQrCode();
});

onUnmounted(() => {
    stopPolling();
    stopAuthPolling();
});

</script>

<template>
    <ProModal
        :model-value="true"
        :title="t('common.profile.wechatBindTitle')"
        :ui="{ content: 'max-w-md' }"
        :show-footer="true"
        @update:model-value="(value: boolean) => !value && handleClose(value)"
    >
        <div class="space-y-4 py-2 flex justify-center">
            <div
                class="relative flex h-50 w-50 items-center justify-center overflow-hidden rounded-lg border p-1 dark:border-gray-700"
            >
                <img
                    :src="qrCodeUrl"
                    :alt="t('common.profile.wechatBindQrCode')"
                    class="pointer-events-none h-full w-full select-none"
                    v-if="qrCodeUrl"
                />
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
                        {{ t('common.profile.refreshQrCode') }}
                    </UButton>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton variant="soft" @click="handleClose(false)">{{
                    t("console-common.cancel")
                }}</UButton>
            </div>
        </template>
    </ProModal>
</template>
