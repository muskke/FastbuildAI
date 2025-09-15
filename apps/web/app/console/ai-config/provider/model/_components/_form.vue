<script lang="ts" setup>
import { ProSlider, useLockFn, useMessage } from "@fastbuildai/ui";
import type { AccordionItem } from "@nuxt/ui";
import { boolean, number, object, string } from "yup";

import type { modelConfigItem } from "@/models";
import { apiGetParentModelTypeLimit } from "@/services/console/ai-model";

interface AiModelFormProps {
    isEdit?: boolean;
    id?: string;
    initialData?: Record<string, any>;
}

interface AiModelFormEmits {
    (e: "submit-success", data: any): void;
    (e: "cancel"): void;
}
const { query: URLQueryParams } = useRoute();

const props = withDefaults(defineProps<AiModelFormProps>(), {
    isEdit: false,
    id: "",
    initialData: () => ({}),
});

const emit = defineEmits<AiModelFormEmits>();
const message = useMessage();
const { t } = useI18n();

// 默认全局配置项
const getDefaultmodelConfig = (): modelConfigItem[] => [
    {
        field: "temperature",
        title: t("console-ai-provider.modelConfig.temperature.title"),
        description: t("console-ai-provider.modelConfig.temperature.description"),
        value: 1,
        enable: true,
    },
    {
        field: "top_p",
        title: t("console-ai-provider.modelConfig.top_p.title"),
        description: t("console-ai-provider.modelConfig.top_p.description"),
        value: 1,
        enable: true,
    },
    {
        field: "max_tokens",
        title: t("console-ai-provider.modelConfig.max_tokens.title"),
        description: t("console-ai-provider.modelConfig.max_tokens.description"),
        value: 4096,
        enable: true,
    },
    {
        field: "top_k",
        title: t("console-ai-provider.modelConfig.top_k.title"),
        description: t("console-ai-provider.modelConfig.top_k.description"),
        value: 50,
        enable: true,
    },
    {
        field: "frequency_penalty",
        title: t("console-ai-provider.modelConfig.frequency_penalty.title"),
        description: t("console-ai-provider.modelConfig.frequency_penalty.description"),
        value: 0,
        enable: true,
    },
    {
        field: "presence_penalty",
        title: t("console-ai-provider.modelConfig.presence_penalty.title"),
        description: t("console-ai-provider.modelConfig.presence_penalty.description"),
        value: 0,
        enable: true,
    },
    {
        field: "stop",
        title: t("console-ai-provider.modelConfig.stop.title"),
        description: t("console-ai-provider.modelConfig.stop.description"),
        value: null,
        enable: false,
    },
];

// 参数配置范围定义
const parameterRanges: Record<string, { min: number; max: number; step: number }> = {
    temperature: { min: 0, max: 2, step: 0.1 },
    top_p: { min: 0, max: 1, step: 0.1 },
    max_tokens: { min: 1, max: 2048, step: 1 },
    top_k: { min: 1, max: 100, step: 1 },
    frequency_penalty: { min: 0, max: 2, step: 0.1 },
    presence_penalty: { min: 0, max: 2, step: 0.1 },
};

// 表单数据
const formData = reactive({
    name: "",
    providerId: "",
    model: "",
    maxContext: 3 as number,
    modelConfig: getDefaultmodelConfig(),
    isActive: true,
    isDefault: false,
    description: "",
    sortOrder: 0,
    modelType: undefined,
    billingRule: {
        power: 0,
        tokens: 1,
    },
});

// 表单验证规则
const schema = object({
    name: string()
        .required(t("console-ai-provider.model.validation.nameRequired"))
        .max(100, t("console-ai-provider.model.validation.nameMaxLength")),
    model: string()
        .required(t("console-ai-provider.model.validation.modelRequired"))
        .max(100, t("console-ai-provider.model.validation.modelMaxLength")),
    maxTokens: number().min(1, t("console-ai-provider.model.validation.maxTokensMin")).nullable(),
    maxContext: number().min(1, t("console-ai-provider.model.validation.maxContextMin")).nullable(),
    description: string()
        .max(500, t("console-ai-provider.model.validation.descriptionMaxLength"))
        .nullable(),
    isActive: boolean(),
    isDefault: boolean(),
    sortOrder: number().nullable(),
    modelType: string().required("请选择模型类型"),
});

