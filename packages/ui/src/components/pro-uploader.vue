<script setup lang="ts">
import { getFileIcon } from "@fastbuildai/assets/images/files/index.ts";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import type { Composer } from "vue-i18n";

import { apiUploadFile, apiUploadFiles } from "@/services/common";

import { useImagePreview } from "../composables/useImagePreview";
import { useMessage } from "../composables/useMessage";

/**
 * 上传状态常量
 */
const UPLOAD_STATUS = {
    INITIAL: 0,
    UPLOADING: 1,
    SUCCESS: 2,
    FAIL: 3,
} as const;

/**
 * 上传项接口
 */
interface UploadItem {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    progress: number;
    status: number;
    error?: string;
    file?: File;
    extension?: string;
    isImage?: boolean;
    imageLoadError?: boolean;
}

const props = defineProps<{
    modelValue?: string | string[];
    type?: "image" | "video" | "file";
    single?: boolean;
    maxCount?: number;
    accept?: string;
    maxSize?: number;
    text?: string;
    icon?: string;
    class?: string;
    disabled?: boolean;
    progressText?: string;
    finishProgressText?: string;
    multiple?: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string | string[]];
    success: [file: UploadItem, response: any];
    error: [file: UploadItem, error: any];
    progress: [file: UploadItem, percent: number];
    exceed: [files: File[]];
    change: [file: UploadItem];
    remove: [file: UploadItem];
}>();

const { $i18n } = useNuxtApp();
const { t } = $i18n as Composer;

// 状态变量
const fileList = ref<UploadItem[]>([]);
const fileInputRef = useTemplateRef("fileInputRef");
const globalProgress = ref(0);
const showGlobalProgress = ref(false);
const errorMessage = ref("");
const replacingIndex = ref<number | null>(null);
const componentId = ref(`pro-uploader-${generateUniqueId()}`);
const message = useMessage();

// 计算属性
const customClassName = computed(() => props.class || "h-28 w-full");
const showAddButton = computed(() =>
    props.single
        ? fileList.value.length === 0
        : props.maxCount
          ? fileList.value.length < props.maxCount
          : true,
);

// 监听modelValue变化，初始化文件列表
watch(() => props.modelValue, initFileList, { immediate: true });

/**
 * 初始化文件列表
 */
function initFileList() {
    fileList.value = [];
    if (!props.modelValue) return;

    if (props.single && typeof props.modelValue === "string" && props.modelValue) {
        const fileName = getFileNameFromUrl(props.modelValue);
        const extension = getFileExtension(fileName);
        fileList.value = [
            {
                id: generateUniqueId(),
                name: fileName,
                size: 0,
                type: getFileTypeFromExtension(extension),
                url: props.modelValue,
                progress: 100,
                status: UPLOAD_STATUS.SUCCESS,
                extension,
                isImage: isImageByExtension(extension),
            },
        ];
    } else if (Array.isArray(props.modelValue)) {
        fileList.value = props.modelValue.map((url) => {
            const fileName = getFileNameFromUrl(url);
            const extension = getFileExtension(fileName);
            return {
                id: generateUniqueId(),
                name: fileName,
                size: 0,
                type: getFileTypeFromExtension(extension),
                url,
                progress: 100,
                status: UPLOAD_STATUS.SUCCESS,
                extension,
                isImage: isImageByExtension(extension),
            };
        });
    }
}

/**
 * 处理文件上传
 */
async function handleFileUpload(event: Event) {
    try {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || !files.length) return;

        errorMessage.value = "";

        // 多文件上传处理
        if (props.multiple && files.length > 1 && !props.single) {
            await handleMultipleFilesUpload(files);
        } else {
            // 单文件上传处理
            const file = files[0];
            if (!validateFile(file)) return;

            const uploadItem = createUploadItem(file);
            addOrReplaceFile(uploadItem);
            await uploadAndProcessFile(uploadItem);
        }
    } finally {
        // 重置input
        nextTick(() => {
            const input = fileInputRef.value as HTMLInputElement;
            if (input) {
                input.value = "";
            }
        });
    }
}

/**
 * 处理多文件上传
 */
