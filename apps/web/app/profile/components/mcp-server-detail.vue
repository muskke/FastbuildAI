<script setup lang="ts">
import { ProModal, useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive } from "vue";

import type { McpServerInfo } from "@/models/web-mcp-server";
import {
    apiCheckMcpServerConnect,
    apiGetMcpServerDetail,
    apiGetSystemMcpServerDetail,
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

interface Tool {
    id: string;
    name: string;
    description: string;
    mcpServerId: string;
    createdAt: string;
    updatedAt: string;
}

interface Detail {
    name: string;
    providerName: string;
    description: string;
    icon: string;
    isShow: boolean;
    url: string;
    sortOrder: number;
    timeout: number;
    type: string;
    tools: Tool[];
    connectable: boolean;
    connectError: string;
    mcpServerId: string;
    isDisabled: boolean;
}

const loading = ref(false);

const formData = reactive<Detail>({
    name: "",
    providerName: "",
    description: "",
    icon: "",
    isShow: false,
    url: "",
    sortOrder: 0,
    timeout: 60,
    type: "",
    tools: [],
    connectable: false,
    connectError: "",
    mcpServerId: "",
    isDisabled: false,
});
const reconnecting = ref(false);

// 获取供应商详情
const { lockFn: fetchDetail, isLock: detailLoading } = useLockFn(async () => {
    try {
        let data: McpServerInfo;

        if (props.isSystemMcp) {
            data = await apiGetSystemMcpServerDetail(mcpServerId.value as string);
        } else {
            data = await apiGetMcpServerDetail(mcpServerId.value as string);
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

const handleReconnect = async () => {
    try {
        loading.value = true;
        const res = await apiCheckMcpServerConnect(mcpServerId.value as string);
        if (res.connectable) {
            toast.success(res.message);
            fetchDetail();
            reconnecting.value = true;
        } else {
            toast.error(res.message);
        }
    } catch (error) {
        console.error("重新链接失败:", error);
    } finally {
        loading.value = false;
    }
};

const handleClose = (value: boolean) => {
    emits("close", value);
};

onMounted(async () => mcpServerId.value && (await fetchDetail()));
</script>

<template>
    <ProModal
        :model-value="true"
        :title="t('console-ai-mcp-server.detailTitle')"
        :description="t('console-ai-mcp-server.detailTitle')"
        :ui="{
            content: 'max-w-2xl overflow-y-auto h-fit',
        }"
        @update:model-value="(value) => !value && handleClose(reconnecting)"
    >
        <div v-if="detailLoading" class="flex items-center justify-center" style="height: 400px">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
        </div>
        <div v-else class="max-h-180">
            <div class="flex justify-between pb-4">
                <div class="flex items-center gap-4">
                    <UAvatar
                        :src="formData.icon"
                        :alt="formData.name"
                        size="3xl"
                        :ui="{ root: 'rounded-lg' }"
                    />
                    <div>
                        <h3
                            class="text-secondary-foreground flex items-center text-base font-semibold"
                        >
                            <UTooltip :text="formData.name" :delay="0">
                                <span class="line-clamp-1">
                                    {{ formData.name }}
                                </span>
                            </UTooltip>
                        </h3>
                        <UBadge :color="formData.type === 'user' ? 'info' : 'primary'">{{
                            formData.type === "user"
                                ? t("console-common.tab.custom")
                                : t("console-common.tab.system")
                        }}</UBadge>
                    </div>
                </div>
                <UButton
                    v-if="!formData.connectable && formData.type === 'user'"
                    class="h-fit"
                    :loading="loading"
                    icon="tabler:reload"
                    :ui="{ leadingIcon: 'size-4' }"
                    variant="soft"
                    size="md"
                    color="error"
                    @click="handleReconnect()"
                >
                    {{ t("console-ai-mcp-server.detail.reconnect") }}
                </UButton>
            </div>
            <!-- 描述 -->
            <div class="bg-muted rounded-lg p-4 pb-4">
                <p class="text-muted-foreground text-xs">
                    {{ formData.description || t("common.mcp-server.detail.noDescription") }}
                </p>
            </div>

            <!-- 基本信息 -->
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 py-4 pb-4 md:grid-cols-2">
                <div v-if="formData.type === 'user'">
                    <div class="text-muted-foreground text-sm">
                        {{ t("common.mcp-server.detail.url") }}
                    </div>
                    <UTooltip
                        :text="formData.url"
                        :ui="{
                            content:
                                'max-w-100 !whitespace-pre-wrap break-all leading-relaxed h-fit p-2',
                        }"
                        :delay-duration="0"
                    >
                        <template #content>
                            <div class="max-w-100">
                                {{ formData.url }}
                            </div>
                        </template>
                        <div class="text-secondary-foreground mt-1 truncate font-medium">
                            {{ formData.url }}
                        </div>
                    </UTooltip>
                </div>
                <div>
                    <div class="text-muted-foreground text-sm">
                        {{ t("common.mcp-server.detail.timeout") }}
                    </div>
                    <div class="text-secondary-foreground mt-1 font-medium">
                        {{ formData.timeout }} s
                    </div>
                </div>
                <div v-if="!props.isSystemMcp">
                    <div class="text-muted-foreground text-sm">
                        {{ t("common.mcp-server.detail.status") }}
                    </div>
                    <div class="text-secondary-foreground mt-1 font-medium">
                        <UBadge :color="!formData.isDisabled ? 'success' : 'warning'">{{
                            !formData.isDisabled
                                ? t("common.mcp-server.detail.enabled")
                                : t("common.mcp-server.detail.disabled")
                        }}</UBadge>
                    </div>
                </div>
                <div>
                    <div class="text-muted-foreground text-sm">
                        {{ t("common.mcp-server.detail.sortOrder") }}
                    </div>
                    <div class="text-secondary-foreground mt-1 font-medium">
                        {{ formData.sortOrder }}
                    </div>
                </div>
                <div>
                    <div class="text-muted-foreground text-sm">
                        {{ t("console-ai-mcp-server.detail.connectStatus") }}
                    </div>
                    <div class="text-secondary-foreground mt-1 font-medium">
                        <UBadge :color="formData.connectable ? 'success' : 'error'">{{
                            formData.connectable
                                ? t("console-ai-mcp-server.detail.connectSuccess")
                                : t("console-ai-mcp-server.detail.connectFailed")
                        }}</UBadge>
                    </div>
                </div>
                <div>
                    <div class="text-muted-foreground text-sm">
                        {{ t("console-ai-mcp-server.detail.connectError") }}
                    </div>
                    <div v-if="formData.connectError" class="text-error mt-1 text-sm font-medium">
                        {{ formData.connectError }}
                    </div>
                    <div v-else class="mt-1 text-sm font-medium">-</div>
                </div>
            </div>

            <!-- 工具列表 -->
            <div v-if="formData.tools && formData.tools.length > 0" class="pb-4">
                <h4 class="text-secondary-foreground mb-2 text-base font-medium">
                    {{ t("console-ai-mcp-server.detail.tools") }}
                </h4>
                <div class="max-h-80 space-y-2 overflow-y-auto">
                    <div
                        v-for="(tool, index) in formData.tools"
                        :key="index"
                        class="border-muted rounded-lg border p-4"
                    >
                        <div class="text-secondary-foreground font-medium">{{ tool.name }}</div>
                        <div class="text-muted-foreground mt-1 text-sm">
                            {{ tool.description }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ProModal>
</template>