const modelTypes = ref<string[]>([]);

/**
 * 获取父级模型类型限制
 */
const getParentModelTypeLimit = async () => {
    const response = await apiGetParentModelTypeLimit({
        providerId: URLQueryParams.providerId as string,
    });
    modelTypes.value = response;
};

/**
 * 监听初始数据变化
 */
watch(
    () => props.initialData,
    (newData) => {
        if (newData && Object.keys(newData).length > 0) {
            Object.assign(formData, {
                name: newData.name || "",
                providerId: newData.providerId || "",
                model: newData.model || "",
                maxContext: newData.maxContext,
                maxTokens: newData.maxTokens,
                modelConfig: newData.modelConfig,
                isActive: newData.isActive ?? true,
                isDefault: newData.isDefault ?? false,
                description: newData.description || "",
                sortOrder: newData.sortOrder || 0,
                modelType: newData.modelType || "",
                billingRule: {
                    power: newData.billingRule?.power || 0,
                    tokens: newData.billingRule?.tokens || 0,
                },
            });
        }
    },
    { immediate: true, deep: true },
);

/**
 * 处理表单提交
 */
const { isLock: isSubmitting, lockFn: submitForm } = useLockFn(async () => {
    try {
        // 创建一个新的对象，避免直接修改原始数据
        const submitData: Record<string, any> = { ...formData };

        // 将modelConfig数组转换为对象格式
        if (submitData.modelConfig && Array.isArray(submitData.modelConfig)) {
            const modelConfigObj: Record<string, any> = {};

            submitData.modelConfig.forEach((config: modelConfigItem) => {
                if (config.field && config.field.trim() !== "") {
                    // 使用field作为键名，创建新的对象结构
                    modelConfigObj[config.field] = {
                        title: config.title,
                        description: config.description,
                        value: config.value,
                        enable: config.enable,
                    };
                }
            });

            // 替换modelConfig为转换后的对象
            submitData.modelConfig = modelConfigObj;
        }

        emit("submit-success", submitData);
    } catch (error) {
        console.error("Form validation failed:", error);
        message.error(t("console-common.formValidationFailed"));
    }
});

/**
 * 处理取消操作
 */
const handleCancel = () => {
    emit("cancel");
};

/**
 * 检查参数字段名是否重复
 */
const isFieldDuplicate = (field: string, currentIndex: number) => {
    if (!formData.modelConfig) return false;
    return formData.modelConfig.some(
        (config: any, index: number) =>
            index !== currentIndex && config.field === field && field.trim() !== "",
    );
};

/**
 * 删除配置参数
 */
const removeParameter = (index: number) => {
    formData.modelConfig?.splice(index, 1);
};

/**
 * 添加新的配置参数
 */
const addCustomParameter = () => {
    const newParam = {
        field: "",
        title: "",
        description: "",
        value: "",
        enable: true,
    };
    formData.modelConfig?.push(newParam);
};

onMounted(() => {
    getParentModelTypeLimit();
});

/**
 * 重置表单
 */
const resetForm = () => {
    Object.assign(formData, {
        name: "",
        providerId: "",
        model: "",
        maxTokens: undefined,
        maxContext: undefined,
        pricing: {
            input: undefined,
            output: undefined,
            currency: "USD",
        },
        isActive: true,
        isDefault: false,
        description: "",
        sortOrder: 0,
    });
    message.info(t("console-common.reset"));
};

// 暴露方法
defineExpose({ resetForm });
</script>

