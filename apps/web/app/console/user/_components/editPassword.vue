<script setup lang="ts">
import { ProModal } from "@fastbuildai/ui";
import { useLockFn } from "@fastbuildai/ui/composables/useLockFn";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { useI18n } from "vue-i18n";

import { apiGenerateRandomPassword, apiResetUserPassword } from "@/services/console/user";

/**
 * 密码表单数据结构
 */
type PasswordForm = {
    newPassword: string;
    confirmPassword: string;
};

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    userid: string | null;
}>();

const emits = defineEmits<{
    (e: "close"): void;
}>();

// 当前激活的tab
const activeTab = ref<"change" | "reset">("change");

// Tab选项
const tabItems = computed(() => [
    {
        value: "change",
        label: t("console-user.password.changeTab"),
        icon: "i-lucide-edit",
        slot: "change",
    },
    {
        value: "reset",
        label: t("console-user.password.resetTab"),
        icon: "i-lucide-refresh-cw",
        slot: "reset",
    },
]);

// 表单数据
const formData = ref<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
});

// 加载状态
const isResettingPassword = ref(false);

// 密码可见性状态
const showPassword = ref({
    new: false,
    confirm: false,
});

// 新密码显示状态
const showNewPasswordModal = ref(false);
const generatedPassword = ref("");

/**
 * 表单验证错误
 */
const errors = computed(() => {
    const result: Record<string, string> = {};

    if (activeTab.value === "change") {
        // 验证新密码
        if (!formData.value.newPassword.trim()) {
            result.newPassword = t("console-user.password.validation.newPasswordRequired");
        } else if (formData.value.newPassword.length < 6) {
            result.newPassword = t("console-user.password.validation.passwordMinLength");
        }

        // 验证确认密码
        if (!formData.value.confirmPassword.trim()) {
            result.confirmPassword = t("console-user.password.validation.confirmPasswordRequired");
        } else if (formData.value.confirmPassword !== formData.value.newPassword) {
            result.confirmPassword = t("console-user.password.validation.passwordMismatch");
        }
    }

    return result;
});

const hasErrors = computed(() => Object.keys(errors.value).length > 0);

const isFormEmpty = computed(() => {
    if (activeTab.value === "reset") return false;
    return !formData.value.newPassword.trim() && !formData.value.confirmPassword.trim();
});

/**
 * 重置表单
 */
function resetForm() {
    formData.value = {
        newPassword: "",
        confirmPassword: "",
    };
    showPassword.value = {
        new: false,
        confirm: false,
    };
}

/**
 * 切换密码显示状态
 */
function togglePasswordVisibility(field: keyof typeof showPassword.value) {
    showPassword.value[field] = !showPassword.value[field];
}

/**
 * 修改密码
 */
const { lockFn: changePasswordLockFn, isLock: isChangingPassword } = useLockFn(async () => {
    if (hasErrors.value) {
        const firstError = Object.values(errors.value)[0] as string;
        toast.warning(firstError);
        return;
    }

    try {
        // 调用修改密码API
        await apiResetUserPassword(props.userid!, formData.value.newPassword);

        toast.success(t("console-user.password.messages.changeSuccess"));
        handleClose();
    } catch (error: any) {
        console.error("修改密码失败:", error);
        toast.error(error.message || t("console-user.password.messages.changeFailed"));
    }
});

/**
 * 重置密码处理
 */
const handleResetPassword = async () => {
    if (!props.userid) {
        toast.error(t("console-user.password.validation.userIdRequired"));
        return;
    }

    try {
        isResettingPassword.value = true;

        // 生成新密码
        const { password } = await apiGenerateRandomPassword(props.userid!);

        // 设置生成的密码并显示弹框
        generatedPassword.value = password;
        showNewPasswordModal.value = true;
    } catch (error: any) {
        console.error("重置密码失败:", error);
        toast.error(error.message || t("console-user.password.messages.resetFailed"));
    } finally {
        isResettingPassword.value = false;
    }
};

/**
 * 重置密码锁定函数
 */
const { lockFn: resetPasswordLockFn } = useLockFn(handleResetPassword);

/**
 * 处理提交
 */
function handleSubmit() {
    if (activeTab.value === "change") {
        changePasswordLockFn();
    } else {
        resetPasswordLockFn();
    }
}

/**
 * 关闭弹窗
 */
const handleClose = () => {
    resetForm();
    emits("close");
};

/**
 * 切换tab时重置表单
 */
watch(activeTab, () => {
    resetForm();
});

/**
 * 复制密码到剪贴板
 */
const copyPassword = async () => {
    try {
        await navigator.clipboard.writeText(generatedPassword.value);
        toast.success(t("console-user.password.messages.copySuccess"));
    } catch (error) {
        toast.error(t("console-user.password.messages.copyFailed"));
    }
};

/**
 * 关闭新密码弹框
 */
const closeNewPasswordModal = () => {
    copyPassword();
    showNewPasswordModal.value = false;
    generatedPassword.value = "";
    handleClose();
};

/**
 * 提交按钮禁用逻辑
 */
const isSubmitDisabled = computed(() => {
    const isBusy = isChangingPassword.value || isResettingPassword.value;
    if (activeTab.value === "change") {
        return isFormEmpty.value || hasErrors.value || isBusy;
    }
    return isBusy;
});

defineShortcuts({
    escape: () => (showNewPasswordModal.value ? closeNewPasswordModal() : handleClose()),
});

/**
 * 获取当前操作状态
 */
const isBusy = computed(() => isChangingPassword.value || isResettingPassword.value);
</script>

