<script lang="ts" setup>
import { ProInputPassword, ProUploader, useLockFn, useMessage } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { number, object, string } from "yup";

import {
    getDefaultAreaCode,
    PHONE_AREA_CODES,
    validatePhoneNumber,
} from "@/common/config/phone-area";
import type { UserCreateRequest } from "@/models/user";
import { apiGetAllRoleList } from "@/services/console/role";

// 引入国际化
const { t } = useI18n();

/** 组件属性接口 */
interface Props {
    /** 是否编辑模式 */
    isEdit?: boolean;
    /** 编辑的ID */
    id?: string | null;
    /** 初始数据 */
    initialData?: Partial<UserCreateRequest>;
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
    (e: "submit-success", data: UserCreateRequest): void;
    /** 取消事件 */
    (e: "cancel"): void;
}>();

const message = useMessage();

// 过滤掉initialData中的userNo属性
const { userNo, ...filteredInitialData } = props.initialData || {};

// 是否编辑剩余算力
const editPower = ref(false);

// 表单数据
const formData = reactive<UserCreateRequest>({
    username: "",
    nickname: "",
    email: "",
    phone: "",
    phoneAreaCode: getDefaultAreaCode(), // 自动检测当前地区区号
    avatar: "",
    password: "",
    roleId: undefined,
    status: 1,
    source: 0,
    ...filteredInitialData,
});

// 角色选项
const roleOptions = ref<{ label: string; value: string }[]>([]);

// 区号选项 - 使用公共配置
const areaCodeOptions = computed(() => {
    return PHONE_AREA_CODES.map((item) => ({
        label: `${item.flag} ${t(item.i18nKey)} +${item.areaCode}`,
        value: item.areaCode,
    }));
});

// 表单规则
const schema = computed(() => {
    const baseSchema = {
        username: string()
            .required(t("console-user.form.usernameRequired"))
            .matches(/^[a-zA-Z0-9_]*$/, t("console-user.form.usernameFormat")),
        nickname: string().required(t("console-user.form.nicknameRequired")),
        email: string().email(t("console-user.form.emailFormat")).nullable(),

        phone: string()
            .test("phone-format", t("console-user.form.phoneFormat"), function (value) {
                if (!value) return true; // 可选字段
                // 根据选择的区号获取对应的国家代码
                const areaCodeConfig = PHONE_AREA_CODES.find(
                    (item) => item.areaCode === formData.phoneAreaCode,
                );
                if (!areaCodeConfig) return false;
                return validatePhoneNumber(value, areaCodeConfig.code);
            })
            .nullable(),
        phoneAreaCode: string()
            .matches(/^\d{1,4}$/, t("console-user.form.areaCodeFormat"))
            .nullable(),
        status: number().required(t("console-user.form.statusRequired")),
        source: number().required(t("console-user.form.sourceRequired")),
    };

    // 如果是新增模式，添加密码验证
    if (!props.isEdit) {
        return object({
            ...baseSchema,
            password: string()
                .required(t("console-user.form.passwordRequired"))
                .min(6, t("console-user.form.passwordMinLength")),
        });
    }

    return object(baseSchema);
});

/** 获取角色列表 */
const getRoleList = async () => {
    try {
        const response = await apiGetAllRoleList();
        roleOptions.value = [
            { label: t("console-user.form.noRole"), value: "null" }, // 添加无角色选项，使用空字符串
            ...response.map((role: any) => ({
                label: role.name,
                value: role.id,
            })),
        ];
    } catch (error) {
        console.error("Get role list failed:", error);
        message.error(t("console-user.form.getRoleListFailed"));
    }
};

/** 重置表单 */
const resetForm = () => {
    Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof UserCreateRequest;
        if (typeof formData[typedKey] === "string") {
            (formData[typedKey] as string) = "";
        } else if (typeof formData[typedKey] === "number") {
            (formData[typedKey] as number) = key === "status" ? 1 : 0;
        }
    });
    message.info(t("console-user.form.formReset"));
};

