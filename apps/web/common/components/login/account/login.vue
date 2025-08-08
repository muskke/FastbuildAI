<script setup lang="ts">
import { ProInputPassword, useLockFn, useMessage } from "@fastbuildai/ui";
import { Motion } from "motion-v";
import { reactive } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { LoginResponse } from "@/models/user";
import { apiAuthLogin } from "@/services/web/user";

const PrivacyTerms = defineAsyncComponent(() => import("../privacy-terms.vue"));

const emits = defineEmits<{
    (e: "switchComponent", component: string): void;
    (e: "success", v: LoginResponse): void;
}>();

const appStore = useAppStore();
const userStore = useUserStore();
const toast = useMessage();
const { t } = useI18n();

// 表单验证架构
const loginSchema = object({
    username: string()
        .required(t("login.validation.accountRequired"))
        .min(3, t("login.validation.accountMinLength")),
    password: string()
        .required(t("login.validation.passwordRequired"))
        .min(6, t("login.validation.passwordMinLength"))
        .max(25, t("login.validation.passwordMaxLength")),
    // .matches(
    //     /^(?=.*[a-z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
    //     t("login.validation.passwordFormat"),
    // ),
});

// 表单状态
const loginState = reactive({
    username: "",
    password: "",
    terminal: 1,
});

const { lockFn: onLoginSubmit, isLock } = useLockFn(async () => {
    if (!userStore.isAgreed && !!appStore.loginWay.loginAgreement) {
        toast.warning(t("login.messages.agreementRequired"), {
            title: t("login.messages.agreementTitle"),
            duration: 3000,
        });
        return;
    }
    try {
        // TODO: 调用登录接口
        const data = await apiAuthLogin(loginState);
        emits("success", data);
    } catch (error: any) {
        console.log(t("login.messages.loginFailed"), error);
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
            <h2 class="mb-2 text-2xl font-bold">{{ $t("login.welcomeBack") }}</h2>
            <p class="text-muted-foreground mb-4 text-sm">{{ $t("login.waitingForYou") }}</p>
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
            <UForm :schema="loginSchema" :state="loginState" @submit="onLoginSubmit">
                <UFormField :label="$t('login.account')" name="username" required>
                    <UInput
                        v-model="loginState.username"
                        class="w-full"
                        size="lg"
                        :placeholder="$t('login.usernamePlaceholder')"
                    />
                </UFormField>

                <UFormField :label="$t('login.password')" name="password" class="mt-2" required>
                    <div class="flex">
                        <ProInputPassword
                            v-model="loginState.password"
                            class="w-full"
                            type="password"
                            size="lg"
                            :placeholder="$t('login.passwordPlaceholder')"
                        />
                        <!-- <UButton
                            class="flex-none"
                            variant="link"
                            size="lg"
                            color="primary"
                            @click="emits('switchComponent', 'account-forget')"
                        >
                            {{ $t("login.forgotPassword") }}
                        </UButton> -->
                    </div>
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
                        @click="emits('switchComponent', 'account-register')"
                    >
                        {{ $t("login.register") }}
                    </UButton>
                    <UButton
                        color="primary"
                        type="submit"
                        size="lg"
                        :ui="{ base: 'flex-1 justify-center' }"
                        :loading="isLock"
                        :disabled="!userStore.isAgreed && !!appStore.loginWay.loginAgreement"
                    >
                        {{ $t("login.loginNow") }}
                    </UButton>
                </div>
            </UForm>
        </Motion>
    </div>
</template>