async function handleMultipleFilesUpload(files: FileList) {
    // 检查文件数量限制
    if (props.maxCount && fileList.value.length + files.length > props.maxCount) {
        message.warning(t("console-common.messages.maxCount", { count: props.maxCount }));
        emit("exceed", Array.from(files));
        return;
    }

    // 验证文件
    const validFiles = Array.from(files).filter(validateFile);
    if (!validFiles.length) return;

    // 显示进度条
    showGlobalProgress.value = true;
    globalProgress.value = 0;

    try {
        // 上传文件
        const response = await apiUploadFiles(
            { files: validFiles },
            {
                onProgress: (progress: number) => {
                    globalProgress.value = progress;
                },
            },
        );

        // 处理上传成功
        if (Array.isArray(response)) {
            response.forEach((fileResponse) => {
                const uploadItem: UploadItem = {
                    id: generateUniqueId(),
                    name: fileResponse.originalName,
                    size: fileResponse.size,
                    type: fileResponse.type,
                    url: fileResponse.url,
                    progress: 100,
                    status: UPLOAD_STATUS.SUCCESS,
                    extension: fileResponse.extension,
                    isImage: isImageByExtension(fileResponse.extension),
                };

                fileList.value.push(uploadItem);
                emit("success", uploadItem, fileResponse);
            });

            updateModelValue();
            message.success(t("console-common.messages.uploadSuccess"));
        }
    } catch (error: any) {
        console.error("文件上传失败:", error);
        message.error(error?.message || t("console-common.messages.uploadFailed"));
    } finally {
        setTimeout(() => {
            showGlobalProgress.value = false;
        }, 500);
    }
}

/**
 * 上传单个文件并处理结果
 */
async function uploadAndProcessFile(uploadItem: UploadItem) {
    if (!uploadItem.file) {
        console.error("上传文件不存在");
        return;
    }

    showGlobalProgress.value = true;
    globalProgress.value = 0;

    try {
        const response = await apiUploadFile(
            { file: uploadItem.file },
            {
                onProgress: (progress: number) => {
                    const index = fileList.value.findIndex((file) => file.id === uploadItem.id);

                    if (index !== -1) {
                        fileList.value[index].progress = progress;
                        globalProgress.value = progress;
                        emit("progress", fileList.value[index], progress);
                    }
                },
            },
        );

        // 处理上传成功
        const index = fileList.value.findIndex((file) => file.id === uploadItem.id);
        if (index !== -1) {
            fileList.value[index].progress = 100;
            fileList.value[index].status = UPLOAD_STATUS.SUCCESS;

            if (response) {
                fileList.value[index].url = response.url;
                fileList.value[index].extension = response.extension;
            }

            updateModelValue();
            emit("success", fileList.value[index], response);

            setTimeout(() => {
                message.success(t("console-common.messages.uploadSuccess"));
            }, 1000);
        }
    } catch (error: any) {
        const index = fileList.value.findIndex((file) => file.id === uploadItem.id);
        if (index !== -1) {
            emit("error", fileList.value[index], error);
            removeFile(index);
        }

        console.error("文件上传失败:", error);
        message.error(error?.message || "上传失败");
    } finally {
        setTimeout(() => {
            showGlobalProgress.value = false;
        }, 500);
    }
}

/**
 * 创建上传项
 */
