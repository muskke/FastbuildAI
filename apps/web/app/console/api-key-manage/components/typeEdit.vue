<script setup lang="ts">
import { ProModal, ProUploader } from "@fastbuildai/ui";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { useI18n } from "vue-i18n";
import { array, number, object, string } from "yup";

import type { FieldConfig, KeyTemplateFormData, KeyTemplateRequest } from "@/models/key-templates";
import { getApiKeyTemplateDetail } from "@/services/console/api-key-type";

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    id?: string;
    isJsonImport?: boolean;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
    (e: "submit", data: KeyTemplateFormData, id?: string): void;
    (e: "json-submit", data: string): void;
}>();

const handleClose = () => {
    emits("close");
};

const formData = reactive<KeyTemplateFormData>({
    icon: "",
    name: "",
    isEnabled: 1,
    fieldConfig: [
        {
            name: "",
            type: "text",
            required: true,
            placeholder: "",
        },
    ],
    type: "",
});

const jsonFormData = reactive({
    jsonImport: "",
});

/**
 * 获取详情
 */
const fetchDetail = async () => {
    try {
        const data: KeyTemplateRequest = await getApiKeyTemplateDetail(props.id as string);
        Object.keys(formData).forEach((key) => {
            const typedKey = key as keyof typeof formData;
            const value = data[typedKey as keyof KeyTemplateRequest];
            if (value !== undefined) {
                // 检查值是否为对象且非空，或者是其他类型的值
                if (typeof value === "object" && value !== null) {
                    if (Object.keys(value).length > 0) {
                        formData[typedKey as keyof typeof formData] = value as never;
                    }
                } else {
                    // 处理原始类型（string, number, boolean等）
                    formData[typedKey as keyof typeof formData] = value as never;
                }
            }
        });
    } catch (error) {
        console.error("获取供应商详情失败:", error);
    }
};

/**
 * 校验触发状态
 */
const isValidationTriggered = ref(false);

/**
 * 表格列配置
 */
const columns = computed(() => [
    {
        accessorKey: "name",
        header: () =>
            h("span", [
                t("console-api-key.type.edit.fieldName"),
                h("span", { class: "text-error ml-1" }, "*"),
            ]),
    },
    {
        accessorKey: "type",
        header: () =>
            h("span", [
                t("console-api-key.type.edit.fieldType"),
                h("span", { class: "text-error ml-1" }, "*"),
            ]),
    },
    {
        accessorKey: "example",
        header: () =>
            h("span", [
                t("console-api-key.type.edit.fieldExample"),
                h("span", { class: "text-error ml-1" }, "*"),
            ]),
    },
    {
        accessorKey: "required",
        header: t("console-api-key.type.edit.fieldRequired"),
    },
    {
        accessorKey: "action",
        header: () => h("span", [t("console-api-key.type.edit.action")]),
    },
]);

// 单选框选项
const statusOptions = computed(() => [
    { label: t("console-api-key.type.edit.enable"), value: 1 },
    { label: t("console-api-key.type.edit.disable"), value: 0 },
]);

// 类型选项
const fieldTypeOptions = computed(() => [
    { label: t("console-api-key.type.edit.singleLineText"), value: "text" },
    { label: t("console-api-key.type.edit.number"), value: "number" },
    { label: t("console-api-key.type.edit.multiLineText"), value: "textarea" },
]);

/**
 * 添加新的配置
 */
const addField = () => {
    formData.fieldConfig.push({
        name: "",
        type: "text",
        required: true,
        placeholder: "",
    });
};

/**
 * 检查是否需要自动添加新行
 */
const checkAutoAddRow = () => {
    const list = formData.fieldConfig ? formData.fieldConfig : [];
    const lastRow = list[list.length - 1];

    // 如果最后一行有任何值，且不是全部为空，则自动添加新行
    const lastHasValue = !!((lastRow?.name ?? "").trim() || (lastRow?.placeholder ?? "").trim());
    if (lastHasValue) {
        const hasEmptyRow = list.some(
            (field: any) => !(field?.name ?? "").trim() && !(field?.placeholder ?? "").trim(),
        );
        if (!hasEmptyRow) {
            addField();
        }
    }
};

/**
 * 删除配置
 * @param index - 要删除的配置索引
 */
const removeField = (index: number) => {
    formData.fieldConfig.splice(index, 1);
};

/**
 * 检查字段是否有错误
 * @param field - 字段对象
 * @param fieldName - 字段名称
 * @returns 是否有错误
 */
