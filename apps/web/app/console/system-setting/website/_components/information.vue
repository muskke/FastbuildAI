<script setup lang="ts">
import { ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { UpdateWebsiteRequest, WebsiteConfig, WebsiteInfo } from "@/models/website";
import { apiGetWebsiteConfig, apiUpdateWebsiteConfig } from "@/services/console/website";

const { t } = useI18n();
const message = useMessage();
const appStore = useAppStore();

/** 网站信息表单验证模式 */
const schema = object({
    name: string().required(t("console-system.website.information.name.required")),
    description: string().optional(),
    icon: string().required(t("console-system.website.information.icon.required")),
    logo: string().required(t("console-system.website.information.logo.required")),
});

/** 表单状态 */
const state = reactive<WebsiteInfo>({
    name: "",
    description: "",
    icon: "",
    logo: "",
});

/** 完整的网站配置数据 */
const websiteConfig = ref<WebsiteConfig | null>(null);

/** 获取网站配置 */
const { lockFn: getWebsiteConfig, isLock: isLoadingConfig } = useLockFn(async () => {
    try {
        const config = await apiGetWebsiteConfig();
        websiteConfig.value = config;

        // 更新表单状态
        state.name = config.webinfo.name || "";
        state.description = config.webinfo.description || "";
        state.icon = config.webinfo.icon || "";
        state.logo = config.webinfo.logo || "";
    } catch (error) {
        console.error("Get website config failed:", error);
        message.error(t("console-system.website.messages.loadFailed"));
    }
});

/** 保存网站信息 */
const { lockFn: handleSubmit, isLock } = useLockFn(async () => {
    try {
        // 构建更新数据，只传递网站信息部分
        const updateData: UpdateWebsiteRequest = {
            webinfo: {
                name: state.name,
                description: state.description,
                icon: state.icon,
                logo: state.logo,
            },
        };

        await apiUpdateWebsiteConfig(updateData);
        message.success(t("console-system.website.messages.saveSuccess"));

        // 重新获取配置以确保数据同步
        await apiGetWebsiteConfig();

        await useAsyncData("config", () => appStore.getConfig(), {
            lazy: import.meta.server,
        });
        useHead({
            title: state.name,
            link: [
                { rel: "icon", href: appStore.siteConfig?.webinfo?.icon || "/favicon.ico" },
                {
                    rel: "apple-touch-icon",
                    href: appStore.siteConfig?.webinfo?.logo || "/favicon.ico",
                },
            ],
        });
    } catch (error) {
        console.error("Save failed:", error);
        message.error(t("console-system.website.messages.saveFailed"));
    }
});

/** 重置表单 */
const resetForm = () => {
    if (websiteConfig.value) {
        state.name = websiteConfig.value.webinfo.name || "";
        state.description = websiteConfig.value.webinfo.description || "";
        state.icon = websiteConfig.value.webinfo.icon || "";
        state.logo = websiteConfig.value.webinfo.logo || "";
        message.info(t("console-system.website.messages.resetSuccess"));
    } else {
        state.name = "";
        state.description = "";
        state.icon = "";
        state.logo = "";
        message.info(t("console-system.website.messages.resetEmpty"));
    }
};

// 组件挂载时获取配置
onMounted(() => getWebsiteConfig());
</script>

<template>
    <div class="information-container mt-8">
        <!-- 表单 -->
        <UForm :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
            <!-- 网站名称 -->
            <UFormField
                :label="t('console-system.website.information.name.label')"
                name="name"
                :description="t('console-system.website.information.name.description')"
                required
            >
                <UInput
                    v-model="state.name"
                    :placeholder="t('console-system.website.information.name.placeholder')"
                    size="lg"
                    :ui="{ root: 'w-full sm:w-xs' }"
                >
                    <template #leading>
                        <UIcon name="i-heroicons-globe-alt" />
                    </template>
                </UInput>
            </UFormField>

            <!-- TODO网站描述 -->

            <!-- 网站图标 -->
            <UFormField
                :label="t('console-system.website.information.icon.label')"
                name="icon"
                :description="t('console-system.website.information.icon.description')"
                required
            >
                <div class="flex items-start gap-4">
                    <ProUploader
                        v-model="state.icon"
                        class="h-24 w-24"
                        :text="t('console-system.website.information.icon.upload')"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg,.ico"
                        :maxCount="1"
                        :single="true"
                    />
                </div>
            </UFormField>

            <!-- 网站Logo -->
            <UFormField
                :label="t('console-system.website.information.logo.label')"
                name="logo"
                :description="t('console-system.website.information.logo.description')"
                required
            >
                <div class="flex items-start gap-4">
                    <ProUploader
                        v-model="state.logo"
                        class="h-24 w-24"
                        :text="t('console-system.website.information.logo.upload')"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg"
                        :maxCount="1"
                        :single="true"
                    />
                </div>
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
                                : t("console-system.website.actions.save")
                        }}
                    </UButton>
                </AccessControl>
                <UButton
                    type="reset"
                    size="xl"
                    :loading="isLock"
                    :disabled="isLock || isLoadingConfig"
                    color="neutral"
                    variant="outline"
                    @click="resetForm"
                >
                    {{ t("console-system.website.actions.reset") }}
                </UButton>
            </div>
        </UForm>
    </div>
</template>
