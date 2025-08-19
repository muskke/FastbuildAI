<script lang="ts" setup>
import { ProEditor, useLockFn, useMessage } from "@fastbuildai/ui";
import type { TabsItem } from "@nuxt/ui";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { UpdateWebsiteRequest, WebsiteAgreement, WebsiteConfig } from "@/models/website";
import { apiGetWebsiteConfig, apiUpdateWebsiteConfig } from "@/services/console/website";

const { t } = useI18n();
const message = useMessage();

/** 当前选中的标签页 */
const activeTab = ref("0");

/** 标签选项配置 */
const items = ref<TabsItem[]>([
    { label: t("console-system.website.agreement.privacy") },
    { label: t("console-system.website.agreement.service") },
    { label: t("console-system.website.agreement.payment") },
]);

/** 表单状态 */
const state = reactive<WebsiteAgreement>({
    privacyTitle: "",
    privacyContent: "",
    serviceTitle: "",
    serviceContent: "",
    paymentTitle: "",
    paymentContent: "",
});

/** 完整的网站配置数据 */
const websiteConfig = ref<WebsiteConfig | null>(null);

/** 表单校验规则 */
const schema = object({
    privacyTitle: string().required(t("console-system.website.agreement.titleRequired")),
    privacyContent: string().required(t("console-system.website.agreement.contentRequired")),
    serviceTitle: string().required(t("console-system.website.agreement.titleRequired")),
    serviceContent: string().required(t("console-system.website.agreement.contentRequired")),
    paymentTitle: string().required(t("console-system.website.agreement.titleRequired")),
    paymentContent: string().required(t("console-system.website.agreement.contentRequired")),
});

/** 获取网站配置 */
const { lockFn: getWebsiteConfig, isLock: isLoadingConfig } = useLockFn(async () => {
    try {
        const config = await apiGetWebsiteConfig();
        websiteConfig.value = config;

        // 更新表单状态
        state.privacyTitle =
            config.agreement.privacyTitle || t("console-system.website.agreement.privacy");
        state.privacyContent = config.agreement.privacyContent || "";
        state.serviceTitle =
            config.agreement.serviceTitle || t("console-system.website.agreement.service");
        state.serviceContent = config.agreement.serviceContent || "";
        state.paymentTitle =
            config.agreement.paymentTitle || t("console-system.website.agreement.payment");
        state.paymentContent = config.agreement.paymentContent || "";
    } catch (error) {
        console.error("Get website config failed:", error);
        message.error(t("console-system.website.messages.loadFailed"));
    }
});

/** 保存协议配置 */
const { lockFn: onSubmit, isLock } = useLockFn(async () => {
    try {
        // 构建更新数据，只传递协议部分
        const updateData: UpdateWebsiteRequest = {
            agreement: {
                privacyTitle: state.privacyTitle,
                privacyContent: state.privacyContent,
                serviceTitle: state.serviceTitle,
                serviceContent: state.serviceContent,
                paymentTitle: state.paymentTitle,
                paymentContent: state.paymentContent,
            },
        };

        await apiUpdateWebsiteConfig(updateData);
        message.success(t("console-system.website.messages.saveSuccess"));

        // 重新获取配置以确保数据同步
        await getWebsiteConfig();
    } catch (error) {
        console.error("Save failed:", error);
        message.error(t("console-system.website.messages.saveFailed"));
    }
});

/** 重置表单 */
const resetForm = () => {
    if (websiteConfig.value) {
        state.privacyTitle =
            websiteConfig.value.agreement.privacyTitle ||
            t("console-system.website.agreement.privacy");
        state.privacyContent = websiteConfig.value.agreement.privacyContent || "";
        state.serviceTitle =
            websiteConfig.value.agreement.serviceTitle ||
            t("console-system.website.agreement.service");
        state.serviceContent = websiteConfig.value.agreement.serviceContent || "";
        state.paymentTitle =
            websiteConfig.value.agreement.paymentTitle ||
            t("console-system.website.agreement.payment");
        state.paymentContent = websiteConfig.value.agreement.paymentContent || "";
        message.info(t("console-system.website.messages.resetSuccess"));
    } else {
        state.privacyTitle = t("console-system.website.agreement.privacy");
        state.privacyContent = "";
        state.serviceTitle = t("console-system.website.agreement.service");
        state.serviceContent = "";
        state.paymentTitle = t("console-system.website.agreement.payment");
        state.paymentContent = "";
        message.info(t("console-system.website.messages.resetEmpty"));
    }
};

