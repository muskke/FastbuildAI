<script setup lang="ts">
import { ProModal } from "@fastbuildai/ui";
import { useI18n } from "vue-i18n";
import { object, type ObjectSchema, string } from "yup";

import type { KeyConfigRequest } from "@/models/api-key-list";
import type { FieldConfig } from "@/models/key-templates";
import { getApiKeyDetail } from "@/services/console/api-key-list";
import { getApiKeyTemplateDetail, getApiKeyTemplateListAll } from "@/services/console/api-key-type";

const { t } = useI18n();

const props = defineProps<{
    id?: string;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
    (e: "submit", formData: KeyConfigRequest, id?: string): void;
}>();

const handleClose = () => {
    emits("close");
};

interface TypeOption {
    label: string;
    value: string;
}

const typeOptions = ref<TypeOption[]>([]);

const customFieldOptions = ref<FieldConfig[]>([]);

const formData = reactive<KeyConfigRequest>({
    name: "",
    templateId: undefined,
    fieldValues: [],
    remark: "",
    status: 1,
    sortOrder: 0,
});

/**
 * 初始化动态字段数据
 */
const initDynamicFields = () => {
    if (customFieldOptions.value && customFieldOptions.value.length > 0) {
        customFieldOptions.value.forEach((field) => {
            if (field.name) {
                // 动态添加字段到formData，如果字段不存在才初始化为空字符串
                if (!(field.name in formData)) {
                    formData[field.name] = "";
                }
            }
        });
    }
};

// 获取详情
const fetchDetail = async () => {
    try {
        const data: KeyConfigRequest = await getApiKeyDetail(props.id as string);

        // 填充基础字段
        formData.name = data.name || "";
        formData.templateId = data.templateId;
        formData.remark = data.remark || "";
        formData.status = data.status || 1;
        formData.sortOrder = data.sortOrder || 0;

        // 处理动态字段值
        if (data.fieldValues && Array.isArray(data.fieldValues)) {
            data.fieldValues.forEach((field) => {
                if (field.name && field.value !== undefined) {
                    // 将动态字段值赋值到formData对象上
                    (formData as any)[field.name] = field.value;
                }
            });
        }
    } catch (error) {
        console.error("获取API密钥详情失败:", error);
    }
};

// 初始化动态字段
initDynamicFields();

/**
 * 表单验证规则
 */
const schema = computed((): ObjectSchema<any> => {
    // 基础schema定义
    const baseSchema: Record<string, any> = {
        keyName: string().trim().required(t("console-user.form.nameRequired")),
        typeValue: string().trim().required(t("console-user.form.typeValueRequired")),
        remark: string(), // 备注字段可选
    };

    // 动态添加自定义字段的验证规则
    if (customFieldOptions.value && customFieldOptions.value.length > 0) {
        customFieldOptions.value.forEach((field, index) => {
            if (!field.required) return;
            // 使用字段名作为验证键，如果重复则添加索引
            const fieldKey = field.name || `customField_${index}`;

            baseSchema[fieldKey] = string().required(
                t("console-api-key.list.edit.fieldRequired") + field.name,
            );
        });
    }

    return object(baseSchema);
});

// 获取所有启用的模板
const getEnabledTemplates = async () => {
    const res = await getApiKeyTemplateListAll();
    res.forEach((item) => {
        typeOptions.value.push({
            label: item.name,
            value: item.id!,
        });
    });
    if (!props.id) {
        formData.templateId = typeOptions.value[0]?.value;
    } else {
        console.log(formData.templateId);
    }

    if (formData.templateId) {
        handleTypeChange(formData.templateId);
    }
};

/**
 * 处理密钥类型变化
 */
const handleTypeChange = async (value: string) => {
    const res = await getApiKeyTemplateDetail(value);
    customFieldOptions.value = res.fieldConfig;
    // 重新初始化动态字段
    initDynamicFields();
};

const handleSubmit = () => {
    // 确保包含所有自定义字段，即使值为空
    const dynamicFieldValues = customFieldOptions.value.map((field) => {
        return {
            name: field.name!,
            value: String(formData[field.name!] || ""),
        };
    });

    if (props.id) {
        const newFormData = {
            name: formData.name,
            remark: formData.remark,
            status: formData.status,
            sortOrder: formData.sortOrder,
            fieldValues: dynamicFieldValues,
        };
        emits("submit", newFormData, props.id);
    } else {
        const newFormData = {
            name: formData.name,
            templateId: formData.templateId,
            remark: formData.remark,
            status: formData.status,
            sortOrder: formData.sortOrder,
            fieldValues: dynamicFieldValues,
        };
        emits("submit", newFormData);
    }
};

onMounted(async () => {
    if (props.id) {
        await fetchDetail();
    }
    await getEnabledTemplates();
    await handleTypeChange(formData.templateId || "");
});
</script>
<template>
    <ProModal
        :model-value="true"
        :title="props.id ? t('console-api-key.list.edit.title') : t('console-api-key.list.add')"
        :ui="{
            content: 'max-w-2xl overflow-y-auto h-fit',
        }"
        @update:model-value="(value: boolean) => !value && handleClose()"
    >
        <UForm :state="formData" :schema="schema" class="space-y-4" @submit="handleSubmit">
            <div class="grid grid-cols-2 items-center gap-4">
                <UFormField :label="t('console-api-key.list.edit.name')" name="name" required>
                    <UInput
                        v-model="formData.name"
                        :placeholder="t('console-api-key.list.edit.nameRequired')"
                        class="w-full"
                    />
                </UFormField>
                <UFormField
                    :label="t('console-api-key.list.edit.keyType')"
                    name="templateId"
                    required
                >
                    <USelect
                        :disabled="!!props.id"
                        v-model="formData.templateId"
                        :items="typeOptions"
                        :placeholder="t('console-api-key.list.edit.keyTypeRequired')"
                        class="w-full"
                        @update:model-value="handleTypeChange"
                    />
                </UFormField>
            </div>
            <UFormField
                v-for="item in customFieldOptions"
                :key="item.name"
                :label="item.name"
                :name="item.name"
                :required="item.required"
            >
                <UInput
                    v-if="item.type === 'number'"
                    v-model="formData[item.name]"
                    type="number"
                    :placeholder="item.placeholder"
                    class="w-full"
                />
                <UInput
                    v-else-if="item.type === 'text'"
                    v-model="formData[item.name]"
                    :placeholder="item.placeholder"
                    class="w-full"
                />
                <UTextarea
                    v-else
                    v-model="formData[item.name]"
                    :placeholder="item.placeholder"
                    class="w-full"
                />
            </UFormField>
            <UFormField :label="t('console-api-key.list.edit.remark')" name="remark">
                <UTextarea
                    v-model="formData.remark"
                    :placeholder="t('console-api-key.list.edit.remarkRequired')"
                    class="w-full"
                />
            </UFormField>
            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" @click="handleClose">{{
                    t("console-api-key.cancel")
                }}</UButton>
                <UButton color="primary" type="submit" @click="handleSubmit">{{
                    t("console-api-key.save")
                }}</UButton>
            </div>
        </UForm>
    </ProModal>
</template>
