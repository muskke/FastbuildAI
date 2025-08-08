<script lang="ts" setup>
import "md-editor-v3/lib/style.css";

import { useColorMode, useVModel } from "@vueuse/core";
import { MdEditor, type Themes, type ToolbarNames } from "md-editor-v3";

import { apiUploadFile } from "@/services/common";

const emits = defineEmits<{
    (event: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
    defineProps<{
        modelValue: string;
        preview?: boolean;
        customClass?: string;
    }>(),
    {},
);

const colorMode = useColorMode();
const content = useVModel(props, "modelValue", emits);
const toolbars: ToolbarNames[] = [
    "bold",
    "underline",
    "italic",
    "strikeThrough",
    "-",
    "title",
    "sub",
    "sup",
    "quote",
    "unorderedList",
    "orderedList",
    "task",
    "-",
    "codeRow",
    "code",
    "link",
    "image",
    "table",
    // "mermaid",
    // "katex",
    "-",
    "revoke",
    "next",
    "=",
    "prettier",
    "pageFullscreen",
    "fullscreen",
    "catalog",
].filter(Boolean) as ToolbarNames[];

/**
 * 处理图片上传并返回上传后的图片 URL。
 * 并在所有图片上传成功后通过回调函数返回上传后的图片 URL 数组。
 *
 * @param {File[]} files - 要上传的图片文件数组。
 * @param {(url: string[]) => void} callback - 上传完成后的回调函数，接收一个包含上传图片 URL 的字符串数组作为参数。
 * 回调函数会在所有图片上传成功后被调用。
 *
 * @returns {Promise<void>} 一个 Promise，当所有文件上传并调用回调函数后解析。
 */
async function handleUploadImage(files: File[], callback: (url: string[]) => void) {
    const res: { url: string }[] = await Promise.all(
        files.map((file) => {
            return new Promise<{ url: string }>((rev, rej) => {
                apiUploadFile({ file, description: "editor" })
                    .then((res) => rev(res))
                    .catch((error) => rej(error));
            });
        }),
    );

    callback(res.map((item) => item.url));
}
</script>

<template>
    <MdEditor
        v-model="content"
        class="rounded-md"
        :class="customClass"
        :no-mermaid="true"
        :no-katex="true"
        :theme="colorMode as Themes"
        :toolbars="toolbars"
        @onUploadImg="handleUploadImage"
    />
</template>
