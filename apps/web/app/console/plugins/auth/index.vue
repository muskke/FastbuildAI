<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { type InferType, object, string } from "yup";

import { apiPostDeveloperSecretGet, apiPostDeveloperSecretSet } from "@/services/console/plugin";

const toast = useToast();
const { t } = useI18n();

const schema = object({
    secretKey: string().required(t("console-common.required", { label: "开发者密钥" })),
});

type Schema = InferType<typeof schema>;

const state = reactive<Schema>({
    secretKey: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
    await apiPostDeveloperSecretSet({ secretKey: state.secretKey });
    toast.add({ title: "Success", description: "The form has been submitted.", color: "success" });
}

const submitDebounced = useDebounceFn(onSubmit, 500);

function onReset() {
    state.secretKey = "";
}

onMounted(async () => {
    const { secretKey } = await apiPostDeveloperSecretGet();
    state.secretKey = secretKey;
});
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="submitDebounced">
        <UFormField :label="$t('console-plugins.auth.secretKey')" name="secretKey" required>
            <UInput v-model="state.secretKey" class="w-sm" />
            <template #help> {{ $t("console-plugins.auth.help") }} </template>
        </UFormField>

        <div class="flex gap-2">
            <UButton type="submit"> {{ $t("console-common.submit") }} </UButton>
            <UButton variant="outline" @click="onReset"> {{ $t("console-common.reset") }} </UButton>
        </div>
    </UForm>
</template>
