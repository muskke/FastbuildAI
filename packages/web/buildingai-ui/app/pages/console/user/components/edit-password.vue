<script setup lang="ts">
import {
    apiGenerateRandomPassword,
    apiResetUserPassword,
} from "@buildingai/service/consoleapi/user";

type PasswordForm = {
    newPassword: string;
    confirmPassword: string;
};

const props = defineProps<{
    userid: string | null;
}>();

const emits = defineEmits<{
    (e: "close"): void;
}>();

const { t } = useI18n();
const toast = useMessage();

const activeTab = shallowRef<"change" | "reset">("change");

const formData = shallowRef<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
});

const isResettingPassword = shallowRef(false);
const isOpen = shallowRef(false);
const showPassword = shallowRef({
    new: false,
    confirm: false,
});

const showNewPasswordModal = shallowRef(false);
const generatedPassword = shallowRef("");

const tabItems = computed(() => [
    {
        value: "change",
        label: t("user.backend.password.changeTab"),
        icon: "i-lucide-edit",
        slot: "change",
    },
    {
        value: "reset",
        label: t("user.backend.password.resetTab"),
        icon: "i-lucide-refresh-cw",
        slot: "reset",
    },
]);

const errors = computed(() => {
    const result: Record<string, string> = {};

    if (activeTab.value === "change") {
        // 验证新密码
        if (!formData.value.newPassword.trim()) {
            result.newPassword = t("user.backend.password.validation.newPasswordRequired");
        } else if (formData.value.newPassword.length < 6) {
            result.newPassword = t("user.backend.password.validation.passwordMinLength");
        }

        // 验证确认密码
        if (!formData.value.confirmPassword.trim()) {
            result.confirmPassword = t("user.backend.password.validation.confirmPasswordRequired");
        } else if (formData.value.confirmPassword !== formData.value.newPassword) {
            result.confirmPassword = t("user.backend.password.validation.passwordMismatch");
        }
    }

    return result;
});

const hasErrors = computed(() => Object.keys(errors.value).length > 0);

const isFormEmpty = computed(() => {
    if (activeTab.value === "reset") return false;
    return !formData.value.newPassword.trim() && !formData.value.confirmPassword.trim();
});

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

function togglePasswordVisibility(field: keyof typeof showPassword.value) {
    showPassword.value[field] = !showPassword.value[field];
}

const { lockFn: changePasswordLockFn, isLock: isChangingPassword } = useLockFn(async () => {
    if (hasErrors.value) {
        const firstError = Object.values(errors.value)[0] as string;
        toast.warning(firstError);
        return;
    }

    try {
        // 调用修改密码API
        await apiResetUserPassword(props.userid || "", formData.value.newPassword);

        toast.success(t("user.backend.password.messages.changeSuccess"));
        handleClose();
    } catch (error) {
        console.error("修改密码失败:", error);
        toast.error(
            error instanceof Error
                ? error.message
                : t("user.backend.password.messages.changeFailed"),
        );
    }
});

const handleResetPassword = async () => {
    if (!props.userid) {
        toast.error(t("user.backend.password.validation.userIdRequired"));
        return;
    }

    try {
        isResettingPassword.value = true;

        // 生成新密码
        const { password } = await apiGenerateRandomPassword(props.userid || "");

        // 设置生成的密码并显示弹框
        generatedPassword.value = password;
        showNewPasswordModal.value = true;
    } catch (error) {
        console.error("重置密码失败:", error);
        toast.error(
            error instanceof Error
                ? error.message
                : t("user.backend.password.messages.resetFailed"),
        );
    } finally {
        isResettingPassword.value = false;
    }
};

const { lockFn: resetPasswordLockFn } = useLockFn(handleResetPassword);

function handleSubmit() {
    if (activeTab.value === "change") {
        changePasswordLockFn();
    } else {
        resetPasswordLockFn();
    }
}

const handleClose = () => {
    resetForm();
    emits("close");
    isOpen.value = false;
};

watch(activeTab, () => {
    resetForm();
});

const copyPassword = async () => {
    try {
        await navigator.clipboard.writeText(generatedPassword.value);
        toast.success(t("user.backend.password.messages.copySuccess"));
    } catch (_error) {
        toast.error(t("user.backend.password.messages.copyFailed"));
    }
};

const closeNewPasswordModal = () => {
    copyPassword();
    showNewPasswordModal.value = false;
    generatedPassword.value = "";
    handleClose();
};

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

const isBusy = computed(() => isChangingPassword.value || isResettingPassword.value);
</script>

<template>
    <div>
        <BdModal
            v-model:open="isOpen"
            :title="t('user.backend.password.title')"
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
                                :label="t('user.backend.password.newPassword')"
                                size="lg"
                                required
                                :error="errors.newPassword"
                            >
                                <UInput
                                    v-model="formData.newPassword"
                                    :type="showPassword.new ? 'text' : 'password'"
                                    :placeholder="t('user.backend.password.newPasswordPlaceholder')"
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
                                :label="t('user.backend.password.confirmPassword')"
                                size="lg"
                                required
                                :error="errors.confirmPassword"
                            >
                                <UInput
                                    v-model="formData.confirmPassword"
                                    :type="showPassword.confirm ? 'text' : 'password'"
                                    :placeholder="
                                        t('user.backend.password.confirmPasswordPlaceholder')
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
                                {{ t("user.backend.password.passwordHelp") }}
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
                                            {{ t("user.backend.password.resetConfirmTitle") }}
                                        </h4>
                                        <p class="text-sm text-orange-700 dark:text-orange-300">
                                            {{ t("user.backend.password.resetConfirmDesc") }}
                                        </p>
                                        <ul
                                            class="ml-4 list-disc space-y-1 text-sm text-orange-600 dark:text-orange-400"
                                        >
                                            <li>{{ t("user.backend.password.resetWarning1") }}</li>
                                            <li>{{ t("user.backend.password.resetWarning2") }}</li>
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
                        {{ t("user.backend.password.cancel") }}
                    </UButton>
                    <UButton
                        :disabled="isSubmitDisabled"
                        :color="activeTab === 'reset' ? 'warning' : 'primary'"
                        :loading="isBusy"
                        @click="handleSubmit"
                    >
                        {{
                            activeTab === "change"
                                ? t("user.backend.password.changePassword")
                                : t("user.backend.password.confirmReset")
                        }}
                    </UButton>
                </div>
            </template>
        </BdModal>

        <!-- 新密码显示弹框 -->
        <BdModal
            v-model:open="showNewPasswordModal"
            :title="t('user.backend.password.resetSuccessTitle')"
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
                                {{ t("user.backend.password.newPasswordGenerated") }}
                            </h4>
                            <p class="text-primary text-sm">
                                {{ t("user.backend.password.newPasswordDesc") }}
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
                        {{ t("user.backend.password.copyAndClose") }}
                    </UButton>
                </div>
            </template>
        </BdModal>
    </div>
</template>
