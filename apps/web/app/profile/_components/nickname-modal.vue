<script setup lang="ts">
import ProModal from "@fastbuildai/ui/components/pro-modal.vue";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { useI18n } from "vue-i18n";

const props = defineProps<{
    currentValue?: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: "success", value: string): void;
}>();

// 国际化
const { t } = useI18n();

// 响应式状态
const toast = useMessage();
const isOpen = ref(false);
const nickname = ref(props.currentValue || "");

// 计算属性
const error = computed(() => {
    const trimmed = nickname.value.trim();
    if (!trimmed) return t("common.profile.nicknameRequired");
    if (trimmed.length > 20) return t("common.profile.nicknameTooLong");
    return "";
});

const isChanged = computed(() => {
    const current = props.currentValue || "";
    return nickname.value.trim() !== current.trim();
});

watch(
    () => isOpen.value,
    (isOpen) => {
        if (isOpen) {
            nickname.value = props.currentValue || "";
        }
    },
);

async function saveNickname() {
    if (error.value) {
        toast.warning(error.value);
        return;
    }

    if (!isChanged.value) {
        return;
    }

    const trimmedValue = nickname.value.trim();
    emit("success", trimmedValue);
    isOpen.value = false;
}
</script>

<template>
    <ProModal
        v-model="isOpen"
        :title="t('common.profile.editNickname')"
        width="sm"
        :show-footer="true"
    >
        <template #trigger>
            <slot></slot>
        </template>

        <div class="py-2">
            <UFormField :label="t('common.profile.nickname')" size="lg" required :error="error">
                <UInput
                    v-model="nickname"
                    :placeholder="t('common.profile.nicknamePlaceholder')"
                    maxlength="20"
                    :ui="{ root: 'w-full' }"
                    @keydown.enter.prevent="saveNickname"
                />
            </UFormField>
            <div class="text-muted-foreground mt-2 text-xs">
                {{ t("common.profile.nicknameLength") }}
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton variant="soft" @click="isOpen = false">{{
                    t("console-common.cancel")
                }}</UButton>
                <UButton
                    :disabled="!isChanged || !!error"
                    color="primary"
                    :loading="loading"
                    @click="saveNickname"
                >
                    {{ t("console-common.save") }}
                </UButton>
            </div>
        </template>
    </ProModal>
</template>