<template>
    <div>
        <ProModal
            :model-value="true"
            :title="t('console-user.password.title')"
            :ui="{
                content: 'max-w-md overflow-y-auto h-fit',
            }"
            :show-footer="true"
            @update:model-value="(value) => !value && handleClose()"
        >
            <div class="space-y-4">
                <!-- Tab 切换 -->
                <UTabs v-model="activeTab" :items="tabItems" class="w-full">
                    <template #change>
                        <div class="space-y-4 pt-4">
                            <!-- 新密码 -->
                            <UFormField
                                :label="t('console-user.password.newPassword')"
                                size="lg"
                                required
                                :error="errors.newPassword"
                            >
                                <UInput
                                    v-model="formData.newPassword"
                                    :type="showPassword.new ? 'text' : 'password'"
                                    :placeholder="t('console-user.password.newPasswordPlaceholder')"
                                    :ui="{ root: 'w-full' }"
                                    @keydown.enter.prevent="handleSubmit"
                                >
                                    <template #trailing>
                                        <UButton
                                            variant="ghost"
                                            size="xs"
                                            :icon="
                                                showPassword.new
                                                    ? 'i-lucide-eye-off'
                                                    : 'i-lucide-eye'
                                            "
                                            @click="togglePasswordVisibility('new')"
                                        />
                                    </template>
                                </UInput>
                            </UFormField>

                            <!-- 确认密码 -->
                            <UFormField
                                :label="t('console-user.password.confirmPassword')"
                                size="lg"
                                required
                                :error="errors.confirmPassword"
                            >
                                <UInput
                                    v-model="formData.confirmPassword"
                                    :type="showPassword.confirm ? 'text' : 'password'"
                                    :placeholder="
                                        t('console-user.password.confirmPasswordPlaceholder')
                                    "
                                    :ui="{ root: 'w-full' }"
                                    @keydown.enter.prevent="handleSubmit"
                                >
                                    <template #trailing>
                                        <UButton
                                            variant="ghost"
                                            size="xs"
                                            :icon="
                                                showPassword.confirm
                                                    ? 'i-lucide-eye-off'
                                                    : 'i-lucide-eye'
                                            "
                                            @click="togglePasswordVisibility('confirm')"
                                        />
                                    </template>
                                </UInput>
                            </UFormField>

                            <div class="text-muted-foreground text-xs">
                                {{ t("console-user.password.passwordHelp") }}
                            </div>
                        </div>
                    </template>

                    <template #reset>
                        <div class="space-y-4 pt-4">
                            <div
                                class="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950"
                            >
                                <div class="flex items-start gap-3">
                                    <UIcon
                                        name="i-lucide-alert-triangle"
                                        class="mt-0.5 size-5 text-orange-600 dark:text-orange-400"
                                    />
                                    <div class="space-y-2">
                                        <h4
                                            class="font-medium text-orange-800 dark:text-orange-200"
                                        >
                                            {{ t("console-user.password.resetConfirmTitle") }}
                                        </h4>
                                        <p class="text-sm text-orange-700 dark:text-orange-300">
                                            {{ t("console-user.password.resetConfirmDesc") }}
                                        </p>
                                        <ul
                                            class="ml-4 list-disc space-y-1 text-sm text-orange-600 dark:text-orange-400"
                                        >
                                            <li>{{ t("console-user.password.resetWarning1") }}</li>
                                            <li>{{ t("console-user.password.resetWarning2") }}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </UTabs>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="soft" color="neutral" @click="handleClose">
                        {{ t("console-user.password.cancel") }}
                    </UButton>
                    <UButton
                        :disabled="isSubmitDisabled"
                        :color="activeTab === 'reset' ? 'warning' : 'primary'"
                        :loading="isBusy"
                        @click="handleSubmit"
                    >
                        {{
                            activeTab === "change"
                                ? t("console-user.password.changePassword")
                                : t("console-user.password.confirmReset")
                        }}
                    </UButton>
                </div>
            </template>
        </ProModal>

        <!-- 新密码显示弹框 -->
        <ProModal
            v-model="showNewPasswordModal"
            :title="t('console-user.password.resetSuccessTitle')"
            :ui="{
                content: 'max-w-md overflow-y-auto h-fit',
            }"
            :show-footer="true"
            @update:model-value="(value) => !value && closeNewPasswordModal()"
        >
            <div class="space-y-4">
                <div class="bg-primary/20 border-primary/50 rounded-lg border p-4">
                    <div class="flex items-start gap-3">
                        <UIcon name="i-lucide-check-circle" class="text-primary mt-0.5 size-5" />
                        <div class="space-y-3">
                            <h4 class="text-primary font-medium">
                                {{ t("console-user.password.newPasswordGenerated") }}
                            </h4>
                            <p class="text-primary text-sm">
                                {{ t("console-user.password.newPasswordDesc") }}
                            </p>

                            <!-- 密码显示区域 -->
                            <div class="border-primary/50 bg-muted rounded-md border p-3">
                                <div class="flex items-center justify-between gap-2">
                                    <code class="font-mono text-sm break-all">
                                        {{ generatedPassword }}
                                    </code>
                                    <UButton
                                        variant="ghost"
                                        size="xs"
                                        icon="i-lucide-copy"
                                        @click="copyPassword"
                                        class="shrink-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end">
                    <UButton @click="closeNewPasswordModal">
                        {{ t("console-user.password.copyAndClose") }}
                    </UButton>
                </div>
            </template>
        </ProModal>
    </div>
</template>
