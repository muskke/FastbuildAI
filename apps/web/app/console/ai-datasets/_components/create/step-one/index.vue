<script setup lang="ts">
import { computed, ref } from "vue";

import type { FileItem } from "@/models/global";

import FilePreview from "../file-preview/index.vue";
import FileUploader from "../file-uploader/index.vue";

const emits = defineEmits<{
    (e: "update:name", v: string): void;
    (e: "update:description", v: string): void;
    (e: "update:fileIds", v: string[]): void;
    (e: "onStepChange"): void;
    (e: "createEmpty"): void;
}>();

const props = defineProps<{
    disabled?: boolean;
    name: string;
    description: string;
}>();

const { t } = useI18n();

const name = useVModel(props, "name", emits);
const description = useVModel(props, "description", emits);

const fileList = ref<FileItem[]>([]);

const canProceed = computed(
    () => fileList.value.length > 0 && fileList.value.every((f) => f.status === "success"),
);

const handleFileListUpdate = (files: FileItem[]) => {
    fileList.value = files;
    emits("update:fileIds", files.map((f) => f.id) as string[]);
};

const selectedSourceId = ref<string>("text");
const DATA_SOURCES = [
    {
        id: "text",
        title: t("datasets.create.dataSources.text.title"),
        description: t("datasets.create.dataSources.text.description"),
        icon: "i-heroicons-document-text",
        disabled: false,
    },
    {
        id: "chat",
        title: t("datasets.create.dataSources.chat.title"),
        description: t("datasets.create.dataSources.chat.description"),
        icon: "i-heroicons-presentation-chart-bar",
        disabled: true,
    },
    {
        id: "web",
        title: t("datasets.create.dataSources.web.title"),
        description: t("datasets.create.dataSources.web.description"),
        icon: "i-heroicons-globe-alt",
        disabled: true,
    },
];

const selectSource = (source: (typeof DATA_SOURCES)[number]) => {
    if (!source.disabled) selectedSourceId.value = source.id;
};
</script>

<template>
    <div class="data-source-selector mx-auto inline-block pt-6">
        <div class="mb-8" v-if="!disabled">
            <h5 class="text-foreground mb-1 text-lg font-medium">
                {{ $t("datasets.create.basicInfo") }}
            </h5>
            <p class="text-muted text-sm">
                {{ $t("datasets.create.basicInfoDesc") }}
            </p>
        </div>

        <div class="space-y-8">
            <div class="flex flex-col space-y-8" v-if="!disabled">
                <UFormField
                    :label="$t('datasets.create.name')"
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex',
                        label: 'text-accent-foreground font-medium width140',
                        container: 'flex-1',
                    }"
                    required
                >
                    <UInput
                        v-model="name"
                        :placeholder="$t('datasets.settings.nameInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>

                <UFormField
                    class="flex w-full justify-between"
                    :ui="{
                        wrapper: 'flex  ',
                        labelWrapper: 'items-stretch ',
                        label: 'text-accent-foreground width140 pt-2',
                        container: 'flex-1',
                    }"
                    :label="$t('datasets.create.description')"
                    required
                >
                    <UTextarea
                        v-model="description"
                        :placeholder="$t('datasets.settings.descriptionInput')"
                        :ui="{ root: 'w-full' }"
                    />
                </UFormField>
            </div>

            <div class="mb-8">
                <h5 class="text-foreground mb-1 text-lg font-medium">
                    {{ $t("datasets.create.selectDataSource") }}
                </h5>
                <p class="text-muted text-sm">
                    {{ $t("datasets.create.selectDataSourceDesc") }}
                </p>
            </div>

            <UFormField
                :label="$t('datasets.create.selectDataSource')"
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width140 pt-2',
                    container: 'flex-1',
                }"
                required
            >
                <div class="flex gap-4">
                    <div
                        v-for="source in DATA_SOURCES"
                        :key="source.id"
                        class="relative cursor-pointer rounded-lg border transition-all duration-200"
                        :class="[
                            selectedSourceId === source.id
                                ? 'border-primary'
                                : 'border-default hover:border-primary border-dashed',
                            source.disabled ? '!cursor-not-allowed' : 'hover:shadow-md',
                        ]"
                        @click="selectSource(source)"
                    >
                        <div class="relative flex items-stretch space-x-3 p-4">
                            <div class="flex-shrink-0">
                                <div
                                    class="border-default flex size-8 items-center justify-center rounded-sm border border-dashed"
                                    :class="{ '!border-solid': selectedSourceId === source.id }"
                                >
                                    <UIcon :name="source.icon" class="size-4" />
                                </div>
                            </div>
                            <div>
                                <h5 class="text-foreground text-sm leading-none">
                                    {{ source.title }}
                                </h5>
                                <p class="text-muted mt-1 w-30 text-xs">
                                    {{ source.description }}
                                </p>
                            </div>
                        </div>
                        <div class="absolute top-[-6px] right-0">
                            <UBadge variant="soft" size="sm" v-if="source.disabled">
                                {{ $t("datasets.create.comingSoon") }}
                            </UBadge>
                        </div>
                    </div>
                </div>
            </UFormField>

            <UFormField
                :label="$t('datasets.create.uploadTextFile')"
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width140 pt-2',
                    container: 'flex-1',
                }"
                required
            >
                <FileUploader :file-list="fileList" @update:fileList="handleFileListUpdate" />
            </UFormField>
            <UFormField
                v-if="fileList.length"
                :label="$t('datasets.create.fileList')"
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width140 pt-2',
                    container: 'flex-1',
                }"
                required
            >
                <FilePreview :file-list="fileList" @update:fileList="handleFileListUpdate" />
            </UFormField>

            <UFormField
                label=" "
                class="flex w-full justify-between"
                :ui="{
                    wrapper: 'flex  ',
                    labelWrapper: 'items-stretch ',
                    label: 'text-accent-foreground width140 pt-2',
                    container: 'flex-1 flex gap-4 items-center',
                }"
            >
                <UButton
                    trailing-icon="i-lucide-arrow-right"
                    :label="$t('datasets.create.nextStep')"
                    :disabled="!canProceed"
                    size="lg"
                    @click="emits('onStepChange')"
                />


                <UButton
                 v-if="!disabled"
                        leading-icon="i-lucide-folder"
                        color="primary"
                        variant="link"
                        size="lg"
                        @click="emits('createEmpty')"
                    >
                        {{ $t("datasets.create.createEmpty") }}
                    </UButton>
            </UFormField>

            <template>
                <USeparator />
            </template>
        </div>
    </div>
</template>
