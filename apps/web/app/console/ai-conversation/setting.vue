<script lang="ts" setup>
import { useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import type { ChatConfig, UpdateChatConfigDto } from "@/models/ai-conversation.d.ts";
import { apiGetChatConfig, apiUpdateChatConfig } from "@/services/console/ai-conversation";

const { t } = useI18n();
const router = useRouter();
const message = useMessage();

// 表单数据
const formData = reactive<ChatConfig>({
    suggestions: [
        { icon: "🎮", text: "写一个像宝可梦方式的小游戏" },
        { icon: "📅", text: "2025年节日安排出来了吗?" },
        { icon: "😊", text: "AI时代，什么能力不可被替代?" },
        { icon: "📝", text: "一篇生成爆款小红书笔记" },
        { icon: "🔍", text: "AI能成为全球人类产生威胁吗?" },
    ],
    suggestionsEnabled: true,
    welcomeInfo: {
        title: "👋 Hi，我是你的智能助手",
        description: "作为你的智能伙伴，我能帮你写文案、思考问题、文档整理和删减、答疑解惑。",
        footer: "内容由AI生成，无法确保真实准确，仅供参考。",
    },
});

/** 获取对话配置详情 */
const { lockFn: getChatConfig, isLock: detailLoading } = useLockFn(async () => {
    try {
        const response = await apiGetChatConfig();
        // 合并响应数据到表单
        Object.assign(formData, response);
    } catch (error) {
        console.error("Get chat config failed:", error);
        message.error(t("console-ai-conversation.config.messages.fetchFailed"));
    }
});

/** 添加建议选项 */
const addSuggestion = () => {
    formData.suggestions.push({ icon: "💡", text: "" });
};

/** 删除建议选项 */
const removeSuggestion = (index: number) => {
    if (formData.suggestions.length <= 1) {
        message.warning(t("console-ai-conversation.config.suggestions.minItemWarning"));
        return;
    }
    formData.suggestions.splice(index, 1);
};

/** 提交表单 */
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    try {
        // 验证必填项
        if (!formData.welcomeInfo.title.trim()) {
            message.error(t("console-ai-conversation.config.validation.titleRequired"));
            return;
        }
        if (!formData.welcomeInfo.description.trim()) {
            message.error(t("console-ai-conversation.config.validation.descriptionRequired"));
            return;
        }
        if (formData.suggestions.some((item) => !item.text.trim())) {
            message.error(t("console-ai-conversation.config.validation.suggestionTextRequired"));
            return;
        }

        const updateData: UpdateChatConfigDto = {
            suggestions: formData.suggestions,
            suggestionsEnabled: formData.suggestionsEnabled,
            welcomeInfo: formData.welcomeInfo,
        };

        await apiUpdateChatConfig(updateData);
        message.success(t("console-ai-conversation.config.messages.updateSuccess"));
        // 重新获取配置数据
        await getChatConfig();
    } catch (error) {
        console.error("Update chat config failed:", error);
        message.error(t("console-ai-conversation.config.messages.updateFailed"));
    }
});

/** 处理取消操作 */
const handleCancel = () => {
    router.back();
};

// 初始化
onMounted(() => getChatConfig());
</script>

<template>
    <div class="chat-config-container pb-8">
        <UForm :state="formData" class="space-y-6" @submit="submitForm">
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">
                    {{ t("console-ai-conversation.config.welcomeInfo.title") }}
                </h3>

                <UFormField
                    :label="t('console-ai-conversation.config.welcomeInfo.titleLabel')"
                    name="welcomeInfo.title"
                    required
                >
                    <UInput
                        v-model="formData.welcomeInfo.title"
                        :placeholder="
                            t('console-ai-conversation.config.welcomeInfo.titlePlaceholder')
                        "
                        size="lg"
                        class="w-sm"
                    />
                </UFormField>

                <UFormField
                    :label="t('console-ai-conversation.config.welcomeInfo.descriptionLabel')"
                    name="welcomeInfo.description"
                    required
                >
                    <UTextarea
                        v-model="formData.welcomeInfo.description"
                        :placeholder="
                            t('console-ai-conversation.config.welcomeInfo.descriptionPlaceholder')
                        "
                        :rows="3"
                        class="w-sm"
                    />
                </UFormField>

                <UFormField
                    :label="t('console-ai-conversation.config.welcomeInfo.footerLabel')"
                    name="welcomeInfo.footer"
                >
                    <UTextarea
                        v-model="formData.welcomeInfo.footer"
                        :placeholder="
                            t('console-ai-conversation.config.welcomeInfo.footerPlaceholder')
                        "
                        :rows="2"
                        class="w-sm"
                    />
                </UFormField>
            </div>

            <!-- 建议选项配置 -->
            <div class="space-y-4">
                <div class="flex w-md items-center justify-between">
                    <h3 class="text-lg font-semibold">
                        {{ t("console-ai-conversation.config.suggestions.title") }}
                    </h3>
                    <div class="flex items-center gap-3">
                        <UFormField
                            :label="t('console-ai-conversation.config.suggestions.enabled')"
                            class="flex items-center gap-2"
                        >
                            <USwitch v-model="formData.suggestionsEnabled" size="sm" class="mb-1" />
                        </UFormField>
                        <UButton
                            variant="soft"
                            size="sm"
                            @click="addSuggestion"
                            :disabled="!formData.suggestionsEnabled"
                        >
                            <UIcon name="i-lucide-plus" class="mr-1 size-4" />
                            {{ t("console-common.add") }}
                        </UButton>
                    </div>
                </div>
            </div>

            <div class="w-md space-y-4">
                <div
                    v-for="(suggestion, index) in formData.suggestions"
                    :key="index"
                    class="flex items-center gap-3"
                >
                    <div class="w-20">
                        <UInput
                            v-model="suggestion.icon"
                            :placeholder="
                                t('console-ai-conversation.config.suggestions.iconPlaceholder')
                            "
                            class="text-center"
                            :disabled="!formData.suggestionsEnabled"
                        />
                    </div>
                    <div class="flex-1">
                        <UInput
                            v-model="suggestion.text"
                            :placeholder="
                                t('console-ai-conversation.config.suggestions.textPlaceholder')
                            "
                            class="w-xs"
                            :disabled="!formData.suggestionsEnabled"
                        />
                    </div>
                    <UButton
                        variant="soft"
                        color="error"
                        size="sm"
                        @click="removeSuggestion(index)"
                        :disabled="!formData.suggestionsEnabled || formData.suggestions.length <= 1"
                    >
                        <UIcon name="i-lucide-trash-2" class="size-4" />
                    </UButton>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-3 pt-4">
                <UButton color="neutral" variant="soft" size="lg" @click="handleCancel">
                    {{ t("console-common.cancel") }}
                </UButton>
                <AccessControl :codes="['ai-conversations:update-config']">
                    <UButton
                        color="primary"
                        size="lg"
                        type="submit"
                        :loading="isLock"
                        :disabled="detailLoading"
                    >
                        {{ t("console-common.confirm") }}
                    </UButton>
                </AccessControl>
            </div>
        </UForm>
    </div>
</template>
