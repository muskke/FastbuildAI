<script setup lang="ts">
import { ProModal, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import { usePluginSlots } from "@/common/utils/plugins.utils";
import type { Agent, UpdateAgentConfigParams } from "@/models/ai-agent";
import {
    apiCreateAgent,
    apiGetAgentDetail,
    apiUpdateAgentConfig,
} from "@/services/console/ai-agent";

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    /** 智能体ID，如果为null则为创建模式 */
    id: string | null;
    datasetId?: string;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

const isOpen = ref(true);

// 表单数据
const formData = ref<UpdateAgentConfigParams>({
    name: "",
    description: "",
    avatar: "",
    createMode: "direct",
    thirdPartyIntegration: {},
});

// 创建模式选项
const createModes = computed(() => {
    const modes = [
        {
            value: "direct",
            label: t("console-ai-agent.create.modes.direct"),
            icon: "i-lucide-zap",
        },
    ];

    // 获取插件贡献的创建模式
    const pluginModes = usePluginSlots("agent:create:modes").value.map((slot) => ({
        value: slot.meta?.value,
        label: t(slot.meta?.label as string),
        icon: slot.meta?.icon,
    }));

    return [...modes, ...pluginModes];
});

// 表单校验规则
const schema = object({
    name: string().required(t("console-ai-agent.create.namePlaceholder")),
    description: string().required(t("console-ai-agent.create.descriptionPlaceholder")),
});

// 获取智能体详情（编辑模式）
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        const { createdAt, userCount, updatedAt, id, ...data } = await apiGetAgentDetail(
            props.id as string,
        );
        // 填充表单数据
        formData.value = data as UpdateAgentConfigParams;
    } catch (error) {
        console.error("获取智能体详情失败:", error);
    }
});

// 提交表单
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    try {
        if (props.id) {
            if (formData.value.avatar === undefined) {
                formData.value.avatar = null;
            }
            // 编辑模式：调用更新接口
            await apiUpdateAgentConfig(props.id, {
                name: formData.value.name,
                description: formData.value.description,
                avatar: formData.value.avatar,
            });
            refreshNuxtData(`agent-detail-${props.id}`);
            toast.success(t("common.message.updateSuccess"));
        } else {
            // 创建模式：调用创建接口
            await apiCreateAgent({
                name: formData.value.name,
                description: formData.value.description,
                avatar: formData.value.avatar,
                createMode: formData.value.createMode,
                thirdPartyIntegration: formData.value.thirdPartyIntegration,
            });
            toast.success(t("common.message.createSuccess"));
        }
        emits("close", true);
    } catch (error) {
        console.error(`${props.id ? "更新" : "创建"}智能体失败:`, error);
    }
});

// 关闭弹窗
const handleClose = () => {
    emits("close");
};

// 组件挂载时初始化数据
onMounted(async () => {
    // 如果有ID，则获取详情数据（编辑模式）
    props.id && fetchDetail();
});
</script>

<template>
    <ProModal
        v-model="isOpen"
        :title="
            props.id ? $t('console-ai-agent.create.editTitle') : $t('console-ai-agent.create.title')
        "
        :description="
            props.id ? $t('console-ai-agent.create.editDesc') : $t('console-ai-agent.create.desc')
        "
        :ui="{ content: 'max-w-lg' }"
        @close="handleClose"
    >
        <!-- 加载状态 -->
        <div v-if="detailLoading" class="flex items-center justify-center" style="height: 420px">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>

        <!-- 表单内容 -->
        <UForm v-else :schema="schema" :state="formData" class="space-y-4" @submit="submitForm">
            <div class="flex flex-col gap-4">
                <!-- 创建模式选择（仅创建时显示） -->
                <UFormField
                    v-if="!props.id && createModes.length != 1"
                    :label="$t('console-ai-agent.create.mode')"
                    name="createMode"
                >
                    <!-- 卡片选择器 -->
                    <div class="grid grid-cols-3 gap-4">
                        <div
                            v-for="mode in createModes"
                            :key="mode.value as string"
                            class="group hover:border-primary/50 relative cursor-pointer rounded-lg border-2 px-4 py-3 text-center transition-colors"
                            :class="{
                                'border-primary bg-primary/5': formData.createMode === mode.value,
                                'border-gray-200 bg-white': formData.createMode !== mode.value,
                            }"
                            @click="formData.createMode = mode.value as string"
                        >
                            <!-- 选中标识 -->
                            <div
                                v-if="formData.createMode === mode.value"
                                class="bg-primary absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white"
                            >
                                <UIcon name="i-lucide-check" class="h-3 w-3" />
                            </div>

                            <!-- 图标 -->
                            <div class="mb-2 flex justify-center">
                                <div
                                    class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg"
                                    :class="{
                                        'bg-primary text-white': formData.createMode === mode.value,
                                        'bg-gray-100 text-gray-600':
                                            formData.createMode !== mode.value,
                                    }"
                                >
                                    <!-- 如果是字符串类型的图标类名 -->
                                    <UIcon
                                        v-if="
                                            mode.icon &&
                                            typeof mode.icon === 'string' &&
                                            !mode.icon.includes('.')
                                        "
                                        :name="mode.icon"
                                        class="h-6 w-6"
                                    />
                                    <!-- 如果是其他类型的图标（SVG URL 或导入的 SVG 对象） -->
                                    <component
                                        v-else-if="mode.icon"
                                        :is="mode.icon"
                                        :src="mode.icon as string"
                                        :alt="mode.label"
                                        filled
                                        :fontControlled="false"
                                        class="size-8 object-contain"
                                    />
                                </div>
                            </div>

                            <!-- 标题 -->
                            <div class="text-foreground font-medium">{{ mode.label }}</div>
                        </div>
                    </div>
                </UFormField>

                <UFormField :label="$t('console-ai-agent.create.avatar')" name="avatar">
                    <ProUploader
                        v-model="formData.avatar"
                        class="h-24 w-24"
                        :text="$t('console-ai-agent.create.avatarUpload')"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg,.gif,.webp"
                        :maxCount="1"
                        :single="true"
                        :multiple="false"
                    />
                    <template #hint> {{ $t("console-ai-agent.create.avatarDefault") }} </template>
                </UFormField>

                <UFormField :label="$t('console-ai-agent.create.name')" name="name" required>
                    <UInput
                        v-model="formData.name"
                        :placeholder="$t('console-ai-agent.create.namePlaceholder')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    :label="$t('console-ai-agent.create.description')"
                    name="description"
                    required
                >
                    <UTextarea
                        v-model="formData.description"
                        :placeholder="$t('console-ai-agent.create.descriptionPlaceholder')"
                        :rows="6"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ $t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" :loading="isLock" type="submit">
                    {{ props.id ? $t("console-common.update") : $t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