/** 提交表单 */
const { isLock, lockFn: submitForm } = useLockFn(async () => {
    try {
        if (formData.roleId === "null") {
            formData.roleId = undefined;
        }
        // 发送事件，由父组件处理提交逻辑
        emit("submit-success", { ...formData });
    } catch (error) {
        console.error(t("console-user.form.formValidationFailed") + ":", error);
        return false;
    }
});

// 初始化
onMounted(() => getRoleList());
</script>

<template>
    <div>
        <UForm :state="formData" :schema="schema" class="space-y-8" @submit="submitForm">
            <!-- 主要内容区域 -->
            <div class="grid grid-cols-1 gap-8 p-1 lg:grid-cols-3">
                <!-- 左侧头像上传区域 -->
                <div class="shadow-default h-fit rounded-lg lg:col-span-1">
                    <div
                        class="flex flex-col items-center space-y-4"
                        style="padding: 80px 24px 40px"
                    >
                        <!-- 头像上传 -->
                        <div class="border-default relative rounded-full border border-dashed p-2">
                            <ProUploader
                                v-model="formData.avatar"
                                class="bg-muted h-32 w-32 overflow-hidden !rounded-full !border-none"
                                :text="t('console-user.form.addAvatar')"
                                icon="i-lucide-camera"
                                accept=".jpg,.png,.jpeg"
                                :maxCount="1"
                                :single="true"
                            />
                        </div>

                        <!-- 头像说明 -->
                        <div class="mt-6 px-12 text-center text-xs">
                            <p class="text-muted-foreground">
                                {{ t("console-user.form.avatarFormats") }}
                            </p>
                        </div>

                        <!-- 用户状态开关 -->
                        <div class="mt-6 flex w-full items-center justify-between">
                            <div>
                                <h4 class="text-secondary-foreground text-sm font-medium">
                                    {{ t("console-user.form.statusLabel") }}
                                </h4>
                                <p class="text-muted-foreground mt-2 text-xs">
                                    {{ t("console-user.form.statusHelp") }}
                                </p>
                            </div>
                            <USwitch
                                :model-value="!!formData.status"
                                unchecked-icon="i-lucide-x"
                                checked-icon="i-lucide-check"
                                size="xl"
                                @change="(value) => (formData.status = !formData.status ? 1 : 0)"
                            />
                        </div>

                        <!-- 剩余算力 -->
                        <div class="mt-4 w-full">
                            <UFormField :label="t('console-user.form.power')" name="power">
                                <UInput
                                    v-model="formData.power"
                                    :disabled="!editPower"
                                    :variant="editPower ? 'outline' : 'subtle'"
                                    size="xl"
                                    class="w-full"
                                    type="number"
                                >
                                    <template #trailing>
                                        <UButton
                                            class="cursor-pointer"
                                            color="primary"
                                            variant="link"
                                            size="sm"
                                            icon="i-lucide-edit"
                                            aria-label="Clear input"
                                            @click="editPower = !editPower"
                                        />
                                    </template>
                                </UInput>
                            </UFormField>
                        </div>
                    </div>
                </div>

                <!-- 右侧表单区域 -->
                <div class="shadow-default space-y-6 rounded-lg p-6 lg:col-span-2">
                    <!-- 基本信息 -->
                    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <!-- 用户名 -->
                        <UFormField
                            :label="t('console-user.form.username')"
                            name="username"
                            required
                        >
                            <UInput
                                v-model="formData.username"
                                :placeholder="t('console-user.form.usernameInput')"
                                size="xl"
                                :disabled="props.isEdit"
                                class="w-full"
                            />
                            <template #hint v-if="!props.isEdit">
                                <span class="text-muted-foreground text-xs">{{
                                    t("console-user.form.usernameHelp")
                                }}</span>
                            </template>
                        </UFormField>

                        <!-- 邮箱 -->
                        <UFormField :label="t('console-user.form.email')" name="email">
                            <UInput
                                v-model="formData.email"
                                :placeholder="t('console-user.form.emailInput')"
                                size="xl"
                                type="email"
                                class="w-full"
                            />
                            <!-- <template #hint>
                                <span class="text-muted-foreground text-xs">{{
                                    t("console-user.form.emailOrPhoneHint")
                                }}</span>
                            </template> -->
                        </UFormField>
                    </div>

                    <!-- 手机号和昵称 -->
                    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <!-- 手机号 -->
                        <UFormField :label="t('console-user.form.phone')" name="phone">
                            <UInput
                                v-model="formData.phone"
                                :placeholder="t('console-user.form.phoneInput')"
                                size="xl"
                                autocomplete="off"
                                :ui="{ root: 'w-full', base: '!pl-42' }"
                            >
                                <template #leading>
                                    <div class="flex items-center text-sm" @click.stop.prevent>
                                        <USelectMenu
                                            v-model="formData.phoneAreaCode"
                                            :items="areaCodeOptions"
                                            trailing-icon="heroicons:chevron-up-down-20-solid"
                                            class="w-36"
                                            size="lg"
                                            :ui="{
                                                base: '!ring-0',
                                                content: 'z-999 w-64',
                                            }"
                                            value-key="value"
                                            label-key="label"
                                        >
                                            <template #item="{ item }">
                                                {{ $t(item.label) }}
                                            </template>
                                        </USelectMenu>
                                    </div>
                                    <USeparator class="h-1/2" orientation="vertical" />
                                </template>
                            </UInput>
                            <!-- <template #hint>
                                <span class="text-muted-foreground text-xs">{{
                                    t("console-user.form.phoneOrEmailHint")
                                }}</span>
                            </template> -->
                        </UFormField>

                        <!-- 昵称 -->
                        <UFormField
                            :label="t('console-user.form.nickname')"
                            name="nickname"
                            required
                        >
                            <UInput
                                v-model="formData.nickname"
                                :placeholder="t('console-user.form.nicknameInput')"
                                size="xl"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <!-- 密码字段 - 仅新增时显示 -->
                        <template v-if="!props.isEdit">
                            <UFormField
                                :label="t('console-user.form.password')"
                                name="password"
                                required
                            >
                                <ProInputPassword
                                    v-model="formData.password"
                                    :placeholder="t('console-user.form.passwordInput')"
                                    size="xl"
                                    type="password"
                                    class="w-full"
                                />
                                <template #hint>
                                    <span class="text-muted-foreground text-xs">{{
                                        t("console-user.form.passwordHelp")
                                    }}</span>
                                </template>
                            </UFormField>
                        </template>

                        <!-- 角色 -->
                        <UFormField :label="t('console-user.form.role')" name="roleId">
                            <USelect
                                v-model="formData.roleId"
                                label-key="label"
                                value-key="value"
                                :items="roleOptions"
                                :placeholder="t('console-user.form.roleSelect')"
                                size="xl"
                                class="w-full"
                            />
                        </UFormField>

                        <!-- 真实姓名 -->
                        <UFormField :label="t('console-user.form.realName')" name="realName">
                            <UInput
                                v-model="formData.realName"
                                :placeholder="t('console-user.form.realNameInput')"
                                size="xl"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <!-- 底部操作按钮 -->
                    <div class="flex justify-end gap-4">
                        <UButton
                            color="neutral"
                            variant="outline"
                            size="lg"
                            @click="emit('cancel')"
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
                            :loading="isLock"
                            type="submit"
                            class="px-8"
                        >
                            {{
                                props.isEdit
                                    ? t("console-common.update")
                                    : t("console-common.create")
                            }}
                        </UButton>
                    </div>
                </div>
            </div>
        </UForm>
    </div>
</template>
