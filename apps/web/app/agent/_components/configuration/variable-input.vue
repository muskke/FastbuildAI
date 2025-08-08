<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui";
import { object, string } from "yup";

import type { FormFieldConfig } from "@/models/agent";

interface Props {
    /** 是否显示抽屉 */
    modelValue: boolean;
    /** 表单字段配置 */
    formFields: FormFieldConfig[];
    /** 表单字段输入 */
    inputs: Record<string, any>;
}

interface Emits {
    /** 更新显示状态 */
    (e: "update:modelValue", value: boolean): void;
    /** 提交表单数据 */
    (e: "update:inputs", value: Record<string, any>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const open = useVModel(props, "modelValue", emit);
const inputs = useVModel(props, "inputs", emit);

// 动态生成表单验证规则
const formSchema = computed(() => {
    const schema: Record<string, any> = {};

    props.formFields.forEach((field) => {
        let fieldSchema = string();

        if (field.required) {
            fieldSchema = fieldSchema.required(`${field.label}不能为空`);
        }

        schema[field.name] = fieldSchema;
    });

    return object(schema);
});
</script>

<template>
    <UDrawer
        v-model:open="open"
        :set-background-color-on-scale="false"
        direction="right"
        should-scale-background
        :handle-only="true"
    >
        <template #content>
            <div class="py-6 pr-6">
                <div class="mb-6">
                    <h2 class="text-foreground text-lg font-semibold">填写表单</h2>
                    <p class="text-muted-foreground mt-1 text-sm">
                        请填写以下表单信息，这些信息将用于角色设定中的变量替换
                    </p>
                </div>

                <UForm :state="inputs" :schema="formSchema" class="space-y-4">
                    <!-- 动态渲染表单字段 -->
                    <template v-for="field in formFields" :key="field.name">
                        <!-- 文本输入 -->
                        <UFormField
                            v-if="field.type === 'text'"
                            :label="field.label"
                            :name="field.name"
                            :required="field.required"
                        >
                            <UInput
                                v-model="inputs[field.name]"
                                :placeholder="`请输入${field.label}`"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>

                        <!-- 多行文本 -->
                        <UFormField
                            v-else-if="field.type === 'textarea'"
                            :label="field.label"
                            :name="field.name"
                            :required="field.required"
                        >
                            <UTextarea
                                v-model="inputs[field.name]"
                                :placeholder="`请输入${field.label}`"
                                :ui="{ root: 'w-full' }"
                                :rows="4"
                            />
                        </UFormField>

                        <!-- 下拉选择 -->
                        <UFormField
                            v-else-if="field.type === 'select'"
                            :label="field.label"
                            :name="field.name"
                            :required="field.required"
                        >
                            <USelect
                                v-model="inputs[field.name]"
                                :items="field.options"
                                :placeholder="`请选择${field.label}`"
                                :ui="{ base: 'w-full' }"
                            />
                        </UFormField>
                    </template>
                </UForm>
            </div>
        </template>
    </UDrawer>
</template>