<template>
    <div>
        <UForm
            ref="formRef"
            :state="formData"
            :schema="schema"
            class="space-y-8"
            @submit="submitForm"
        >
            <!-- 主要内容区域 -->
            <div class="grid grid-cols-1 gap-8 pb-8 lg:grid-cols-3">
                <!-- 左侧基本信息区域 -->
                <div class="shadow-default h-fit rounded-lg lg:col-span-1">
                    <div class="space-y-6 p-6">
                        <!-- 模型图标 -->
                        <div class="flex justify-center">
                            <div
                                class="bg-primary/10 border-primary/20 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed"
                            >
                                <UIcon name="i-lucide-brain" class="text-primary h-12 w-12" />
                            </div>
                        </div>

                        <!-- 模型状态设置 -->
                        <div class="space-y-4 border-t pt-4">
                            <!-- 启用状态 -->
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="text-secondary-foreground text-sm font-medium">
                                        {{ t("console-ai-provider.model.form.isActive") }}
                                    </h4>
                                    <p class="text-muted-foreground mt-1 text-xs">
                                        {{
                                            formData.isActive
                                                ? t(
                                                      "console-ai-provider.model.form.isActiveEnabled",
                                                  )
                                                : t(
                                                      "console-ai-provider.model.form.isActiveDisabled",
                                                  )
                                        }}
                                    </p>
                                </div>
                                <USwitch
                                    v-model="formData.isActive"
                                    unchecked-icon="i-lucide-x"
                                    checked-icon="i-lucide-check"
                                    size="lg"
                                    color="primary"
                                />
                            </div>

                            <!-- 默认模型 -->
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="text-secondary-foreground text-sm font-medium">
                                        {{ t("console-ai-provider.model.form.isDefault") }}
                                    </h4>
                                    <p class="text-muted-foreground mt-1 text-xs">
                                        {{ t("console-ai-provider.model.form.setAsDefault") }}
                                    </p>
                                </div>
                                <USwitch
                                    v-model="formData.isDefault"
                                    unchecked-icon="i-lucide-star-off"
                                    checked-icon="i-lucide-star"
                                    size="lg"
                                    color="warning"
                                />
                            </div>

                            <!-- 排序权重 -->
                            <div class="space-y-2">
                                <UFormField
                                    :label="t('console-ai-provider.model.form.sortOrder')"
                                    name="sortOrder"
                                >
                                    <UInput
                                        v-model.number="formData.sortOrder"
                                        type="number"
                                        :placeholder="
                                            t('console-ai-provider.model.form.sortOrderPlaceholder')
                                        "
                                        :min="0"
                                        size="lg"
                                        class="w-full"
                                    />
                                    <template #hint>
                                        <span class="text-muted-foreground text-xs">
                                            {{ t("console-ai-provider.model.form.sortOrderHelp") }}
                                        </span>
                                    </template>
                                </UFormField>

                                <!-- 计费规则 -->
                                <UFormField
                                    :label="t('console-ai-provider.model.form.billing')"
                                    name="billing"
                                >
                                    <div class="flex w-full items-center gap-2">
                                        <UInput
                                            v-model.number="formData.billingRule.power"
                                            type="number"
                                            placeholder=""
                                            size="lg"
                                            :min="0"
                                            class="flex-1"
                                            :ui="{ base: 'pr-15' }"
                                            @blur="
                                                if (formData.billingRule.power < 0)
                                                    formData.billingRule.power = 0;
                                            "
                                        >
                                            <template #trailing>
                                                <span class="text-muted-foreground text-sm">
                                                    {{ t("console-ai-provider.model.form.power") }}
                                                </span>
                                            </template>
                                        </UInput>
                                        <span>/</span>
                                        <UInput
                                            v-model.number="formData.billingRule.tokens"
                                            type="number"
                                            placeholder=""
                                            size="lg"
                                            :min="1"
                                            class="flex-1"
                                            :ui="{ base: 'pr-15' }"
                                            :disabled="true"
                                            @blur="
                                                if (formData.billingRule.tokens < 1)
                                                    formData.billingRule.tokens = 1;
                                            "
                                        >
                                            <template #trailing>
                                                <span class="text-muted-foreground text-sm">
                                                    Tokens
                                                </span>
                                            </template>
                                        </UInput>
                                    </div>
                                    <template #hint>
                                        <span class="text-muted-foreground text-xs">
                                            {{ t("console-ai-provider.model.form.billingHelp") }}
                                        </span>
                                    </template>
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧模型信息区域 -->
                <div class="shadow-default space-y-6 rounded-lg p-6 lg:col-span-2">
                    <!-- 模型基本信息 -->
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-lg font-semibold">
                                {{ t("console-ai-provider.model.form.basicInfoTitle") }}
                            </h3>
                            <p class="text-muted-foreground text-sm">
                                {{ t("console-ai-provider.model.form.basicInfoDescription") }}
                            </p>
                        </div>

                        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <!-- 模型名称 -->
                            <UFormField
                                :label="t('console-ai-provider.model.form.name')"
                                name="name"
                                required
                            >
                                <UInput
                                    v-model="formData.name"
                                    :placeholder="
                                        t('console-ai-provider.model.form.namePlaceholder')
                                    "
                                    size="lg"
                                    :maxlength="100"
                                    class="w-full"
                                />
                                <template #hint>
                                    <span class="text-muted-foreground text-xs">
                                        {{ t("console-ai-provider.model.form.nameHelp") }}
                                    </span>
                                </template>
                            </UFormField>

                            <!-- 模型标识符 -->
                            <UFormField
                                :label="t('console-ai-provider.model.form.model')"
                                name="model"
                                required
                            >
                                <UInput
                                    v-model="formData.model"
                                    :placeholder="
                                        t('console-ai-provider.model.form.modelPlaceholder')
                                    "
                                    size="lg"
                                    :maxlength="100"
                                    class="w-full"
                                />
                            </UFormField>
                        </div>
                        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <UFormField
                                :label="t('console-ai-provider.model.form.maxContext')"
                                name="maxContext"
                            >
                                <UInput
                                    v-model.number="formData.maxContext"
                                    type="number"
                                    :placeholder="
                                        t('console-ai-provider.model.form.maxContextPlaceholder')
                                    "
                                    size="lg"
                                    :min="1"
                                    :ui="{ root: 'w-full', base: 'pr-15' }"
                                >
                                    <template #trailing>
                                        <span class="text-muted-foreground text-sm">{{
                                            t("console-ai-provider.model.form.maxContextUnit")
                                        }}</span>
                                    </template>
                                </UInput>
                                <template #hint>
                                    <span class="text-muted-foreground text-xs">
                                        {{ t("console-ai-provider.model.form.maxContextHelp") }}
                                    </span>
                                </template>
                            </UFormField>
                            <!-- 模型类型 -->
                            <UFormField
                                :label="t('console-ai-provider.model.form.modelType')"
                                name="modelType"
                                required
                            >
                                <USelect
                                    v-model="formData.modelType"
                                    size="lg"
                                    :items="modelTypes"
                                    :placeholder="
                                        t('console-ai-provider.model.form.modelTypePlaceholder')
                                    "
                                    class="w-full"
                                />
                            </UFormField>
                        </div>

                        <!-- 模型描述 -->
                        <UFormField
                            :label="t('console-ai-provider.model.form.description')"
                            name="description"
                        >
                            <UTextarea
                                v-model="formData.description"
                                :placeholder="
                                    t('console-ai-provider.model.form.descriptionPlaceholder')
                                "
                                :maxlength="500"
                                :rows="4"
                                size="lg"
                                class="w-full"
                            />
                        </UFormField>

                        <div class="space-y-4">
                            <UAccordion
                                :items="[{}]"
                                :ui="{
                                    header: 'px-0 ',
                                    label: 'text-lg font-semibold',
                                    content: 'px-0',
                                    body: 'flex flex-col gap-2',
                                }"
                            >
                                {{ t("console-ai-provider.modelConfig.title") }}
                                <template #body>
                                    <template
                                        v-for="(config, index) in formData.modelConfig"
                                        :key="`${config.field}-${index}`"
                                    >
                                        <div class="rounded-lg border p-4">
                                            <!-- 参数标题和控制 -->
                                            <div
                                                class="mb-3 flex items-start justify-between gap-3"
                                            >
                                                <div class="min-w-0 flex-1">
                                                    <!-- 预设参数显示 -->
                                                    <div v-if="parameterRanges[config.field]">
                                                        <h4 class="text-sm font-medium">
                                                            {{ config.title }}
                                                        </h4>
                                                        <p
                                                            class="text-muted-foreground mt-1 text-xs"
                                                        >
                                                            {{ config.description }}
                                                        </p>
                                                    </div>
                                                    <!-- 自定义参数编辑 -->
                                                    <div v-else class="space-y-2">
                                                        <div class="grid grid-cols-1 gap-2">
                                                            <UInput
                                                                v-model="config.field"
                                                                :placeholder="
                                                                    t(
                                                                        'console-ai-provider.modelConfig.custom.fieldPlaceholder',
                                                                    )
                                                                "
                                                                :class="
                                                                    isFieldDuplicate(
                                                                        config.field,
                                                                        Number(index),
                                                                    )
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                "
                                                                :ui="{ root: 'w-full' }"
                                                            />
                                                            <UInput
                                                                v-model="config.title"
                                                                :placeholder="
                                                                    t(
                                                                        'console-ai-provider.modelConfig.custom.titlePlaceholder',
                                                                    )
                                                                "
                                                                :ui="{ root: 'w-full' }"
                                                            />
                                                            <UTextarea
                                                                v-model="config.description"
                                                                :placeholder="
                                                                    t(
                                                                        'console-ai-provider.modelConfig.custom.descriptionPlaceholder',
                                                                    )
                                                                "
                                                                :rows="2"
                                                                :ui="{ root: 'w-full' }"
                                                            />
                                                            <UInput
                                                                v-model="config.value"
                                                                :placeholder="
                                                                    t(
                                                                        'console-ai-provider.modelConfig.custom.valuePlaceholder',
                                                                    )
                                                                "
                                                                class="w-full"
                                                            />
                                                        </div>

                                                        <!-- 重复字段错误提示 -->
                                                        <p
                                                            v-if="
                                                                isFieldDuplicate(
                                                                    config.field,
                                                                    Number(index),
                                                                )
                                                            "
                                                            class="text-xs text-red-500"
                                                        >
                                                            {{
                                                                t(
                                                                    "console-ai-provider.modelConfig.validation.duplicateField",
                                                                )
                                                            }}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div class="flex items-center gap-2">
                                                    <USwitch v-model="config.enable" size="sm" />
                                                    <!-- 删除按钮 (仅自定义参数) -->
                                                    <UButton
                                                        v-if="!parameterRanges[config.field]"
                                                        color="error"
                                                        variant="ghost"
                                                        size="xs"
                                                        icon="i-lucide-trash-2"
                                                        @click="removeParameter(Number(index))"
                                                    />
                                                </div>
                                            </div>

                                            <div v-if="config.enable" class="pt-2">
                                                <!-- 预设参数 -->
                                                <template v-if="parameterRanges[config.field]">
                                                    <!-- 字符串类型参数：stop sequences -->
                                                    <UInput
                                                        v-if="config.field === 'stop'"
                                                        v-model="config.value"
                                                        :placeholder="
                                                            t(
                                                                'console-ai-provider.modelConfig.stop.placeholder',
                                                            )
                                                        "
                                                        size="sm"
                                                        class="w-full"
                                                    />

                                                    <UInput
                                                        v-else
                                                        v-model="config.value"
                                                        :placeholder="
                                                            t(
                                                                'console-ai-provider.modelConfig.stop.placeholder',
                                                            )
                                                        "
                                                        size="sm"
                                                        class="w-full"
                                                        type="number"
                                                    />
                                                </template>

                                                <!-- 自定义参数：使用普通输入框 -->
                                                <template v-else>
                                                    <UInput
                                                        v-model="config.value"
                                                        :placeholder="
                                                            t(
                                                                'console-ai-provider.modelConfig.custom.valuePlaceholder',
                                                            )
                                                        "
                                                        size="sm"
                                                        class="w-full"
                                                    />
                                                </template>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 添加参数按钮 -->
                                    <div class="flex justify-center pt-4">
                                        <UButton
                                            color="primary"
                                            variant="soft"
                                            size="sm"
                                            icon="i-lucide-plus"
                                            @click="addCustomParameter"
                                        >
                                            {{ t("console-ai-provider.modelConfig.addParameter") }}
                                        </UButton>
                                    </div>
                                </template>
                            </UAccordion>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部操作按钮 -->
            <div class="flex justify-end gap-4 pb-6">
                <UButton
                    color="neutral"
                    variant="outline"
                    size="lg"
                    @click="handleCancel"
                    class="px-8"
                >
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="neutral" size="lg" @click="resetForm" class="px-8">
                    {{ t("console-common.reset") }}
                </UButton>
                <UButton
                    color="primary"
                    size="lg"
                    :loading="isSubmitting"
                    type="submit"
                    class="px-8"
                >
                    {{ props.isEdit ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </div>
</template>
