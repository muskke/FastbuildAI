<script setup lang="ts">
import { ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { useI18n } from "vue-i18n";
import { number, object, string } from "yup";

import { PayConfigPayType, PayConfigPayTypeLabels, type PayConfigType } from "@/models/payconfig";
import type { PayconfigInfo } from "@/models/payconfig.ts";
import { apiGetPayconfigById, apiUpdatePayconfig } from "@/services/console/payconfig";

const message = useMessage();

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const formData = ref<PayconfigInfo>({
    id: "",
    name: "",
    logo: "",
    isEnable: 0,
    isDefault: 0,
    payType: 1,
    sort: 0,
    payVersion: "",
    merchantType: "",
    mchId: "",
    apiKey: "",
    paySignKey: "",
    cert: "",
    payAuthDir: "",
    appId: "",
});
const payType = computed(() => {
    const payTypeValue = formData.value.payType;
    return PayConfigPayTypeLabels[payTypeValue as PayConfigType] ?? "未知支付方式";
});
const payconfigId = computed(() => route.query.id as string);
/** 获取支付配置详情 */
const { lockFn: getPayconfigDetail, isLock } = useLockFn(async () => {
    if (!payconfigId.value) {
        message.error(t("console-payconfig.form.getPayconfigDetailFailedHelp"));
        router.back();
        return;
    }
    try {
        const data = await apiGetPayconfigById(payconfigId.value);
        formData.value = data;
    } catch (error) {
        message.error(t("console-payconfig.form.getPayconfigDetailFailed"));
        router.back();
    }
});
onMounted(() => {
    getPayconfigDetail();
});
const { lockFn: submitForm, isLock: isSubmitting } = useLockFn(async () => {
    try {
        const { payType, ...rest } = formData.value;
        const data = await apiUpdatePayconfig(rest);
        message.success(t("console-payconfig.form.updateSuccess"));
        router.back();
    } catch (error) {
        message.error(t("console-payconfig.form.updateFailed"));
        console.log(error);
    }
});
const schema = object({
    name: string().required(t("console-payconfig.validation.nameRequired")),
    payVersion: string().required(t("console-payconfig.validation.payVersionRequired")),
    merchantType: string().required(t("console-payconfig.validation.merchantTypeRequired")),
    mchId: string().required(t("console-payconfig.validation.mchIdRequired")),
    apiKey: string().required(t("console-payconfig.validation.apiKeyRequired")),
    paySignKey: string().required(t("console-payconfig.validation.paySignKeyRequired")),
    cert: string().required(t("console-payconfig.validation.certRequired")),
    sort: number().required(t("console-payconfig.validation.sortRequired")),
    appId: string().required(t("console-payconfig.validation.appIdRequired")),
});
</script>
<template>
    <!-- 加载状态 -->
    <div v-if="isLock" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="text-primary-500 h-8 w-8 animate-spin" />
    </div>
    <UForm v-else :state="formData" :schema="schema" class="space-y-8" @submit="submitForm">
        <!-- 主要内容区域 -->
        <div class="grid grid-cols-1 gap-8 p-1 lg:grid-cols-3">
            <!-- 左侧 -->
            <div class="shadow-default h-fit rounded-lg lg:col-span-1">
                <div class="flex flex-col items-center space-y-4" style="padding: 80px 24px 40px">
                    <!-- 上传 -->
                    <div class="flex items-start gap-4">
                        <!-- <ProUploader
                            v-model="formData.logo"
                            class="h-32 w-32"
                            :text="t('console-payconfig.form.addLogo')"
                            icon="i-lucide-camera"
                            accept=".jpg,.png,.jpeg"
                            :maxCount="1"
                            :single="true"
                            name="logo"
                        /> -->
                        <UAvatar
                            :src="formData.logo"
                            alt="微信支付"
                            class="h-32 w-32"
                            :ui="{ root: 'rounded-lg' }"
                        />
                    </div>

                    <!-- 图标说明 -->
                    <div class="mt-6 px-12 text-center text-xs">
                        <p class="text-muted-foreground">
                            {{ t("console-payconfig.form.avatarFormats") }}
                        </p>
                    </div>

                    <!-- 状态开关 -->
                    <div class="mt-6 flex w-full items-center justify-between">
                        <div>
                            <h4 class="text-secondary-foreground text-sm font-medium">
                                {{ t("console-payconfig.form.enable") }}
                            </h4>
                            <p class="text-muted-foreground mt-2 text-xs">
                                {{ t("console-payconfig.form.enableHelp") }}
                            </p>
                        </div>
                        <USwitch
                            :model-value="!!formData.isEnable"
                            unchecked-icon="i-lucide-x"
                            checked-icon="i-lucide-check"
                            size="xl"
                            @change="
                                (value) => {
                                    formData.isEnable = !formData.isEnable ? 1 : 0;
                                }
                            "
                        />
                    </div>
                    <!-- 是否默认 -->
                    <div class="mt-6 flex w-full items-center justify-between">
                        <div>
                            <h4 class="text-secondary-foreground text-sm font-medium">
                                {{ t("console-payconfig.form.isDefault") }}
                            </h4>
                            <p class="text-muted-foreground mt-2 text-xs">
                                {{ t("console-payconfig.form.isDefaultHelp") }}
                            </p>
                        </div>
                        <USwitch
                            :model-value="!!formData.isDefault"
                            unchecked-icon="i-lucide-x"
                            checked-icon="i-lucide-check"
                            size="xl"
                            @change="
                                (value) => {
                                    formData.isDefault = !formData.isDefault ? 1 : 0;
                                }
                            "
                        />
                    </div>
                </div>
            </div>
            <!-- 右侧表单区域 -->
            <div class="shadow-default space-y-6 rounded-lg p-6 lg:col-span-2">
                <!-- 基本信息 -->
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <!-- 支付方式 -->
                    <UFormField :label="t('console-payconfig.form.payway')" name="payway">
                        <UInput
                            v-model="payType"
                            :placeholder="t('console-payconfig.form.payway')"
                            size="xl"
                            :disabled="true"
                            variant="subtle"
                            class="w-full"
                        />
                    </UFormField>
                    <!-- 自定义显示名称 -->
                    <UFormField :label="t('console-payconfig.form.name')" name="name" required>
                        <UInput
                            v-model="formData.name"
                            :placeholder="t('console-payconfig.form.nameInput')"
                            size="xl"
                            class="w-full"
                        />
                    </UFormField>
                    <!-- 支付接口版本 -->
                    <UFormField
                        :label="t('console-payconfig.form.payVersion')"
                        :description="t('console-payconfig.form.payVersionHelp')"
                        name="payVersion"
                        required
                    >
                        <URadioGroup v-model="formData.payVersion" :items="['V3']" />
                    </UFormField>
                    <!-- 商户类型 -->
                    <UFormField
                        :label="t('console-payconfig.form.merchantType')"
                        :description="t('console-payconfig.form.merchantTypeHelp')"
                        name="merchantType"
                        required
                    >
                        <URadioGroup
                            v-model="formData.merchantType"
                            :items="[
                                {
                                    label: t('console-payconfig.form.merchantTypeOptions.ordinary'),
                                    value: 'ordinary',
                                },
                            ]"
                        />
                    </UFormField>
                    <!-- 商户号 -->
                    <UFormField
                        :label="t('console-payconfig.form.mchId')"
                        name="mchId"
                        required
                        :description="t('console-payconfig.form.mchIdHelp')"
                    >
                        <UInput
                            v-model="formData.mchId"
                            :placeholder="t('console-payconfig.form.mchIdInput')"
                            size="xl"
                            class="w-full"
                        />
                    </UFormField>
                    <!-- 商户api密钥 -->
                    <UFormField
                        :label="t('console-payconfig.form.apiKey')"
                        name="apiKey"
                        required
                        :description="t('console-payconfig.form.apiKeyHelp')"
                    >
                        <UInput
                            v-model="formData.apiKey"
                            :placeholder="t('console-payconfig.form.apiKeyInput')"
                            size="xl"
                            class="w-full"
                        />
                    </UFormField>
                    <!-- 微信支付证书 -->
                    <UFormField
                        :label="t('console-payconfig.form.cert')"
                        name="cert"
                        required
                        :description="t('console-payconfig.form.certHelp')"
                    >
                        <UTextarea
                            v-model="formData.cert"
                            :placeholder="t('console-payconfig.form.certInput')"
                            size="xl"
                            class="w-full"
                            autoresize
                            :maxrows="3"
                        />
                    </UFormField>
                    <!-- 微信支付密钥 -->
                    <UFormField
                        :label="t('console-payconfig.form.paySignKey')"
                        name="paySignKey"
                        required
                        :description="t('console-payconfig.form.paySignKeyHelp')"
                    >
                        <UTextarea
                            v-model="formData.paySignKey"
                            :placeholder="t('console-payconfig.form.paySignKeyInput')"
                            size="xl"
                            class="w-full"
                            autoresize
                            :maxrows="3"
                        />
                    </UFormField>

                    <!-- 支付授权目录 -->
                    <!-- <UFormField
                        :label="t('console-payconfig.form.payAuthDir')"
                        name="payAuthDir"
                        :description="t('console-payconfig.form.payAuthDirHelp')"
                    >
                        <UInput
                            v-model="formData.payAuthDir"
                            variant="subtle"
                            :placeholder="t('console-payconfig.form.payAuthDirHelp')"
                            size="xl"
                            :disabled="true"
                            class="w-full"
                        >
                            <template #trailing>
                                <span class="text-primary cursor-pointer text-xs">
                                    {{ t("console-payconfig.form.copy") }}
                                </span>
                            </template>
                        </UInput>
                    </UFormField> -->
                    <!-- appId -->
                    <UFormField
                        :label="t('console-payconfig.form.appId')"
                        name="appId"
                        required
                        :description="t('console-payconfig.form.appIdHelp')"
                    >
                        <UInput
                            v-model="formData.appId"
                            :placeholder="t('console-payconfig.form.appIdInput')"
                            size="xl"
                            class="w-full"
                        />
                    </UFormField>
                    <!-- 排序 -->
                    <UFormField
                        :label="t('console-payconfig.form.sort')"
                        name="sort"
                        required
                        :description="t('console-payconfig.form.sortHelp')"
                    >
                        <UInput v-model="formData.sort" size="xl" class="w-full" />
                    </UFormField>
                </div>
                <!-- 底部操作按钮 -->
                <div class="flex justify-end gap-4">
                    <UButton
                        color="neutral"
                        variant="outline"
                        size="xl"
                        @click="router.back()"
                        class="px-8"
                        :loading="isLock || isSubmitting"
                    >
                        {{ t("console-common.cancel") }}
                    </UButton>
                    <UButton
                        color="primary"
                        size="xl"
                        :loading="isLock || isSubmitting"
                        type="submit"
                        class="px-8"
                    >
                        {{ t("console-common.update") }}
                    </UButton>
                </div>
            </div>
        </div>
    </UForm>
</template>
