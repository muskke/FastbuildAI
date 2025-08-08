<script setup lang="ts">
import { useLockFn, useMessage } from "@fastbuildai/ui";
import ProInputPassword from "@fastbuildai/ui/components/pro-input-password.vue";
import { Motion } from "motion-v";
import { reactive, ref } from "vue";
import { object, ref as yupRef, string } from "yup";

import { SMS_TYPE } from "@/common/constants/auth.constant";
import { apiPostResetPassword, apiSmsSend } from "@/services/web/user";

const emits = defineEmits<{
    (e: "switchComponent", component: string): void;
}>();

const toast = useMessage();
const userStore = useUserStore();
const areaCodes = ref<any>([{ value: "中国大陆", label: "86" }] satisfies any[]);
const selected = ref<string>(areaCodes.value[0]);

// 重置密码表单验证架构
const forgetchema = object({
    mobile: string()
        .required("请输入手机号")
        .matches(/^1[3-9]\d{9}$/, "请输入正确的手机号码"),
    code: string().required("请输入验证码"),
    password: string()
        .required("请输入新密码")
        .min(6, "密码长度不能少于6个字符")
        .max(25, "密码长度不能超过25个字符")
        .matches(
            /^(?=.*[a-z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
            "密码必须为数字，字母或符号组合",
        ),
    password_confirm: string()
        .required("请确认密码")
        .oneOf([yupRef("password")], "两次输入的密码不一致"),
});

// 重置密码表单状态
const forgetState = reactive({
    mobile: "",
    code: "",
    password: "",
    password_confirm: "",
});

const codeBtnState = reactive<{
    isCounting: boolean;
    text: string;
}>({
    isCounting: false,
    text: "获取验证码",
});

const { lockFn: onSmsSend, isLock: smsLoading } = useLockFn(async () => {
    if (codeBtnState.isCounting === true) return;
    codeBtnState.text = "正在发送中";

    try {
        await apiSmsSend({
            scene: SMS_TYPE.FIND_PASSWORD,
            mobile: forgetState.mobile,
        });
        codeBtnState.isCounting = true;
        let count = 60;
        codeBtnState.text = `${count}s`;
        const interval = setInterval(() => {
            count--;
            codeBtnState.text = `${count}s`;
            if (count === 0) {
                clearInterval(interval);
                codeBtnState.isCounting = false;
                codeBtnState.text = "重新发送";
            }
        }, 1000);
        toast.error("验证码发送成功，请注意查收", {
            title: "发送成功",
            duration: 3000,
        });
    } catch (error) {
        console.error("发送验证码失败:", error);
        codeBtnState.isCounting = false;
        codeBtnState.text = "重新发送";
        toast.error("验证码发送失败，请稍后重试", {
            title: "发送失败",
            duration: 3000,
        });
    }
});

// 处理重置密码表单提交
const { lockFn: onForgetSubmit, isLock } = useLockFn(async () => {
    try {
        await apiPostResetPassword(forgetState);
    } catch (error) {
        console.log("重置密码失败=>", error);
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
            class="relative"
        >
            <h2 class="mb-2 text-2xl font-bold">忘记密码</h2>

            <p class="text-muted-foreground mb-4 text-sm">设置新密码以继续使用您的账户</p>
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
            <UForm :schema="forgetchema" :state="forgetState" @submit="onForgetSubmit">
                <UFormField label="手机号" name="mobile" required>
                    <UInput
                        v-model="forgetState.mobile"
                        class="w-full"
                        size="lg"
                        placeholder="请输入手机号码"
                        autocomplete="off"
                        :ui="{ base: '!pl-24' }"
                    >
                        <template #leading>
                            <div class="flex items-center text-sm" @click.stop.prevent>
                                <span class="mr-[1px] pb-[1px]">+</span>
                                <UInputMenu
                                    v-model="selected"
                                    trailing-icon="heroicons:chevron-up-down-20-solid"
                                    :ui="{
                                        base: '!ring-0',
                                        content: 'z-999 w-34',
                                    }"
                                    class="w-16"
                                    :items="areaCodes"
                                >
                                    <template #item="{ item }">
                                        {{ item.value }} +{{ item.label }}
                                    </template>
                                </UInputMenu>
                            </div>
                            <USeparator class="h-1/2" orientation="vertical" />
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="验证码" name="code" class="mt-2" required>
                    <UInput
                        id="code"
                        v-model="forgetState.code"
                        size="lg"
                        placeholder="请输入验证码"
                        autocomplete="off"
                        :ui="{ root: 'w-full', trailing: 'pr-0' }"
                    >
                        <template #trailing>
                            <USeparator class="h-1/2" orientation="vertical" />
                            <UButton
                                variant="link"
                                :ui="{
                                    base: 'w-[90px] justify-center',
                                }"
                                :disabled="smsLoading"
                                @click="onSmsSend"
                            >
                                {{ codeBtnState.text }}
                            </UButton>
                        </template>
                    </UInput>
                </UFormField>

                <UFormField label="新密码" name="password" class="mt-3" required>
                    <ProInputPassword
                        v-model="forgetState.password"
                        class="w-full"
                        type="password"
                        size="lg"
                        placeholder="请输入新密码"
                    />
                    <template #help>
                        <div class="flex items-center gap-1 text-xs">
                            <UIcon name="tabler:alert-circle" size="14" />
                            密码必须为6-25位数字+字母或符号组合
                        </div>
                    </template>
                </UFormField>

                <UFormField label="确认密码" name="password_confirm" class="mt-3" required>
                    <ProInputPassword
                        v-model="forgetState.password_confirm"
                        class="w-full"
                        type="password"
                        size="lg"
                        placeholder="请再次输入新密码"
                    />
                    <template #help>
                        <div class="flex items-center gap-1 text-xs">
                            <UIcon name="tabler:alert-circle" size="14" />
                            密码必须为6-25位数字+字母或符号组合
                        </div>
                    </template>
                </UFormField>

                <div class="flex flex-1 gap-2 py-8">
                    <UButton
                        variant="outline"
                        color="primary"
                        size="lg"
                        :ui="{ base: 'flex-1 justify-center' }"
                        @click="emits('switchComponent', 'account-login')"
                    >
                        返回登录
                    </UButton>
                    <UButton
                        color="primary"
                        type="submit"
                        size="lg"
                        :ui="{ base: 'flex-1 justify-center' }"
                        :loading="isLock"
                    >
                        确认修改
                    </UButton>
                </div>
            </UForm>
        </Motion>
    </div>
</template>
