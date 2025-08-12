<script setup lang="ts">
import { ProModal, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { object, string } from "yup";

import type { Agent, UpdateAgentConfigParams } from "@/models/ai-agent";
import { apiCreateAgent, apiGetAgentDetail, apiUpdateAgentConfig } from "@/services/console/ai-agent";

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
});

// 表单校验规则
const schema = object({
    name: string().required("请输入智能体名称"),
    description: string().required("请输入智能体描述"),
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
        toast.error("获取智能体详情失败");
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
            await apiUpdateAgentConfig(props.id, formData.value);
            toast.success("成功更新智能体");
        } else {
            // 创建模式：调用创建接口
            await apiCreateAgent(formData.value);
            toast.success("成功创建智能体");
        }
        emits("close", true);
    } catch (error) {
        console.error(`${props.id ? "更新" : "创建"}智能体失败:`, error);
        toast.error(`${props.id ? "更新" : "创建"}智能体失败`);
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
        :title="props.id ? '编辑智能体' : '创建智能体应用'"
        :description="
            props.id ? '修改智能体的基本信息' : '具备自主工具调用能力，以及知识库能力的智能体应用'
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
                <UFormField label="智能体头像" name="avatar">
                    <ProUploader
                        v-model="formData.avatar"
                        class="h-24 w-24"
                        text="上传图标"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.jpeg,.gif,.webp"
                        :maxCount="1"
                        :single="true"
                        :multiple="false"
                    />
                    <template #hint> 不设置则使用默认智能体头像 </template>
                </UFormField>

                <UFormField label="智能体名称" name="name" required>
                    <UInput
                        v-model="formData.name"
                        placeholder="请输入智能体名称"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField label="智能体描述" name="description" required>
                    <UTextarea
                        v-model="formData.description"
                        placeholder="请输入智能体描述"
                        :rows="6"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    取消
                </UButton>
                <UButton color="primary" size="lg" :loading="isLock" type="submit">
                    {{ props.id ? "更新" : "创建" }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
