<script lang="ts" setup>
import { ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { UpdateWebsiteRequest, WebsiteConfig, WebsiteCopyright } from "@/models/website";
import { apiGetWebsiteConfig, apiUpdateWebsiteConfig } from "@/services/console/website";

const { t } = useI18n();
const message = useMessage();

/** 表单状态 */
const state = reactive<WebsiteCopyright>({
    displayName: "",
    iconUrl: "",
    url: "",
});

/** 完整的网站配置数据 */
const websiteConfig = ref<WebsiteConfig | null>(null);

/** 表单校验规则 */
const schema = object({
    displayName: string().required(t("console-system.website.copyright.displayName.required")),
    iconUrl: string().required(t("console-system.website.copyright.icon.required")),
    url: string().required(t("console-system.website.copyright.url.required")),
});

/**
 * 获取网站配置
 */
const { lockFn: getWebsiteConfig, isLock: isLoadingConfig } = useLockFn(async () => {
    try {
        const config = await apiGetWebsiteConfig();
        websiteConfig.value = config;

        // 更新表单状态
        state.displayName = config.copyright.displayName || "";
        state.iconUrl = config.copyright.iconUrl || "";
        state.url = config.copyright.url || "";
    } catch (error) {
        console.error("Get website config failed:", error);
        message.error(t("console-system.website.messages.loadFailed"));
    }
});

/**
 * 保存版权配置
 */
const { lockFn: onSubmit, isLock } = useLockFn(async () => {
    try {
        // 构建更新数据，只传递版权部分
        const updateData: UpdateWebsiteRequest = {
            copyright: {
                displayName: state.displayName,
                iconUrl: state.iconUrl,
                url: state.url,
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

/**
 * 重置表单
 */
const resetForm = () => {
    if (websiteConfig.value) {
        state.displayName = websiteConfig.value.copyright.displayName || "";
        state.iconUrl = websiteConfig.value.copyright.iconUrl || "";
        state.url = websiteConfig.value.copyright.url || "";
        message.info(t("console-system.website.messages.resetSuccess"));
    } else {
        state.displayName = "";
        state.iconUrl = "";
        state.url = "";
        message.info(t("console-system.website.messages.resetEmpty"));
    }
};

// 组件挂载时获取配置
onMounted(() => {
    getWebsiteConfig();
});
</script>

<template>
    <div class="copyright-container mx-auto mt-8">
        <div class="mb-4 flex flex-col justify-center">
            <h2 class="text-xl font-semibold">{{ t("console-system.website.copyright.title") }}</h2>
            <p class="text-muted-foreground mt-1 text-sm">
                {{ t("console-system.website.copyright.description") }}
            </p>
        </div>

        <!-- 表单 -->
        <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
            <UFormField
                name="displayName"
                :label="t('console-system.website.copyright.displayName.label')"
                required
            >
                <UInput
                    v-model="state.displayName"
                    size="lg"
                    :ui="{ root: 'w-full' }"
                    :placeholder="t('console-system.website.copyright.displayName.placeholder')"
                />
            </UFormField>

            <UFormField
                name="iconUrl"
                :label="t('console-system.website.copyright.icon.label')"
                required
            >
                <div class="flex items-start gap-4">
                    <ProUploader
                        v-model="state.iconUrl"
                        class="h-24 w-24"
                        :text="t('console-system.website.copyright.icon.upload')"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg"
                        :maxCount="1"
                        :single="true"
                    />
                </div>
            </UFormField>

            <UFormField
                name="url"
                :label="t('console-system.website.copyright.url.label')"
                required
            >
                <UInput
                    v-model="state.url"
                    size="lg"
                    :ui="{ root: 'w-full' }"
                    :placeholder="t('console-system.website.copyright.url.placeholder')"
                />
            </UFormField>

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
                    size="xl"
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
