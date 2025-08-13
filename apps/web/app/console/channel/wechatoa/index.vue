<script setup lang="ts">
import { useMessage } from "@fastbuildai/ui";
import { useLockFn } from "@fastbuildai/ui/composables/useLockFn";
import { useI18n } from "vue-i18n";
import { number, object, string } from "yup";

import type { UpdateWxOaConfigDto, WxOaConfig } from "@/models/oaconfig.d.ts";
import { apiGetWxOaConfig, apiUpdateWxOaConfig } from "@/services/console/oaconfig";
const toast = useMessage();
const { t } = useI18n();

const activeTab = ref("0");
const formRef = ref();
const tabs = computed<{ name: string; label: string }[]>(() => [
    { name: "info", label: t("console-wechatoa.tabs.info") },
    { name: "setting", label: t("console-wechatoa.tabs.setting") },
    { name: "function", label: t("console-wechatoa.tabs.function") },
]);
/**
 * 复制url剪贴板
 */
async function copyUrl() {
    if (!state.value.url) return;

    try {
        await navigator.clipboard.writeText(state.value.url);
        toast.success(t("console-wechatoa.actions.copySuccess"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 复制域名到剪贴板
 */
async function copyDomain() {
    if (!state.value.domain) return;

    try {
        await navigator.clipboard.writeText(state.value.domain);
        toast.success(t("console-wechatoa.actions.copyDomainSuccess"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 复制JS接口安全域名到剪贴板
 */
async function copyJsApiDomain() {
    if (!state.value.jsApiDomain) return;

    try {
        await navigator.clipboard.writeText(state.value.jsApiDomain);
        toast.success(t("console-wechatoa.actions.copyJsApiDomainSuccess"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 复制网页授权域名到剪贴板
 */
async function copyWebAuthDomain() {
    if (!state.value.webAuthDomain) return;

    try {
        await navigator.clipboard.writeText(state.value.webAuthDomain);
        toast.success(t("console-wechatoa.actions.copyWebAuthDomainSuccess"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}
const messageEncryptType = {
    plain: "plain",
    compatible: "compatible",
    safe: "safe",
} as const;

const message = useMessage();
const messageEncryptTypeOptions = [
    { label: t("console-wechatoa.messageEncryptType.plain"), value: messageEncryptType.plain },
    {
        label: t("console-wechatoa.messageEncryptType.compatible"),
        value: messageEncryptType.compatible,
    },
    { label: t("console-wechatoa.messageEncryptType.safe"), value: messageEncryptType.safe },
];
const state = ref<WxOaConfig>({
    appId: "",
    appSecret: "",
    url: "",
    token: "",
    encodingAESKey: "",
    messageEncryptType: messageEncryptType.plain,
    domain: "",
    jsApiDomain: "",
    webAuthDomain: "",
});

const schema = object({
    appId: string().required(t("console-wechatoa.validation.appId.required")),
    appSecret: string().required(t("console-wechatoa.validation.appSecret.required")),

    messageEncryptType: string().required(
        t("console-wechatoa.validation.messageEncryptType.required"),
    ),
});

/** 获取公众号配置 */
const { lockFn: getWxOaConfig, isLock } = useLockFn(async () => {
    const {
        appId,
        appSecret,
        url,
        token,
        encodingAESKey,
        messageEncryptType,
        domain,
        jsApiDomain,
        webAuthDomain,
    } = await apiGetWxOaConfig();
    state.value = {
        appId,
        appSecret,
        url,
        token,
        encodingAESKey,
        messageEncryptType,
        domain,
        jsApiDomain,
        webAuthDomain,
    };
});
//初始化
onMounted(() => {
    getWxOaConfig();
});

/** 更新公众号配置 */
const { isLock: isLockSubmit, lockFn: handleSubmit } = useLockFn(async () => {
    try {
        const { appId, appSecret, token, encodingAESKey, messageEncryptType } = state.value;
        const updateData = {
            appId,
            appSecret,
            token,
            encodingAESKey,
            messageEncryptType,
        } satisfies UpdateWxOaConfigDto;

        await apiUpdateWxOaConfig(updateData);
        message.success(t("console-wechatoa.submit.success"));
        getWxOaConfig();
    } catch (error) {
        console.error("Update wechat OA config failed:", error);
        message.error(t("console-wechatoa.submit.error"));
    }
});
/** 重置表单 */
const resetForm = () => {
    // 直接重置指定字段
    Object.assign(state.value, {
        appId: "",
        appSecret: "",
        token: "",
        encodingAESKey: "",
        messageEncryptType: messageEncryptType.plain,
    });

    message.info(t("console-wechatoa.form.formReset"));
};
</script>

<template>
    <div class="wechatoa">
        <div class="mb-4 inline-block w-auto">
            <UTabs
                v-model="activeTab"
                size="md"
                :content="false"
                :items="tabs.map((tab) => ({ label: tab.label }))"
            />
        </div>
        <div class="mx-auto mb-4 w-auto lg:max-w-2xl xl:max-w-4xl">
            <UForm
                :schema="schema"
                :state="state"
                class="space-y-6"
                @submit="handleSubmit"
                ref="formRef"
            >
                <div v-show="activeTab === '0'">
                    <div class="information-container mx-auto mt-8">
                        <div class="mb-4 flex flex-col justify-center">
                            <h2 class="text-xl font-semibold">{{ t("console-wechatoa.title") }}</h2>
                            <p class="text-muted-foreground mt-1 text-sm">
                                {{ t("console-wechatoa.description") }}
                            </p>
                        </div>
                    </div>

                    <!-- AppId -->
                    <UFormField
                        :label="t('console-wechatoa.form.appId.label')"
                        class="mb-6"
                        name="appId"
                        required
                    >
                        <UInput
                            v-model="state.appId"
                            :placeholder="t('console-wechatoa.form.appId.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                        >
                        </UInput>
                    </UFormField>
                    <!-- AppSecret -->
                    <UFormField
                        :label="t('console-wechatoa.form.appSecret.label')"
                        name="appSecret"
                        required
                    >
                        <UInput
                            v-model="state.appSecret"
                            :placeholder="t('console-wechatoa.form.appSecret.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                        >
                        </UInput>
                    </UFormField>
                </div>
                <div v-show="activeTab === '1'">
                    <!-- 服务器配置 -->
                    <div class="information-container mx-auto mt-8">
                        <div class="mb-4 flex flex-col justify-center">
                            <h2 class="text-xl font-semibold">
                                {{ t("console-wechatoa.sections.serverConfig") }}
                            </h2>
                        </div>
                    </div>

                    <!-- url -->
                    <UFormField
                        :label="t('console-wechatoa.form.url.label')"
                        name="url"
                        class="mb-6"
                        :description="t('console-wechatoa.form.url.description')"
                    >
                        <UInput
                            v-model="state.url"
                            :placeholder="t('console-wechatoa.form.url.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                            disabled
                            variant="subtle"
                        >
                        </UInput>
                        <UButton class="ml-2" variant="soft" @click="copyUrl">{{
                            t("console-wechatoa.actions.copy")
                        }}</UButton>
                    </UFormField>
                    <!-- token -->
                    <UFormField
                        :label="t('console-wechatoa.form.token.label')"
                        name="token"
                        class="mb-6"
                        :description="t('console-wechatoa.form.token.description')"
                    >
                        <UInput
                            v-model="state.token"
                            :placeholder="t('console-wechatoa.form.token.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                        >
                        </UInput>
                    </UFormField>

                    <!-- encodingAESKey -->
                    <UFormField
                        :label="t('console-wechatoa.form.encodingAESKey.label')"
                        name="encodingAESKey"
                        class="mb-6"
                        :description="t('console-wechatoa.form.encodingAESKey.description')"
                    >
                        <UInput
                            v-model="state.encodingAESKey"
                            :placeholder="t('console-wechatoa.form.encodingAESKey.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                        >
                        </UInput>
                    </UFormField>
                    <!-- 消息加密方式 -->
                    <UFormField
                        :label="t('console-wechatoa.form.messageEncryptType.label')"
                        name="messageEncryptType"
                        required
                    >
                        <URadioGroup
                            v-model="state.messageEncryptType"
                            :items="messageEncryptTypeOptions"
                        >
                        </URadioGroup>
                    </UFormField>
                </div>
                <div v-show="activeTab === '2'">
                    <!-- 功能设置 -->
                    <div class="information-container mx-auto mt-8">
                        <div class="mb-4 flex flex-col justify-center">
                            <h2 class="text-xl font-semibold">
                                {{ t("console-wechatoa.sections.functionSettings") }}
                            </h2>
                        </div>
                    </div>

                    <!-- 业务域名 -->
                    <UFormField
                        :label="t('console-wechatoa.form.domain.label')"
                        name="domain"
                        class="mb-6"
                        :description="t('console-wechatoa.form.domain.description')"
                    >
                        <UInput
                            v-model="state.domain"
                            :placeholder="t('console-wechatoa.form.domain.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                            disabled
                            variant="subtle"
                        ></UInput>
                        <UButton class="ml-2" variant="soft" @click="copyDomain">{{
                            t("console-wechatoa.actions.copy")
                        }}</UButton>
                    </UFormField>

                    <!-- js接口安全域名 -->
                    <UFormField
                        :label="t('console-wechatoa.form.jsApiDomain.label')"
                        name="jsApiDomain"
                        class="mb-6"
                        :description="t('console-wechatoa.form.jsApiDomain.description')"
                    >
                        <UInput
                            v-model="state.jsApiDomain"
                            :placeholder="t('console-wechatoa.form.jsApiDomain.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                            disabled
                            variant="subtle"
                        ></UInput>
                        <UButton class="ml-2" variant="soft" @click="copyJsApiDomain">{{
                            t("console-wechatoa.actions.copy")
                        }}</UButton>
                    </UFormField>
                    <!-- 网页授权域名 -->
                    <UFormField
                        :label="t('console-wechatoa.form.webAuthDomain.label')"
                        name="webAuthDomain"
                        class="mb-6"
                        :description="t('console-wechatoa.form.webAuthDomain.description')"
                    >
                        <UInput
                            v-model="state.webAuthDomain"
                            :placeholder="t('console-wechatoa.form.webAuthDomain.placeholder')"
                            size="lg"
                            :ui="{ root: 'w-full sm:w-xs' }"
                            disabled
                            variant="subtle"
                        ></UInput>
                        <UButton class="ml-2" variant="soft" @click="copyWebAuthDomain">{{
                            t("console-wechatoa.actions.copy")
                        }}</UButton>
                    </UFormField>
                </div>

                <!-- 底部按钮 -->
                <div class="flex space-x-3 pt-4">
                    <UButton
                        type="submit"
                        color="primary"
                        size="xl"
                        :loading="isLock || isLockSubmit"
                        :disabled="isLock || isLockSubmit"
                    >
                        {{
                            isLock
                                ? t("console-wechatoa.actions.saving")
                                : t("console-wechatoa.actions.save")
                        }}
                    </UButton>
                    <UButton
                        type="reset"
                        size="xl"
                        :loading="isLock || isLockSubmit"
                        :disabled="isLock || isLockSubmit"
                        color="neutral"
                        variant="outline"
                        @click="resetForm"
                    >
                        {{ t("console-wechatoa.actions.reset") }}
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>