function createUploadItem(file: File): UploadItem {
    const extension = getFileExtension(file.name);
    return {
        id: generateUniqueId(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        progress: 0,
        status: UPLOAD_STATUS.UPLOADING,
        file,
        extension,
        isImage: file.type.startsWith("image/"),
    };
}

/**
 * 添加或替换文件
 */
function addOrReplaceFile(uploadItem: UploadItem): boolean {
    // 替换特定文件
    if (replacingIndex.value !== null && !props.single) {
        fileList.value.splice(replacingIndex.value, 1, uploadItem);
        replacingIndex.value = null;
        emit("change", uploadItem);
        return true;
    }

    // 单文件模式
    if (props.single) {
        fileList.value = [uploadItem];
        emit("change", uploadItem);
        return true;
    }

    // 多文件模式，检查数量限制
    if (props.maxCount && fileList.value.length >= props.maxCount) {
        message.warning(t("console-common.messages.maxCount", { count: props.maxCount }));
        emit("exceed", [uploadItem.file!]);
        return false;
    }

    // 多文件模式，添加新文件
    fileList.value.push(uploadItem);
    emit("change", uploadItem);
    return true;
}

/**
 * 预览文件
 */
function previewFile(item: UploadItem, index: number) {
    if (item.isImage) {
        const imageUrls = Array.isArray(props.modelValue)
            ? (props.modelValue.filter((url) => url) as string[])
            : props.modelValue
              ? [props.modelValue]
              : [];

        useImagePreview(imageUrls, index);
    } else {
        window.open(item.url, "_blank");
    }
}

/**
 * 重新选择文件
 */
function reSelectFile(index: number) {
    replacingIndex.value = index;
    // 通过DOM查询找到对应的input元素
    const inputElement = document.getElementById(componentId.value) as HTMLInputElement;
    if (inputElement) {
        inputElement.click();
    }
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: Event, item: UploadItem) {
    item.imageLoadError = true;
}

/**
 * 移除文件
 */
function removeFile(index: number) {
    const file = fileList.value[index];
    if (file.url.startsWith("blob:")) URL.revokeObjectURL(file.url);

    fileList.value.splice(index, 1);
    updateModelValue();
    emit("remove", file);
}

/**
 * 更新modelValue
 */
function updateModelValue() {
    const urls = fileList.value
        .filter((item) => item.status === UPLOAD_STATUS.SUCCESS)
        .map((item) => item.url);

    emit("update:modelValue", props.single ? urls[0] : urls);
}

/**
 * 验证文件
 */
function validateFile(file: File): boolean {
    const maxSize = props.maxSize || 5;

    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
        const msg = t("console-common.messages.fileSizeTooLarge", {
            size: formatFileSize(maxSize * 1024 * 1024),
        });
        errorMessage.value = msg;
        message.warning(msg);
        return false;
    }

    // 检查文件类型
    if (props.accept && !isAcceptFile(file)) {
        const msg = t("console-common.messages.fileTypeNotMatch");
        errorMessage.value = msg;
        message.warning(msg);
        return false;
    }

    return true;
}

/**
 * 检查文件类型是否符合accept属性
 */
function isAcceptFile(file: File): boolean {
    if (!props.accept) return true;

    const acceptTypes = props.accept.split(",").map((type) => type.trim());

    return acceptTypes.some((acceptType) => {
        if (acceptType === "*") return true;

        if (acceptType.startsWith(".")) {
            const extension = `.${getFileExtension(file.name)}`;
            return extension === acceptType.toLowerCase();
        } else if (acceptType.endsWith("/*")) {
            const mainType = acceptType.split("/")[0];
            return file.type.startsWith(`${mainType}/`);
        }

        return file.type === acceptType;
    });
}

/**
 * 从文件名获取扩展名
 */
function getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * 从URL中获取文件名
 */
function getFileNameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(urlObj.pathname.lastIndexOf("/") + 1);
    } catch (e) {
        return url.substring(url.lastIndexOf("/") + 1);
    }
}

/**
 * 根据扩展名判断是否为图片
 */
function isImageByExtension(extension: string): boolean {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    return imageExtensions.includes(extension.toLowerCase());
}

/**
 * 根据扩展名获取文件类型
 */
function getFileTypeFromExtension(extension: string): string {
    if (isImageByExtension(extension)) return "image";

    const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi"];
    if (videoExtensions.includes(extension.toLowerCase())) return "video";

    return "file";
}

/**
 * 生成唯一ID
 */
function generateUniqueId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
}

/**
 * 格式化文件大小
 */
function formatFileSize(size: number): string {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    if (size < KB) return `${size} B`;
    if (size < MB) return `${(size / KB).toFixed(2)} KB`;
    if (size < GB) return `${(size / MB).toFixed(2)} MB`;
    return `${(size / GB).toFixed(2)} GB`;
}
</script>

