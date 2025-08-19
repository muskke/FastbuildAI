<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui";
import { computed, ref, watch } from "vue";

import type { FileItem } from "@/models/global";
import { apiUploadFile } from "@/services/common";

const FILE_STATUS = Object.freeze({
    PENDING: "pending",
    UPLOADING: "uploading",
    SUCCESS: "success",
    ERROR: "error",
} as const);

const emit = defineEmits<{
    (e: "update:fileList", files: FileItem[]): void;
}>();

const props = defineProps<{
    fileList?: FileItem[];
}>();

const UPLOAD_CONFIG = Object.freeze({
    maxSize: 15,
    maxCount: 10,
    supportedTypes: ["TXT", "MARKDOWN", "DOCX"],
    accept: ".txt,.md,.docx",
});

const { t } = useI18n();
const toast = useMessage();
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const files = ref<FileItem[]>([]);

// 同步外部传入的 fileList
watch(
    () => props.fileList,
    (val) => {
        if (val && val.length !== files.value.length) {
            files.value = [...val];
        }
    },
    { immediate: true },
);

const generateId = () => `file_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const validateFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    // if (!UPLOAD_CONFIG.supportedTypes.includes(ext)) {
    //     return { valid: false, error: t("console-ai-datasets.create.file.unsupportedFileType", { ext }) };
    // }
    // 只允许 txt 和 docx 文件
    if (ext !== "TXT" && ext !== "DOCX") {
        return {
            valid: false,
            error: t("console-ai-datasets.create.file.unsupportedFileType", { ext }),
        };
    }
    if (file.size > UPLOAD_CONFIG.maxSize * 1024 * 1024) {
        return {
            valid: false,
            error: t("console-ai-datasets.create.file.fileTooLarge", {
                maxSize: UPLOAD_CONFIG.maxSize,
            }),
        };
    }
    return { valid: true };
};

const updateFile = (id: string, patch: Partial<FileItem>) => {
    const item = files.value.find((f) => f.id === id);
    if (item) Object.assign(item, patch);
};

const addFiles = async (fileList: File[]) => {
    if (files.value.length + fileList.length > UPLOAD_CONFIG.maxCount) {
        throw new Error(`最多只能上传 ${UPLOAD_CONFIG.maxCount} 个文件`);
    }

    const newItems = fileList
        .map((file) => {
            const { valid, error } = validateFile(file);
            return valid
                ? { id: generateId(), file, status: FILE_STATUS.PENDING, progress: 0 }
                : (toast.warning(`${file.name}: ${error}`), null);
        })
        .filter(Boolean) as FileItem[];

    files.value.push(...newItems);
    emit("update:fileList", [...files.value]);
    await uploadFiles(newItems);
};

const uploadFiles = async (items: FileItem[]) => {
    for (const item of items) {
        // 检查是否有文件对象
        if (!item.file || !item.id) {
            console.warn("文件对象或ID缺失，跳过上传");
            continue;
        }

        try {
            updateFile(item.id, { status: FILE_STATUS.UPLOADING, progress: 0 });

            const uploadResult = await apiUploadFile(
                { file: item.file, description: "datasets files" },
                {
                    onProgress: (progress) => updateFile(item.id!, { progress }),
                },
            );

            // 处理上传结果，更新文件信息
            updateFile(item.id, {
                status: FILE_STATUS.SUCCESS,
                progress: 100,
                id: uploadResult.id,
                url: uploadResult.url,
                originalName: uploadResult.originalName,
                size: uploadResult.size,
                type: uploadResult.type as "document",
                extension: uploadResult.extension,
            });
        } catch (err) {
            console.error(`上传失败: ${item.file.name}`, err);
            updateFile(item.id, {
                status: FILE_STATUS.ERROR,
                error: t("console-ai-datasets.create.file.uploadFailed"),
            });
        }
    }

    emit("update:fileList", [...files.value]);
};

const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (selected.length) addFiles(selected);
    input.value = "";
};

const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
    addFiles(Array.from(e.dataTransfer?.files || []));
};

const handleDropOver = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
};
</script>

<template>
    <div>
        <div
            class="bg-muted rounded-lg border border-dashed p-6 text-center transition-all duration-200"
            :class="[
                isDragging ? 'border-primary bg-primary-50' : 'border-default hover:border-primary',
            ]"
            @drop="handleDrop"
            @dragover="handleDropOver"
            @dragleave="isDragging = false"
        >
            <div class="flex flex-col items-center space-y-2">
                <div class="flex w-full items-center justify-center">
                    <UIcon name="i-heroicons-cloud-arrow-up" class="text-muted-foreground size-6" />
                    <UButton color="neutral" variant="link">
                        {{ t("console-ai-datasets.create.file.dragOrSelectFiles") }}
                    </UButton>
                    <UButton color="primary" variant="link" @click="fileInputRef?.click()">
                        {{ t("console-ai-datasets.create.file.chooseFile") }}
                    </UButton>
                </div>
                <div class="text-muted-foreground text-sm">
                    <p>
                        {{
                            t("console-ai-datasets.create.file.supportedTypes", {
                                types: UPLOAD_CONFIG.supportedTypes.join(", "),
                            })
                        }}
                    </p>
                    <p>
                        {{
                            t("console-ai-datasets.create.file.fileSizeLimit", {
                                maxSize: UPLOAD_CONFIG.maxSize,
                            })
                        }}
                    </p>
                </div>
            </div>

            <input
                ref="fileInputRef"
                type="file"
                multiple
                class="hidden"
                :accept="UPLOAD_CONFIG.accept"
                @change="handleFileSelect"
            />
        </div>

        <div class="text-muted-foreground mt-2 text-sm">
            {{ t("console-ai-datasets.create.file.comingSoon") }}
        </div>
    </div>
</template>