/** 表单错误处理 */
const onFormError = () => {
    if (state.privacyTitle === "") {
        return message.warning(t("console-system.website.agreement.privacyTitle"));
    }
    if (state.privacyContent === "") {
        return message.warning(t("console-system.website.agreement.privacyContent"));
    }
    if (state.serviceTitle === "") {
        return message.warning(t("console-system.website.agreement.serviceTitle"));
    }
    if (state.serviceContent === "") {
        return message.warning(t("console-system.website.agreement.serviceContent"));
    }
    if (state.paymentTitle === "") {
        return message.warning(t("console-system.website.agreement.paymentTitle"));
    }
    if (state.paymentContent === "") {
        return message.warning(t("console-system.website.agreement.paymentContent"));
    }
};

// 组件挂载时获取配置
onMounted(() => getWebsiteConfig());
</script>

<template>
    <div class="agreement-container relative mx-auto mt-8">
        <div class="mb-4 flex flex-col justify-center">
            <h2 class="text-xl font-semibold">{{ t("console-system.website.agreement.title") }}</h2>
            <p class="text-muted-foreground mt-1 text-sm">
                {{ t("console-system.website.agreement.description") }}
            </p>
        </div>

        <!-- 表单 -->
        <div class="mb-4 inline-block w-auto">
            <UTabs v-model="activeTab" :items="items" />
        </div>

        <UForm :schema="schema" :state="state" @submit="onSubmit" @error="onFormError">
            <template v-if="activeTab === '0'">
                <UFormField
                    name="privacyTitle"
                    :label="t('console-system.website.agreement.titleLabel')"
                    required
                >
                    <UInput v-model="state.privacyTitle" size="xl" :ui="{ root: 'w-full' }" />
                </UFormField>

                <UFormField
                    name="privacyContent"
                    :label="t('console-system.website.agreement.contentLabel')"
                    class="mt-4"
                    required
                >
                    <ProEditor v-model="state.privacyContent" />
                </UFormField>
            </template>

            <template v-else-if="activeTab === '1'">
                <UFormField
                    name="serviceTitle"
                    :label="t('console-system.website.agreement.titleLabel')"
                    required
                >
                    <UInput v-model="state.serviceTitle" size="xl" :ui="{ root: 'w-full' }" />
                </UFormField>

                <UFormField
                    name="serviceContent"
                    :label="t('console-system.website.agreement.contentLabel')"
                    class="mt-4"
                    required
                >
                    <ProEditor v-model="state.serviceContent" />
                </UFormField>
            </template>

            <template v-else-if="activeTab === '2'">
                <UFormField
                    name="paymentTitle"
                    :label="t('console-system.website.agreement.titleLabel')"
                    required
                >
                    <UInput v-model="state.paymentTitle" size="xl" :ui="{ root: 'w-full' }" />
                </UFormField>

                <UFormField
                    name="paymentContent"
                    :label="t('console-system.website.agreement.contentLabel')"
                    class="mt-4"
                    required
                >
                    <ProEditor v-model="state.paymentContent" />
                </UFormField>
            </template>

            <div class="flex space-x-3 pt-4">
                <AccessControl :codes="['system-website:setConfig']">
                    <UButton
                        type="submit"
                        color="primary"
                        size="xl"
                        :loading="isLock"
                        :disabled="isLock || isLoadingConfig"
                    >
                        {{
                            isLock
                                ? t("console-system.website.actions.saving")
                                : t("console-system.website.actions.saveChanges")
                        }}
                    </UButton>
                </AccessControl>
                <UButton
                    type="reset"
                    size="lg"
                    color="neutral"
                    variant="outline"
                    :disabled="isLock || isLoadingConfig"
                    @click="resetForm"
                >
                    {{ t("console-system.website.actions.reset") }}
                </UButton>
            </div>
        </UForm>
    </div>
</template>
