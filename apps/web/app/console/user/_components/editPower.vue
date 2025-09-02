<script lang="ts" setup>
import { ProModal, useMessage } from "@fastbuildai/ui";
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { number, object } from "yup";

import type { UserInfo } from "@/models/user";
import { apiUpdateUserAmount } from "@/services/console/user";

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    user: { id: string; power?: number } | null;
}>();

const emits = defineEmits<{
    (e: "close", refresh?: boolean): void;
}>();

// 余额调整表单数据
const powerAdjustForm = reactive({
    type: 1, // 1: 增加, 0: 减少
    amount: 0,
});

// 表单验证规则
const schema = object({
    amount: number()
        .required(t("console-user.form.adjustAmountRequired"))
        .min(0, t("console-user.form.adjustAmountMin")),
});

// 计算调整后的余额
const adjustedPower = computed(() => {
    if (!props.user) return 0;
    const currentPower = props.user.power || 0;
    const amount = powerAdjustForm.amount || 0;

    if (powerAdjustForm.type === 1) {
        return currentPower + amount;
    } else {
        return Math.max(0, currentPower - amount);
    }
});

/**
 * 确认余额调整
 */
const handleConfirmPowerEdit = async () => {
    try {
        if (!props.user?.id) {
            toast.error("用户ID不存在");
            return;
        }

        // 调用API接口调整用户余额
        await apiUpdateUserAmount(props.user.id, powerAdjustForm.amount, powerAdjustForm.type);

        const userStore = useUserStore();

        if (userStore.userInfo?.id === props.user?.id) {
            userStore.getUser();
        }

        toast.success(t("console-user.form.adjustPowerSuccess"));
        emits("close", true);
    } catch (error) {
        console.error("调整余额失败:", error);
        toast.error(t("console-user.form.adjustPowerError"));
    }
};

/**
 * 取消余额调整
 */
const handleCancelPowerEdit = () => {
    emits("close");
};

function handleClose() {
    emits("close");
}
</script>

<template>
    <ProModal
        :model-value="true"
        :title="t('console-user.form.editPower')"
        :ui="{
            content: 'max-w-sm overflow-y-auto h-fit',
        }"
        @update:model-value="(value) => !value && handleClose()"
    >
        <UForm
            :state="powerAdjustForm"
            :schema="schema"
            class="space-y-4"
            @submit="handleConfirmPowerEdit"
        >
            <UFormField :label="t('console-user.form.currentPower')" name="currentPower">
                <UInput
                    :model-value="user?.power || 0"
                    size="lg"
                    disabled
                    variant="subtle"
                    class="w-full"
                    type="number"
                />
            </UFormField>

            <UFormField :label="t('console-user.form.powerAdjust')" name="type">
                <URadioGroup
                    v-model="powerAdjustForm.type"
                    :items="[
                        { label: t('console-user.form.add'), value: 1 },
                        { label: t('console-user.form.reduce'), value: 0 },
                    ]"
                    orientation="horizontal"
                    color="primary"
                />
            </UFormField>

            <UFormField :label="t('console-user.form.adjustAmount')" name="amount">
                <UInput
                    v-model="powerAdjustForm.amount"
                    :placeholder="t('console-user.form.adjustAmountInput')"
                    size="lg"
                    class="w-full"
                    type="number"
                    min="0"
                />
            </UFormField>

            <UFormField :label="t('console-user.form.adjustedPower')" name="adjustedPower">
                <UInput
                    :model-value="adjustedPower"
                    size="lg"
                    disabled
                    variant="subtle"
                    class="w-full"
                    type="number"
                />
            </UFormField>

            <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="soft" @click="handleCancelPowerEdit">
                    {{ t("console-common.cancel") }}
                </UButton>
                <UButton color="primary" type="submit">
                    {{ t("console-common.confirm") }}
                </UButton>
            </div>
        </UForm>
    </ProModal>
</template>
