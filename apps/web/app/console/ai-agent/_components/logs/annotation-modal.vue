<script setup lang="ts">
import { ProEditor, ProModal, useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted, ref } from "vue";
import { boolean, object, string } from "yup";

import type { CreateAgentAnnotationParams, UpdateAgentAnnotationParams } from "@/models/ai-agent";
import {
    apiCreateAgentAnnotation,
    apiGetAgentAnnotationDetail,
    apiUpdateAgentAnnotation,
} from "@/services/console/ai-agent";
import {
    apiCreatePublicAgentAnnotation,
    apiGetPublicAgentAnnotationDetail,
    apiUpdatePublicAgentAnnotation,
} from "@/services/web/ai-agent-publish";

const toast = useMessage();

const props = defineProps<{
    /** 智能体ID */
    agentId: string;
    /** 标注ID，如果为null则为创建模式 */
    annotationId: string | null;
    /** 对话消息ID，用于关联对话消息的metadata */
    messageId?: string | null;
    /** 是否为公开访问模式 */
    isPublic?: boolean;
    /** 发布令牌（公开访问模式需要） */
    publishToken?: string;
    /** 访问令牌（公开访问模式需要） */
    accessToken?: string;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

const { t } = useI18n();
const isOpen = ref(true);

// 表单数据
const formData = ref<CreateAgentAnnotationParams>({
    question: "",
    answer: "",
    enabled: true,
});

// 表单校验规则
const schema = object({
    question: string().required("请输入标注问题"),
    answer: string().required("请输入标注答案"),
    enabled: boolean(),
});

// 获取标注详情（编辑模式）
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        let data;
        if (props.isPublic && props.publishToken && props.accessToken) {
            // 公开访问模式
            data = await apiGetPublicAgentAnnotationDetail(
                props.publishToken,
                props.accessToken,
                props.annotationId as string,
            );
        } else {
            // 管理后台模式
            data = await apiGetAgentAnnotationDetail(props.annotationId as string);
        }

        // 填充表单数据
        formData.value = {
            question: data.question,
            answer: data.answer,
            enabled: data.enabled,
        };
    } catch (error) {
        console.error("获取标注详情失败:", error);
        toast.error((error as Error).message);
    }
});

// 提交表单
const { lockFn: submitForm, isLock: submitting } = useLockFn(async () => {
    try {
        if (props.annotationId) {
            // 更新标注
            if (props.isPublic && props.publishToken && props.accessToken) {
                // 公开访问模式
                await apiUpdatePublicAgentAnnotation(
                    props.publishToken,
                    props.accessToken,
                    props.annotationId,
                    {
                        ...formData.value,
                        messageId: props.messageId || undefined,
                    },
                );
            } else {
                // 管理后台模式
                await apiUpdateAgentAnnotation(props.annotationId, {
                    ...formData.value,
                    messageId: props.messageId || undefined,
                });
            }
            toast.success(t("console-ai-agent.logs.success"));
        } else {
            // 创建标注
            if (props.isPublic && props.publishToken && props.accessToken) {
                // 公开访问模式
                await apiCreatePublicAgentAnnotation(props.publishToken, props.accessToken, {
                    ...formData.value,
                    agentId: props.agentId,
                    messageId: props.messageId || undefined,
                });
            } else {
                // 管理后台模式
                await apiCreateAgentAnnotation(props.agentId, {
                    ...formData.value,
                    agentId: props.agentId,
                    messageId: props.messageId || undefined,
                });
            }
            toast.success(t("console-ai-agent.logs.createAnnotationSuccess"));
        }
        emits("close", true);
    } catch (error) {
        console.error(`${props.annotationId ? "更新" : "创建"}标注失败:`, error);
        toast.error((error as Error).message);
    }
});

// 关闭弹窗
const handleClose = () => {
    emits("close");
};

// 组件挂载时初始化数据
onMounted(async () => {
    // 如果有标注ID，则获取详情数据（编辑模式）
    props.annotationId && fetchDetail();
});
</script>

<template>
    <ProModal
        v-model="isOpen"
        :title="props.annotationId ? t('console-ai-agent.logs.updateAnnotation') : t('console-ai-agent.logs.addAnnotation')"
        :description="
            props.annotationId
                ? t('console-ai-agent.logs.updateAnnotationDesc')
                : t('console-ai-agent.logs.addAnnotationDesc')
        "
        :ui="{ content: 'max-w-xl' }"
        @close="handleClose"
    >
        <!-- 加载状态 -->
        <div v-if="detailLoading" class="flex items-center justify-center" style="height: 420px">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>

        <!-- 表单内容 -->
        <UForm v-else :schema="schema" :state="formData" class="space-y-4" @submit="submitForm">
            <div class="flex flex-col gap-4">
                <UFormField :label="t('console-ai-agent.logs.question')" name="question" required>
                    <UTextarea
                        v-model="formData.question"
                        :placeholder="t('console-ai-agent.logs.questionPlaceholder')"
                        :rows="5"
                        :ui="{ root: 'w-full' }"
                    />
                    <template #hint> {{ t('console-ai-agent.logs.questionHint') }} </template>
                </UFormField>

                <UFormField :label="t('console-ai-agent.logs.answer')" name="answer" required>
                    <ProEditor v-model="formData.answer" custom-class="!h-70" />
                    <template #hint> {{ t('console-ai-agent.logs.answerHint') }} </template>
                </UFormField>

                <UFormField :label="t('console-ai-agent.logs.enabled')" name="enabled">
                    <div class="flex items-center gap-3">
                        <USwitch v-model="formData.enabled" color="primary" />
                        <span class="text-muted-foreground text-sm">
                            {{ formData.enabled ? t('console-common.enabled') : t('console-common.disabled') }}
                        </span>
                    </div>
                    <template #hint> {{ t('console-ai-agent.logs.enabledHint') }} </template>
                </UFormField>
            </div>

            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t('console-common.cancel') }}
                </UButton>
                <UButton color="primary" size="lg" :loading="submitting" type="submit">
                    {{ props.annotationId ? t('console-common.update') : t('console-common.create') }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
