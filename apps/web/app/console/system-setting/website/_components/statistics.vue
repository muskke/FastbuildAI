<script lang="ts" setup>
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { UpdateWebsiteRequest, WebsiteConfig, WebsiteStatistics } from "@/models/website";
import { apiGetWebsiteConfig, apiUpdateWebsiteConfig } from "@/services/console/website";

const { t } = useI18n();
const message = useMessage();

/** 表单状态 */
const state = reactive<WebsiteStatistics>({
    appid: "",
});

/** 完整的网站配置数据 */
const websiteConfig = ref<WebsiteConfig | null>(null);

/** 表单校验规则 */
const schema = object({
    appid: string()
        .required(t("console-system.website.statistics.appid.required"))
        .min(5, t("console-system.website.statistics.appid.minLength"))
        .max(50, t("console-system.website.statistics.appid.maxLength")),
});

/** 获取网站配置 */
const { lockFn: getWebsiteConfig, isLock: isLoadingConfig } = useLockFn(async () => {
    try {
        const config = await apiGetWebsiteConfig();
        websiteConfig.value = config;

        // 更新表单状态
        state.appid = config.statistics.appid || "";
    } catch (error) {
        console.error("Get website config failed:", error);
        message.error(t("console-system.website.messages.loadFailed"));
    }
});

/** 保存统计配置 */
const { lockFn: onSubmit, isLock } = useLockFn(async () => {
    try {
        // 构建更新数据，只传递统计部分
        const updateData: UpdateWebsiteRequest = {
            statistics: {
                appid: state.appid,
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
        state.appid = websiteConfig.value.statistics.appid || "";
        message.info(t("console-system.website.messages.resetSuccess"));
    } else {
        state.appid = "";
        message.info(t("console-system.website.messages.resetEmpty"));
    }
};

// 组件挂载时获取配置
onMounted(() => getWebsiteConfig());
</script>

<template>
    <div class="statistics-container mx-auto mt-8">
        <div class="mb-4 flex flex-col justify-center">
            <h2 class="text-xl font-semibold">
                {{ t("console-system.website.statistics.title") }}
            </h2>
            <p class="text-muted-foreground mt-1 text-sm">
                {{ t("console-system.website.statistics.description") }}
            </p>
        </div>

        <!-- 表单 -->
        <UForm
            :schema="schema"
            :state="state"
            class="mx-auto lg:max-w-2xl xl:max-w-4xl"
            @submit="onSubmit"
        >
            <div class="mb-6">
                <UFormField
                    name="appid"
                    :label="t('console-system.website.statistics.appid.label')"
                    required
                >
                    <UInput
                        v-model="state.appid"
                        size="xl"
                        :ui="{ root: 'w-full' }"
                        :placeholder="t('console-system.website.statistics.appid.placeholder')"
                    />
                </UFormField>
            </div>

            <div class="mb-6 rounded-lg bg-gray-50 p-4">
                <div class="flex items-start">
                    <UIcon
                        name="i-heroicons-information-circle"
                        class="text-primary-500 mt-0.5 mr-2"
                    />
                    <div>
                        <p class="text-sm text-gray-700">
                            {{ t("console-system.website.statistics.info.title") }}
                        </p>
                        <p class="text-muted-foreground mt-1 text-xs">
                            {{ t("console-system.website.statistics.info.description") }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex space-x-3">
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
                                : t("console-system.website.actions.saveConfig")
                        }}
                    </UButton>
                </AccessControl>
                <UButton
                    type="button"
                    color="neutral"
                    variant="outline"
                    size="lg"
                    :disabled="isLock || isLoadingConfig"
                    @click="resetForm"
                >
                    {{ t("console-system.website.actions.reset") }}
                </UButton>
            </div>
        </UForm>
    </div>
</template>