const hasFieldError = (field: any, fieldName: string) => {
    if (!isValidationTriggered.value) return false;

    if (fieldName === "name") {
        return !(field?.name ?? "").trim();
    }
    if (fieldName === "type") {
        return !field.type;
    }
    if (fieldName === "placeholder") {
        return !(field?.placeholder ?? "").trim();
    }
    return false;
};

const rowSchema = object({
    name: string().trim().required("请输入字段名称"),
    type: string().trim().required("请选择字段类型"),
    placeholder: string().trim().required("请输入字段占位符"),
});

/**
 * 校验规则
 */
const schema = computed(() => {
    return object({
        icon: string().trim().required("请上传图标"),
        name: string().trim().required("请输入类型名称"),
        isEnabled: number().required("请选择类型状态"),
        fieldConfig: array()
            .transform((list) => {
                if (!Array.isArray(list) || list.length === 0) return list;
                const last = list[list.length - 1];
                // 占位行判定：只要 name 和 placeholder 都为空，就视为占位行（忽略 type 的默认值）
                const isPlaceholder = !last?.name?.trim() && !last?.placeholder?.trim();
                return isPlaceholder && list.length > 1 ? list.slice(0, -1) : list;
            })
            .of(rowSchema),
    });
});

// JSON导入表单验证规则
const jsonImportSchema = object({
    jsonImport: string()
        .required("请输入JSON数据")
        .test("is-valid-json", "请输入有效的JSON数据", (value) => {
            if (!value) return false;
            try {
                JSON.parse(value);
                return true;
            } catch (e) {
                return false;
            }
        }),
});

const jsonSubmitForm = () => {
    emits("json-submit", jsonFormData.jsonImport);
};

// JSON导入示例
const correctJson = `{
    "name":"API密钥模板",
    "icon":"path/to/icon.png",
    "fieldConfig":[
        {
            "name":"apiKey",
            "type":"text",
            "required":true,
            "placeholder":"请输入API密钥"
        },
        {
            "name":"secretKey",
            "type":"text",
            "required":true,
            "placeholder":"请输入密钥"
        }
    ]
}`;

/**
 * 复制JSON
 */
const copyJson = () => {
    navigator.clipboard.writeText(correctJson);
    toast.success(t("console-api-key.type.edit.copySuccess"));
};

/**
 * 处理表单提交
 */
const handleSubmit = () => {
    const { type, ...newformData } = formData;
    emits("submit", newformData, props.id);
};