<template>
    <div class="pro-uploader">
        <!-- 已上传的文件列表 -->
        <div class="file-list" :class="{ 'flex flex-wrap gap-4': !single && fileList.length > 0 }">
            <div
                v-for="(item, index) in fileList"
                :key="item.id"
                class="form-input focus-within:ring-primary-500 dark:focus-within:ring-primary-400 file:text-muted-foreground relative block rounded-md border-0 bg-gray-50 p-0 text-sm text-gray-900 placeholder-gray-400 shadow-sm ring-1 ring-gray-300 ring-inset file:mr-1.5 file:border-0 file:bg-transparent file:p-0 file:font-medium file:outline-none focus-within:ring-2 focus-within:outline-none dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:ring-gray-700 dark:file:text-gray-400"
                :class="[customClassName]"
            >
                <div class="group absolute inset-0 z-[1] size-full cursor-pointer rounded-md">
                    <!-- 图片文件显示图片,加载失败时显示文件图标 -->
                    <img
                        v-if="!item.imageLoadError"
                        :src="item.url"
                        class="size-full rounded-md object-contain"
                        alt=""
                        @error="(e) => handleImageError(e, item)"
                    />

                    <!-- 图片加载失败时的备用显示 -->
                    <div v-else class="flex size-full flex-col items-center justify-center">
                        <img :src="getFileIcon(item.name)" class="size-12 object-contain" alt="" />
                        <p class="text-accent-foreground mt-2 max-w-full truncate px-2 text-xs">
                            {{ item.name }}
                        </p>
                    </div>

                    <!-- 上传中状态 -->
                    <div
                        v-if="item.status === UPLOAD_STATUS.UPLOADING"
                        class="absolute inset-0 z-50 flex size-full flex-col items-center justify-center overflow-hidden rounded-md px-4 backdrop-blur-lg"
                    >
                        <UProgress class="my-2" v-model="item.progress" />
                        <p class="text-xs text-white">
                            {{
                                item.progress === 100
                                    ? finishProgressText ||
                                      t("console-common.messages.uploadSuccess")
                                    : progressText || t("console-common.messages.uploading")
                            }}
                        </p>
                    </div>

                    <!-- 操作按钮 -->
                    <div
                        v-else
                        class="absolute inset-0 z-10 flex w-full items-center justify-around overflow-hidden rounded-b-md bg-black/30 opacity-0 transition-all duration-200 group-hover:opacity-100 dark:bg-gray-800/80"
                    >
                        <span
                            class="hover:bg-primary transition-color flex size-6 cursor-pointer items-center justify-center rounded-lg"
                            @click.stop="previewFile(item, index)"
                            title="预览"
                        >
                            <UIcon name="i-lucide-eye" class="text-white" />
                        </span>
                        <span
                            class="hover:bg-primary flex size-6 cursor-pointer items-center justify-center rounded-lg transition-colors"
                            @click.stop="reSelectFile(index)"
                            title="重新选择"
                        >
                            <UIcon name="tabler:reload" class="text-white" />
                        </span>
                        <span
                            class="flex size-6 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-red-500"
                            @click.stop="removeFile(index)"
                            title="删除"
                        >
                            <UIcon name="tabler:trash" class="text-white" />
                        </span>
                    </div>
                </div>
            </div>

            <!-- 添加文件按钮 -->
            <div
                v-show="showAddButton"
                class="hover:border-primary-500 dark:hover:border-primary-400 relative block rounded-md border border-dashed border-gray-300 p-0 text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200 dark:border-gray-700"
                :class="[
                    customClassName,
                    disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                ]"
            >
                <UInput
                    :id="componentId"
                    ref="fileInputRef"
                    type="file"
                    class="size-full"
                    :disabled="disabled"
                    :multiple="multiple && !single"
                    :ui="{ base: 'inset-0 w-full h-full cursor-pointer opacity-0' }"
                    :accept="accept"
                    @change="handleFileUpload"
                />
                <div class="pointer-events-none absolute top-0 z-[1] size-full rounded-md">
                    <div
                        class="dark:text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-gray-400"
                    >
                        <UIcon
                            :name="icon || 'tabler:upload'"
                            class="text-2xl"
                            :class="errorMessage ? 'text-red-500' : ''"
                        />
                        <p v-if="errorMessage" class="text-xs text-red-500">{{ errorMessage }}</p>
                        <p v-else class="text-xs">
                            {{ text || t("console-common.clickUploadFile") }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 全局上传进度 -->
        <div
            v-if="showGlobalProgress"
            :timeout="0"
            class="fixed right-4 bottom-4 z-50 w-64 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
            color="primary"
        >
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">{{
                        t("console-common.messages.progress")
                    }}</span>
                    <span class="text-xs">{{ globalProgress }}%</span>
                </div>
                <UProgress v-model="globalProgress" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
:deep(input[type="file"]) {
    &::-webkit-file-upload-button {
        opacity: 0 !important;
    }
}
</style>
