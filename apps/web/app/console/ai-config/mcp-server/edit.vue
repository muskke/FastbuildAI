<script setup lang="ts">
import { ProModal, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive } from "vue";
import { object, string } from "yup";

import type { CreateMcpServerRequest, McpServerDetail } from "@/models/mcp-server";
import {
    apiCheckMcpServerConnect,
    apiCreateMcpServer,
    apiGetMcpServerDetail,
    apiJsonImportMcpServers,
    apiUpdateMcpServer,
} from "@/services/console/mcp-server";

const toast = useMessage();
const route = useRoute();

const props = defineProps<{
    id?: string | null;
    isJsonImport?: boolean;
}>();
const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
    (e: "change-update", ids: string[]): void;
}>();

// 获取ID从query参数或props
const mcpServerId = computed(() => props.id || (route.query.id as string) || null);

// 获取国际化函数
const { t } = useI18n();

const formData = reactive<CreateMcpServerRequest>({
    name: "",
    providerName: "",
    description: "",
    icon: "",
    isDisabled: false,
    url: "",
    sortOrder: 0,
    timeout: 60,
    isQuickMenu: false,
    alias: "",
    providerUrl: "",
});

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
                /^(https?:\/\/)?[\w\d-]+(\.[\w\d-]+)+([\w\d\-.,@?^=%&:/~+#]*[\w\d=#])?$/.test(value)
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

// 获取供应商详情
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        const data: McpServerDetail = await apiGetMcpServerDetail(mcpServerId.value as string);
        Object.keys(formData).forEach((key) => {
            const typedKey = key as keyof typeof formData;
            const value = data[typedKey as keyof McpServerDetail];
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
    const newFormData: Omit<CreateMcpServerRequest, "args"> & { args?: Record<string, unknown> } = {
        ...obj,
    };

    try {
        let id = "";
        if (mcpServerId.value) {
            const res = await apiUpdateMcpServer(mcpServerId.value, newFormData);
            id = res.id;
            emits("change-update", [id]);
            toast.success(t("console-ai-mcp-server.updateSuccess"));
        } else {
            const res = await apiCreateMcpServer(newFormData);
            id = res.id;
            emits("change-update", [id]);
            toast.success(t("console-ai-mcp-server.createSuccess"));
        }
        emits("close", true);
    } catch (error) {
        console.error("提交失败:", error);
    }
});

// JSON导入提交表单
const { lockFn: jsonSubmitForm, isLock: jsonIsLock } = useLockFn(async () => {
    try {
        const res = await apiJsonImportMcpServers(jsonFormData.jsonImport || "");
        toast.success(
            `${t("console-ai-mcp-server.jsonImportTotal")} ${res.total} ${t(
                "console-ai-mcp-server.jsonImportUnit",
            )}，
            ${t("console-ai-mcp-server.jsonImportCreated")} ${res.created} ${t(
                "console-ai-mcp-server.jsonImportUnit",
            )}，
            ${t("console-ai-mcp-server.jsonImportUpdated")} ${res.updated} ${t(
                "console-ai-mcp-server.jsonImportUnit",
            )}`,
        );
        const ids = res.results.map((item) => item.id);
        emits("change-update", ids);
        emits("close", true);
    } catch (error) {
        console.error("JSON导入失败:", error);
    }
});

const handleClose = () => {
    emits("close");
};

const correctJson = `{
    "mcpServers": {
        "Your MCP Server Name": {
            "url": "xxxxx",
            ...
        }
    }
}`;

onMounted(async () => mcpServerId.value && (await fetchDetail()));
</script>

<template>
    <ProModal
        :model-value="true"
        :title="
            mcpServerId ? t('console-ai-mcp-server.editTitle') : t('console-ai-mcp-server.addTitle')
        "
        :description="
            mcpServerId ? t('console-ai-mcp-server.editTitle') : t('console-ai-mcp-server.addTitle')
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
            @submit="submitForm"
        >
            <!-- 基本信息 -->
            <div class="flex flex-col gap-4 pb-2">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField :label="t('console-ai-mcp-server.form.name')" name="name" required>
                        <UInput
                            v-model="formData.name"
                            :placeholder="t('console-ai-mcp-server.form.name')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>
                    <UFormField :label="t('console-ai-mcp-server.form.alias')" name="alias">
                        <UInput
                            v-model="formData.alias"
                            :placeholder="t('console-ai-mcp-server.form.alias')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>
                </div>
                <UFormField
                    :label="t('console-ai-mcp-server.form.baseUrl')"
                    name="url"
                    required
                    :description="t('console-ai-mcp-server.form.baseUrlTips')"
                >
                    <UTextarea
                        v-model="formData.url"
                        :placeholder="t('console-ai-mcp-server.form.baseUrlPlaceholder')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                        :label="t('console-ai-mcp-server.form.providerName')"
                        name="providerName"
                    >
                        <UInput
                            v-model="formData.providerName"
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
                            :placeholder="t('console-ai-mcp-server.form.providerUrl')"
                            :ui="{ root: 'w-full' }"
                        />
                    </UFormField>
                </div>
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
                        />
                    </UFormField>

                    <div class="space-y-4">
                        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <UFormField
                                :label="t('console-ai-mcp-server.form.isDisabled')"
                                name="isDisabled"
                            >
                                <USwitch
                                    :model-value="!formData.isDisabled"
                                    @update:model-value="(val) => (formData.isDisabled = !val)"
                                    unchecked-icon="i-lucide-x"
                                    checked-icon="i-lucide-check"
                                    size="lg"
                                    :label="
                                        !formData.isDisabled
                                            ? t('console-ai-mcp-server.form.isActiveEnabled')
                                            : t('console-ai-mcp-server.form.isActiveDisabled')
                                    "
                                />
                            </UFormField>
                            <UFormField
                                :label="t('console-ai-mcp-server.form.isQuickMenu')"
                                name="isQuickMenu"
                            >
                                <USwitch
                                    :model-value="formData.isQuickMenu"
                                    @update:model-value="(val) => (formData.isQuickMenu = val)"
                                    unchecked-icon="i-lucide-x"
                                    checked-icon="i-lucide-check"
                                    size="lg"
                                />
                            </UFormField>
                        </div>
                        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <UFormField
                                :label="t('console-ai-mcp-server.form.sortOrder')"
                                name="sortOrder"
                            >
                                <UInput
                                    v-model="formData.sortOrder"
                                    type="number"
                                    :placeholder="t('console-ai-mcp-server.form.sortOrder')"
                                    :ui="{ root: 'w-full' }"
                                />
                            </UFormField>
                            <UFormField
                                :label="t('console-ai-mcp-server.form.timeOut')"
                                name="timeout"
                            >
                                <UInput
                                    v-model="formData.timeout"
                                    type="number"
                                    :placeholder="t('console-ai-mcp-server.form.timeOut')"
                                    :ui="{ root: 'w-full' }"
                                />
                            </UFormField>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 描述 -->
            <div class="py-4">
                <UFormField :label="t('console-ai-mcp-server.form.description')" name="description">
                    <UTextarea
                        v-model="formData.description"
                        :placeholder="t('console-ai-mcp-server.form.descriptionPlaceholder')"
                        :rows="3"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <!-- 操作按钮 -->
            <div class="bottom-0 z-10 flex justify-end gap-2 py-4">
                <UButton color="neutral" variant="soft" size="lg" @click="handleClose">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" size="lg" type="submit" :loading="isLock">
                    {{ mcpServerId ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
        <UForm v-else :state="jsonFormData" :schema="jsonImportSchema" @submit="jsonSubmitForm">
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
                    <template #hint>
                        <UPopover mode="click" :open-delay="0" :close-delay="0">
                            <UButton variant="link" class="text-primary cursor-pointer text-xs">
                                {{ t("console-ai-mcp-server.jsonImportExample") }}
                            </UButton>
                            <template #content>
                                <div class="flex flex-col gap-4 p-4">
                                    <div class="flex flex-col">
                                        <div class="flex max-w-78 flex-col items-start gap-2">
                                            <div
                                                class="flex items-start gap-1 rounded-lg bg-blue-50 p-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                            >
                                                <UIcon size="20" name="i-tabler-alert-circle" />
                                                <span>{{
                                                    t(
                                                        "console-ai-mcp-server.jsonImportCorrectExample",
                                                    )
                                                }}</span>
                                            </div>
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
                <UButton color="primary" size="lg" type="submit" :loading="isLock">
                    {{ mcpServerId ? t("console-common.update") : t("console-common.create") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
