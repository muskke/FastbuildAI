<script lang="ts" setup>
import ProUploader from "@fastbuildai/ui/components/pro-uploader.vue";
import { useLockFn } from "@fastbuildai/ui/composables/useLockFn";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";

import type { UpdateUserFieldRequest } from "@/models/user";
import { apiUpdateUserField } from "@/services/web/user";

import NicknameModal from "./_components/nickname-modal.vue";
import PasswordModal from "./_components/password-modal.vue";

// 组合式函数
const { t } = useI18n();
const toast = useMessage();
const userStore = useUserStore();
/**
 * 更新用户信息字段
 * @param field 字段名
 * @param value 字段值
 */
const { lockFn: updateUserFieldLockFn, isLock: isLoading } = useLockFn(
    async (field: UpdateUserFieldRequest["field"], value: any) => {
        try {
            const response = await apiUpdateUserField({ field, value });

            refreshNuxtData("users");

            toast.success(response.message || t("common.profile.modifySuccess"));
        } catch (error: any) {
            console.error("修改失败:", error);
            throw error;
        }
    },
);

/**
 * 复制用户编号到剪贴板
 */
async function copyUserNo() {
    if (!userStore.userInfo?.userNo) return;

    try {
        await navigator.clipboard.writeText(userStore.userInfo.userNo);
        toast.success(t("common.profile.userNoCopied"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 复制用户名到剪贴板
 */
async function copyUser() {
    if (!userStore.userInfo?.username) return;

    try {
        await navigator.clipboard.writeText(userStore.userInfo.username);
        toast.success(t("common.profile.userIdCopied"));
    } catch (err) {
        console.error("复制失败:", err);
        toast.error(t("console-common.messages.copyFailed"));
    }
}

/**
 * 注销账号
 */
function unrealized() {
    // 实现账号注销功能
    toast.info(t("common.profile.featureNotAvailable"));
}

// 页面元信息
definePageMeta({
    layout: "setting",
    title: "menu.profile",
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <!-- 导航栏 -->

    <!-- 内容区域 -->
    <div class="mx-auto md:w-[600px] lg:w-[750px] xl:w-[850px]">
        <section>
            <h2 class="mt-8 mb-6 text-lg font-medium">{{ t("common.profile.myAccount") }}</h2>

            <div class="bg-accent mb-6 flex items-center rounded-xl p-6">
                <div>
                    <ProUploader
                        v-model="userStore.userInfo!.avatar"
                        class="size-16 overflow-hidden !rounded-full"
                        :text="t('common.profile.uploadAvatar')"
                        icon="i-lucide-user"
                        accept=".jpg,.png,.jpeg"
                        :maxCount="1"
                        :single="true"
                        @success="updateUserFieldLockFn('avatar', $event.url)"
                    />
                </div>
                <div class="ml-4">
                    <div class="text-foreground text-md font-semibold">
                        {{ userStore.userInfo?.nickname || t("common.profile.notSet") }}
                    </div>
                    <div class="text-muted-foreground mt-1 text-sm">
                        {{ userStore.userInfo?.phone || userStore.userInfo?.email || "-" }}
                    </div>
                </div>
            </div>

            <div class="space-y-8">
                <!-- 昵称 -->
                <UFormField :label="t('common.profile.nickname')" required name="nickname">
                    <div class="flex items-center gap-2">
                        <UInput
                            v-model="userStore.userInfo!.nickname"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <NicknameModal
                            :loading="isLoading"
                            :current-value="userStore.userInfo?.nickname"
                            class="flex-none"
                            size="lg"
                            @success="(e) => updateUserFieldLockFn('nickname', e)"
                        >
                            <UButton variant="soft"> {{ t("console-common.edit") }} </UButton>
                        </NicknameModal>
                    </div>
                </UFormField>

                <!-- 用户编号 -->
                <UFormField :label="t('common.profile.userNo')" name="userNo">
                    <div class="flex items-center gap-2">
                        <UInput
                            v-model="userStore.userInfo!.userNo"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <UButton size="lg" class="flex-none" variant="soft" @click="copyUserNo">
                            {{ t("console-common.copy") }}
                        </UButton>
                    </div>
                </UFormField>

                <!-- 账号 -->
                <UFormField :label="t('common.profile.username')" name="username">
                    <div class="flex items-center gap-2">
                        <UInput
                            v-model="userStore.userInfo!.username"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <UButton size="lg" class="flex-none" variant="soft" @click="copyUser">
                            {{ t("console-common.copy") }}
                        </UButton>
                    </div>
                </UFormField>

                <!-- 邮箱 -->
                <UFormField :label="t('common.profile.email')" name="email">
                    <div class="flex items-center gap-2">
                        <UInput
                            :model-value="userStore.userInfo!.email || '-'"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <UButton size="lg" class="flex-none" variant="soft" @click="unrealized">
                            {{ t("console-common.update") }}
                        </UButton>
                    </div>
                </UFormField>

                <!-- 手机号 -->
                <UFormField :label="t('common.profile.phone')" name="phone">
                    <div class="flex items-center gap-2">
                        <UInput
                            :model-value="userStore.userInfo!.phone || '-'"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <UButton size="lg" class="flex-none" variant="soft" @click="unrealized">
                            {{ t("console-common.update") }}
                        </UButton>
                    </div>
                </UFormField>

                <!-- 注册时间 -->
                <UFormField :label="t('common.profile.registrationTime')" name="createdAt">
                    <div class="flex items-center gap-2">
                        <UInput
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        >
                            <template #leading>
                                <TimeDisplay
                                    v-if="userStore.userInfo?.createdAt"
                                    :datetime="userStore.userInfo.createdAt as unknown as Date"
                                    mode="datetime"
                                />
                                <span v-else>-</span>
                            </template>
                        </UInput>
                    </div>
                </UFormField>
            </div>
        </section>

        <!-- 账号安全 -->
        <section>
            <h2 class="mt-8 mb-6 text-lg font-medium">{{ t("common.profile.accountSecurity") }}</h2>

            <div class="space-y-8">
                <!-- 修改密码 -->
                <UFormField :label="t('common.profile.loginPassword')" name="password">
                    <div class="flex items-center gap-2">
                        <UInput
                            :model-value="
                                userStore.userInfo!.password
                                    ? t('common.profile.passwordSet')
                                    : t('common.profile.passwordSet')
                            "
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <PasswordModal :loading="isLoading" class="flex-none" size="lg">
                            <UButton size="lg" variant="soft">
                                {{ t("console-common.update") }}
                            </UButton>
                        </PasswordModal>
                    </div>
                </UFormField>

                <!-- 注销账号 -->
                <UFormField :label="t('common.profile.deactivateAccount')" name="deactivate">
                    <div class="flex items-center gap-2">
                        <UInput
                            :model-value="t('common.profile.deactivateWarning')"
                            variant="soft"
                            color="neutral"
                            size="lg"
                            disabled
                            :ui="{ root: 'w-full' }"
                        />
                        <UButton
                            size="lg"
                            class="flex-none"
                            variant="soft"
                            color="error"
                            @click="unrealized"
                        >
                            {{ t("common.profile.deactivate") }}
                        </UButton>
                    </div>
                </UFormField>
            </div>
        </section>
    </div>
</template>