onMounted(async () => {
    if (props.id) {
        await fetchDetail();
        addField();
    }
});
</script>
<template>
    <ProModal
        :model-value="true"
        :title="props.id ? t('console-api-key.type.edit.title') : t('console-api-key.type.addType')"
        :ui="{
            content: 'max-w-3xl overflow-y-auto h-fit',
        }"
        @update:model-value="(value) => !value && handleClose()"
    >
        <UForm
            v-if="!isJsonImport"
            :state="formData"
            :schema="schema"
            class="space-y-4"
            :disabled="formData.type === 'system'"
            @submit="handleSubmit"
        >
            <div class="grid grid-cols-2 items-center gap-4">
                <UFormField :label="t('console-api-key.type.edit.icon')" name="icon" required>
                    <ProUploader
                        v-model="formData.icon"
                        class="h-32 w-32"
                        text="上传图标"
                        icon="i-lucide-upload"
                        accept=".jpg,.png,.svg,.ico"
                        :maxCount="1"
                        :single="true"
                        :multiple="false"
                    />
                </UFormField>
                <div class="flex h-full flex-col justify-around">
                    <UFormField :label="t('console-api-key.type.edit.name')" name="name" required>
                        <UInput
                            v-model="formData.name"
                            class="w-full"
                            :placeholder="t('console-api-key.type.edit.nameRequired')"
                            :highlight="hasFieldError(formData, 'name')"
                        />
                    </UFormField>

                    <UFormField :label="t('console-api-key.type.edit.status')" name="isActive">
                        <URadioGroup
                            v-model="formData.isEnabled"
                            :items="statusOptions"
                            orientation="horizontal"
                            color="primary"
                        />
                    </UFormField>
                </div>
            </div>

            <!-- 配置表格 -->
            <div class="mt-6">
                <div class="flex items-center justify-between pb-2">
                    <div class="text-default block text-sm font-medium">
                        {{ t("console-api-key.type.edit.customField") }}
                    </div>
                    <!-- <UButton
                        color="primary"
                        variant="outline"
                        icon="i-tabler-plus"
                        size="sm"
                        @click="addField"
                    >
                        {{ t("console-api-key.type.edit.add") }}
                    </UButton> -->
                </div>
                <UTable
                    :columns="columns"
                    :data="formData.fieldConfig"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default px-2',
                        tr: '[&:has(>td[colspan])]:hidden',
                    }"
                >
                    <template #name-cell="{ row }">
                        <UFormField :name="`fieldConfig.${row.index}.name`" required>
                            <UInput
                                v-model="row.original.name"
                                :placeholder="t('console-api-key.type.edit.nameRequired')"
                                :highlight="hasFieldError(row.original, 'name')"
                                variant="subtle"
                                :ui="{
                                    base: 'border-0 ring-0 ring-inset outline-none bg-transparent hover:ring-1 hover:ring-primary focus:ring-1 focus:ring-primary dark:hover:ring-primary dark:focus:ring-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition-colors duration-200',
                                }"
                                @update:model-value="checkAutoAddRow"
                            />
                        </UFormField>
                    </template>
                    <template #type-cell="{ row }">
                        <UFormField :name="`fieldConfig.${row.index}.type`" required>
                            <USelect
                                v-model="row.original.type"
                                :items="fieldTypeOptions"
                                :placeholder="t('console-api-key.type.edit.typeValueRequired')"
                                :highlight="hasFieldError(row.original, 'type')"
                                variant="subtle"
                                :ui="{
                                    base: 'border-0 ring-0 ring-inset outline-none bg-transparent hover:ring-1 hover:ring-primary focus:ring-1 focus:ring-primary dark:hover:ring-primary dark:focus:ring-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition-colors duration-200',
                                }"
                            />
                        </UFormField>
                    </template>
                    <template #example-cell="{ row }">
                        <UFormField :name="`fieldConfig.${row.index}.placeholder`" required>
                            <UInput
                                v-model="row.original.placeholder"
                                :placeholder="t('console-api-key.type.edit.exampleRequired')"
                                :highlight="hasFieldError(row.original, 'example')"
                                variant="subtle"
                                :ui="{
                                    base: 'border-0 ring-0 ring-inset outline-none bg-transparent hover:ring-1 hover:ring-primary focus:ring-1 focus:ring-primary dark:hover:ring-primary dark:focus:ring-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition-colors duration-200',
                                }"
                                @update:model-value="checkAutoAddRow"
                            />
                        </UFormField>
                    </template>
                    <template #required-cell="{ row }">
                        <UFormField
                            :name="`fieldConfig.${row.index}.required`"
                            class="px-3"
                            required
                        >
                            <USwitch v-model="row.original.required" />
                        </UFormField>
                    </template>
                    <template #action-cell="{ row }">
                        <UButton
                            v-if="row.index !== formData.fieldConfig.length - 1"
                            class="cursor-pointer px-3"
                            icon="i-tabler-trash"
                            color="error"
                            variant="ghost"
                            @click="removeField(row.index)"
                        />
                    </template>
                </UTable>
            </div>

            <!-- 底部按钮 -->
            <div class="mt-6 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" @click="handleClose">{{
                    t("console-api-key.cancel")
                }}</UButton>
                <UButton :disabled="formData.type === 'system'" color="primary" type="submit">
                    {{ t("console-api-key.save") }}
                </UButton>
            </div>
        </UForm>

        <!-- JSON导入 -->
        <UForm v-else :state="jsonFormData" :schema="jsonImportSchema" @submit="jsonSubmitForm">
            <div class="pb-2">
                <UFormField
                    :label="t('console-ai-mcp-server.form.jsonImport')"
                    name="jsonImport"
                    required
                >
                    <UTextarea
                        v-model="jsonFormData.jsonImport"
                        :placeholder="t('console-ai-mcp-server.form.jsonImportPlaceholder')"
                        :rows="22"
                        :ui="{ root: 'w-full' }"
                    />
                    <template #hint>
                        <UPopover mode="hover" :open-delay="1500" :close-delay="0">
                            <UButton
                                variant="link"
                                class="text-primary cursor-pointer text-xs"
                                @click="copyJson"
                            >
                                {{ t("console-api-key.type.edit.copyTemplate") }}
                            </UButton>
                            <template #content>
                                <div class="flex flex-col gap-4 p-4">
                                    <div class="flex flex-col">
                                        <div class="flex max-w-120 flex-col items-start gap-2">
                                            <pre
                                                class="bg-muted w-full overflow-x-auto rounded-lg p-4 text-sm"
                                            ><code>{{ correctJson }}</code></pre>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </UPopover>
                    </template>
                </UFormField>
            </div>
            <!-- 操作按钮 -->
            <div class="bottom-0 z-10 flex justify-end gap-2 py-4">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit">
                    {{ t("console-api-key.save") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
