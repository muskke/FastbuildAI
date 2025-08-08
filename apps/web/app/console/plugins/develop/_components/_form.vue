<script lang="ts" setup>
import { ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { reactive, ref } from "vue";
import { object, string } from "yup";

import type { PluginCreateParams } from "@/models/plugin";

// 引入国际化
const { t } = useI18n();

/**
 * 组件属性接口
 */
interface Props {
    /** 是否编辑模式 */
    isEdit?: boolean;
    /** 编辑的ID */
    id?: string | number | null;
    /** 初始数据 */
    initialData?: Partial<PluginCreateParams>;
}

// 定义组件属性
const props = withDefaults(defineProps<Props>(), {
    isEdit: false,
    id: null,
    initialData: () => ({}),
});

// 定义事件
const emit = defineEmits<{
    /** 提交成功事件 */
    (e: "submit-success", data: PluginCreateParams): void;
    /** 取消事件 */
    (e: "cancel"): void;
}>();

const message = useMessage();

// 表单数据
const formData = reactive<PluginCreateParams>({
    name: "",
    icon: "",
    packName: "",
    description: "",
    version: "",
    ...props.initialData,
});

// 版本号分段数据（用于 UPinInput）
const versionParts = computed({
    get: () => {
        if (!formData.version) return ["", "", ""];
        const parts = formData.version.split(".");
        return [parts[0] || "", parts[1] || "", parts[2] || ""];
    },
    set: (value: string[]) => {
        formData.version = value.filter((v) => v !== "").join(".");
    },
});

// 表单规则
const schema = object({
    name: string().required(t("console-plugins.develop.form.nameRequired")),
    packName: string()
        .required(t("console-plugins.develop.form.keyRequired"))
        .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, t("console-plugins.develop.form.keyFormat")),
    description: string().required(t("console-plugins.develop.form.descriptionRequired")),
    version: string()
        .required(t("console-plugins.develop.form.versionRequired"))
        .matches(/^\d+\.\d+\.\d+$/, t("console-plugins.develop.form.versionFormat")),
});

const formRef = ref<any>(null);

/**
 * 重置表单
 */
const resetForm = () => {
    Object.keys(formData).forEach((key) => {
        if (typeof formData[key as keyof PluginCreateParams] === "string") {
            formData[key as keyof PluginCreateParams] = "";
        }
    });
    message.info(t("console-plugins.develop.messages.formReset"));
};

/**
 * 提交表单
 */
const { isLock, lockFn: submitForm } = useLockFn(async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 发送事件，由父组件处理提交逻辑
        emit("submit-success", { ...formData });
    } catch (error) {
        console.error(t("console-plugins.develop.messages.formValidationFailed") + ":", error);
        return false;
    }
});

// 暴露方法给父组件
defineExpose({
    resetForm,
    formData,
});
</script>

<template>
    <UForm
        ref="formRef"
        :state="formData"
        :schema="schema"
        class="max-w-3xl space-y-6"
        @submit="submitForm"
    >
        <!-- 插件名称 -->
        <UFormField :label="t('console-plugins.develop.form.name')" required name="name">
            <UInput
                v-model="formData.name"
                :placeholder="t('console-plugins.develop.form.nameInput')"
                size="lg"
                :ui="{ root: 'w-full sm:w-xs' }"
            />
        </UFormField>

        <!-- 插件图标 -->
        <UFormField :label="t('console-plugins.develop.form.icon')" required name="icon">
            <ProUploader
                v-model="formData.icon"
                class="h-24 w-24"
                :text="t('console-plugins.develop.form.addIcon')"
                icon="i-lucide-upload"
                accept=".jpg,.png,.jpeg"
                :maxCount="1"
                :single="true"
            />
            <template #help>
                <span class="text-xs">{{
                    t("console-plugins.develop.form.iconRecommendation")
                }}</span>
            </template>
        </UFormField>

        <!-- 插件Key -->
        <UFormField :label="t('console-plugins.develop.form.packName')" required name="packName">
            <UInput
                v-model="formData.packName"
                :placeholder="t('console-plugins.develop.form.packNameInput')"
                size="lg"
                :ui="{ root: 'w-full sm:w-xs' }"
                :disabled="props.isEdit"
            />
            <template #help>
                <span class="text-xs">{{ t("console-plugins.develop.form.packNameHelp") }}</span>
            </template>
        </UFormField>

        <!-- 插件描述 -->
        <UFormField
            :label="t('console-plugins.develop.form.description')"
            required
            name="description"
        >
            <UTextarea
                v-model="formData.description"
                :placeholder="t('console-plugins.develop.form.descriptionInput')"
                size="lg"
                :rows="4"
                :ui="{ root: 'w-full sm:w-xs' }"
            />
        </UFormField>

        <!-- 插件版本 -->
        <UFormField :label="t('console-plugins.develop.form.version')" required name="version">
            <div class="flex items-center gap-2">
                <UPinInput
                    v-model="versionParts"
                    placeholder="0"
                    size="lg"
                    length="3"
                    class="flex gap-2"
                />
            </div>
            <template #help>
                <span class="text-xs">{{ t("console-plugins.develop.form.versionHelp") }}</span>
            </template>
        </UFormField>

        <!-- 操作按钮 -->
        <div class="flex gap-4 py-8">
            <UButton color="primary" size="lg" :loading="isLock" type="submit">
                {{ props.isEdit ? t("console-common.update") : t("console-common.create") }}
            </UButton>
            <UButton color="neutral" size="lg" @click="resetForm">
                {{ t("console-common.reset") }}
            </UButton>
            <UButton color="neutral" variant="outline" size="lg" @click="emit('cancel')">
                {{ t("console-common.cancel") }}
            </UButton>
        </div>
    </UForm>
</template>
