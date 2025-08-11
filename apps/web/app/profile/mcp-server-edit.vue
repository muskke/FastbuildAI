<script setup lang="ts">
import { ProModal, ProSlider, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { tr } from "@nuxt/ui/runtime/locale/index.js";
import { computed, onMounted, reactive, ref } from "vue";
import { object, string } from "yup";

import type { McpServerCreateParams, McpServerInfo } from "@/models/web-mcp-server";
import {
    apiBatchCheckMcpServerConnect,
    apiCheckMcpServerConnect,
    apiCreateMcpServer,
    apiGetMcpServerDetail,
    apiGetSystemMcpServerDetail,
    apiJsonImportMcpServers,
    apiUpdateMcpServer,
} from "@/services/web/mcp-server";

const toast = useMessage();
const route = useRoute();

const props = defineProps<{
    id?: string | null;
    isView?: boolean;
    isJsonImport?: boolean;
    isSystemMcp?: boolean;
}>();
const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

// 获取ID从query参数或props
const mcpServerId = computed(() => props.id || (route.query.id as string) || null);

// 获取国际化函数
const { t } = useI18n();

const formData = reactive<McpServerCreateParams>({
    name: "",
    providerName: "",
    providerUrl: "",
    description: "",
    icon: "",
    url: "",
    timeout: 60,
});

const isSystem = ref(false);

const jsonFormData = reactive({
    jsonImport: "",
});

// 表单验证规则
const providerSchema = object({
    name: string().required(t("console-ai-mcp-server.form.name")),
    url: string()
        .required(t("console-ai-mcp-server.form.baseUrlPlaceholder"))
        .test("is-valid-url", t("console-ai-mcp-server.form.baseUrlPlaceholder"), (value) => {
            if (!value) return false;
            // 允许本地地址（localhost或127.0.0.1开头的URL）
            if (
                /^(https?\:\/\/)?[\w\d\-]+(\.[\w\d\-]+)+([\w\d\-.,@?^=%&:/~+#]*[\w\d=#])?$/.test(
                    value,
                )
            ) {
                return true;
            }
            // 其他URL使用标准URL验证
            try {
                new URL(value);
                return true;
            } catch (e) {
                return false;
            }
        }),
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

// 获取MCP详情
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        let data: McpServerInfo;

        if (props.isSystemMcp) {
            data = await apiGetSystemMcpServerDetail(mcpServerId.value as string);
        } else {
            data = await apiGetMcpServerDetail(mcpServerId.value as string);
        }
        if (data.type === "system") {
            isSystem.value = true;
        } else {
            isSystem.value = false;
        }
        Object.keys(formData).forEach((key) => {
            const typedKey = key as keyof typeof formData;
            const value = data[typedKey as keyof McpServerInfo];
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
        toast.error("获取供应商详情失败");
    }
});

// 提交表单
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    const { ...obj } = formData;
    const newFormData: Omit<McpServerCreateParams, "args"> & { args?: Record<string, unknown> } = {
        ...obj,
    };

    try {
        let id = "";
        if (mcpServerId.value) {
            const res = await apiUpdateMcpServer(mcpServerId.value, newFormData);
            id = res.id;
            toast.success("MCP服务器更新成功");
        } else {
            const res = await apiCreateMcpServer(newFormData);
            id = res.id;
            toast.success("MCP服务器创建成功");
        }
        try {
            await apiCheckMcpServerConnect(id);
        } catch (error) {
            console.error("连接测试失败:", error);
        }
        emits("close", true);
    } catch (error) {
        console.error("提交失败:", error);
    }
});

// JSON导入提交表单
const { lockFn: jsonSubmitForm, isLock: jsonIsLock } = useLockFn(async () => {
    try {
        const response = await apiJsonImportMcpServers(jsonFormData.jsonImport || "");
        toast.success("MCP服务器导入成功");

        try {
            await apiBatchCheckMcpServerConnect(
                response.results.map((association) => association.id),
            );
        } catch (error) {
            console.error("连接测试失败:", error);
        }
        emits("close", true);
    } catch (error) {
        console.error("JSON导入失败:", error);
        toast.error("MCP服务器导入失败");
    }
});

const handleClose = () => {
    emits("close");
};

onMounted(async () => mcpServerId.value && (await fetchDetail()));
</script>

<template>
    <ProModal
        :model-value="true"
        :title="
            isView && mcpServerId
                ? t('console-ai-mcp-server.detailTitle')
                : mcpServerId
                  ? t('console-ai-mcp-server.editTitle')
                  : t('console-ai-mcp-server.addTitle')
        "
        :description="
            isView && mcpServerId
                ? t('console-ai-mcp-server.detailTitle')
                : mcpServerId
                  ? t('console-ai-mcp-server.editTitle')
                  : t('console-ai-mcp-server.addTitle')
        "
        :ui="{
            content: 'max-w-2xl overflow-y-auto h-fit',
        }"
        @update:model-value="(value) => !value && handleClose()"
    >
        <div v-if="detailLoading" class="flex items-center justify-center" style="height: 400px">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>

        <UForm
            v-else-if="!isJsonImport"
            :state="formData"
            :schema="providerSchema"
            :disabled="isView"
            @submit="submitForm"
        >
            <!-- 基本信息 -->
            <div class="pb-2">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField :label="t('console-ai-mcp-server.form.icon')" name="iconUrl">
                        <ProUploader
                            v-model="formData.icon"
                            class="h-24 w-24"
                            text="上传图标"
                            icon="i-lucide-upload"
                            accept=".jpg,.png,.svg,.ico"
                            :maxCount="1"
                            :single="true"
                            :multiple="false"
                            :disabled="isSystem"
                        />
                    </UFormField>

                    <div class="space-y-4">
                        <UFormField
                            :label="t('console-ai-mcp-server.form.name')"
                            name="name"
                            required
                        >
                            <UInput
                                v-model="formData.name"
                                :disabled="isSystem"
                                :placeholder="t('console-ai-mcp-server.form.name')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>
                        <UFormField
                            :label="t('console-ai-mcp-server.form.baseUrl')"
                            name="url"
                            required
                        >
                            <UTextarea
                                v-model="formData.url"
                                :rows="1"
                                autoresize
                                :disabled="isSystem"
                                :placeholder="t('console-ai-mcp-server.form.url')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>
                    </div>
                </div>
            </div>

            <!-- 描述 -->
            <div class="pb-2">
                <UFormField :label="t('console-ai-mcp-server.form.description')" name="description">
                    <UTextarea
                        v-model="formData.description"
                        :disabled="isSystem"
                        :placeholder="t('console-ai-mcp-server.form.descriptionPlaceholder')"
                        :rows="3"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>
            <UAccordion
                :items="[{}]"
                :ui="{
                    header: 'px-0 ',
                    label: 'text-lg font-semibold',
                    content: 'px-0',
                    body: 'flex flex-col gap-2',
                }"
            >
                <div class="flex items-center gap-2 text-base">
                    <Icon name="lucide:settings-2" />
                    {{ t("console-ai-mcp-server.form.advancedArgs") }}
                </div>
                <template #body>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <UFormField
                            :label="t('console-ai-mcp-server.form.providerName')"
                            name="providerName"
                        >
                            <UInput
                                v-model="formData.providerName"
                                :disabled="isSystem"
                                :placeholder="t('console-ai-mcp-server.form.providerName')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>

                        <UFormField
                            :label="t('console-ai-mcp-server.form.providerUrl')"
                            name="providerUrl"
                        >
                            <UInput
                                v-model="formData.providerUrl"
                                :disabled="isSystem"
                                :placeholder="t('console-ai-mcp-server.form.providerUrl')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>

                        <UFormField :label="t('console-ai-mcp-server.form.timeOut')" name="timeout">
                            <UInput
                                v-model="formData.timeout"
                                type="number"
                                :placeholder="t('console-ai-mcp-server.form.timeOut')"
                                :ui="{ root: 'w-full' }"
                            />
                        </UFormField>
                    </div>
                </template>
            </UAccordion>

            <!-- 操作按钮 -->
            <div class="bottom-0 z-10 flex justify-end gap-2 py-4" v-show="!isView">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit" :loading="isLock">
                    {{ mcpServerId ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
        <UForm
            v-else
            :state="jsonFormData"
            :schema="jsonImportSchema"
            :disabled="isView"
            @submit="jsonSubmitForm"
        >
            <!-- json导入 -->
            <div class="pb-2">
                <UFormField
                    :label="t('console-ai-mcp-server.form.jsonImport')"
                    name="jsonImport"
                    required
                >
                    <UTextarea
                        v-model="jsonFormData.jsonImport"
                        :placeholder="t('console-ai-mcp-server.form.jsonImportPlaceholder')"
                        :rows="13"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 操作按钮 -->
            <div class="bottom-0 z-10 flex justify-end gap-2 py-4" v-show="!isView">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit" :loading="isLock">
                    {{ mcpServerId ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
