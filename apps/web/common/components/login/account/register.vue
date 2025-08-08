<script setup lang="ts">
import { ProInputPassword, useLockFn, useMessage } from "@fastbuildai/ui";
import { Motion } from "motion-v";
import { reactive } from "vue";
import { useI18n } from "vue-i18n";
import { object, ref as yupRef, string } from "yup";

import type { LoginResponse } from "@/models/user";
import { apiAuthRegister } from "@/services/web/user";

const PrivacyTerms = defineAsyncComponent(() => import("../privacy-terms.vue"));

const emits = defineEmits<{
    (e: "switchComponent", component: string): void;
    (e: "success", v: LoginResponse): void;
}>();

const appStore = useAppStore();
const toast = useMessage();
const userStore = useUserStore();
const { t } = useI18n();

// 表单验证架构
const registerSchema = object({
    username: string()
        .required(t("login.validation.accountRequired"))
        .min(3, t("login.validation.accountMinLength"))
        .max(20, t("login.validation.accountMaxLength")),
    // email: string()
    //   .required(t("login.validation.emailRequired"))
    //   .email(t("login.validation.emailInvalid")),
    password: string()
        .required(t("login.validation.passwordRequired"))
        .min(6, t("login.validation.passwordMinLength"))
        .max(25, t("login.validation.passwordMaxLength"))
        .matches(
            /^(?=.*[a-z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
            t("login.validation.passwordFormat"),
        ),
    confirmPassword: string()
        .required(t("login.validation.confirmPasswordRequired"))
        .oneOf([yupRef("password")], t("login.validation.passwordMismatch")),
});

// 表单状态
const registerState = reactive({
    username: "",
    // email: '',
    password: "",
    confirmPassword: "",
});

const { lockFn: onRegisterSubmit, isLock } = useLockFn(async () => {
    if (!userStore.isAgreed && !!appStore.loginWay.loginAgreement) {
        toast.warning(t("login.messages.agreementRequired"), {
            title: t("login.messages.agreementTitle"),
            duration: 3000,
        });
        return;
    }
    try {
        // TODO: 调用注册接口
        const data = await apiAuthRegister({
            terminal: 1,
            ...registerState,
        });

        // 注册成功后跳转到登录页
        emits("success", { ...data, ...data.user });
    } catch (error: any) {
        console.log(t("login.messages.registerFailed"), error);
    }
});
</script>

<template>
    <div class="px-8 pt-8">
        <Motion
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{
                type: 'tween',
                stiffness: 300,
                damping: 30,
                delay: 0.2,
            }"
            class="relative text-center"
        >
            <h2 class="mb-2 text-2xl font-bold">{{ $t("login.registerTitle") }}</h2>
            <p class="text-muted-foreground mb-4 text-sm">
                {{ $t("login.registerWelcome") }}
            </p>
        </Motion>

        <Motion
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{
                type: 'tween',
                stiffness: 300,
                damping: 30,
                delay: 0.4,
            }"
            class="relative"
        >
            <UForm :schema="registerSchema" :state="registerState" @submit="onRegisterSubmit">
                <UFormField :label="$t('login.account')" name="username" required>
                    <UInput
                        v-model="registerState.username"
                        class="w-full"
                        size="lg"
                        :placeholder="$t('login.placeholders.enterAccount')"
                    />
                </UFormField>

                <UFormField :label="$t('login.password')" name="password" class="mt-2" required>
                    <ProInputPassword
                        v-model="registerState.password"
                        class="w-full"
                        type="password"
                        size="lg"
                        :placeholder="$t('login.placeholders.enterPassword')"
                    />

                    <template #help>
                        <div class="flex items-center gap-1 text-xs">
                            <UIcon name="tabler:alert-circle" size="14" />
                            {{ $t("login.passwordRule") }}
                        </div>
                    </template>
                </UFormField>

                <UFormField
                    :label="$t('login.confirmPassword')"
                    name="confirmPassword"
                    class="mt-2"
                    required
                >
                    <ProInputPassword
                        v-model="registerState.confirmPassword"
                        class="w-full"
                        type="password"
                        size="lg"
                        :placeholder="$t('login.placeholders.enterPasswordAgain')"
                    />
                    <template #help>
                        <div class="flex items-center gap-1 text-xs">
                            <UIcon name="tabler:alert-circle" size="14" />
                            {{ $t("login.passwordRule") }}
                        </div>
                    </template>
                </UFormField>

                <div class="mt-8 mb-4 text-left">
                    <PrivacyTerms v-model="userStore.isAgreed" />
                </div>

                <div class="flex flex-1 gap-2 pb-8">
                    <UButton
                        variant="outline"
                        color="primary"
                        size="lg"
                        :ui="{ base: 'flex-1 justify-center' }"
                        @click="emits('switchComponent', 'account-login')"
                    >
                        {{ $t("login.backToLogin") }}
                    </UButton>
                    <UButton
                        color="primary"
                        type="submit"
                        size="lg"
                        :loading="isLock"
                        :ui="{ base: 'flex-1 justify-center' }"
                        :disabled="!userStore.isAgreed && !!appStore.loginWay.loginAgreement"
                    >
                        {{ $t("login.registerNow") }}
                    </UButton>
                </div>
            </UForm>
        </Motion>
    </div>
</template>
