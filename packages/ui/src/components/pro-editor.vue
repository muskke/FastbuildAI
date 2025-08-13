<script lang="ts" setup>
import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";
import { useVModel } from "@vueuse/core";
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

import { apiUploadFile } from "@/services/common";

const emits = defineEmits<{
    (event: "update:modelValue", value: string): void;
}>();

const props = withDefaults(
    defineProps<{
        /**
         * 受控内容，HTML 字符串
         */
        modelValue: string;
        /**
         * 自定义样式类
         */
        customClass?: string;
        /**
         * 占位提示
         */
        placeholder?: string;
    }>(),
    {
        customClass: "",
        placeholder: "请输入内容...",
    },
);

const content = useVModel(props, "modelValue", emits);

const editor = shallowRef<any | null>(null);
const uiRefresh = ref(0);

onMounted(() => {
    editor.value = new Editor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image,
            Placeholder.configure({ placeholder: props.placeholder }),
            Color.configure({ types: [TextStyle.name, ListItem.name] }),
            TextStyle,
        ],
        content: content.value || "",
        autofocus: false,
        injectCSS: false,
        editorProps: {
            attributes: { class: "prose prose-sm focus:outline-none" },
        },
        onUpdate: ({ editor }: { editor: any }) => {
            content.value = editor.getHTML();
        },
    });

    // 首次渲染后自动聚焦到末尾，优化编辑体验
    nextTick(() => {
        editor.value?.commands.focus("end");
    });

    // 监听编辑器状态变化以刷新工具栏激活/禁用态
    const bump = () => (uiRefresh.value = (uiRefresh.value + 1) % 1_000_000);
    editor.value?.on("selectionUpdate", bump);
    editor.value?.on("transaction", bump);
    editor.value?.on("update", bump);
});

onBeforeUnmount(() => {
    editor.value?.destroy();
    editor.value = null;
});

// 外部变更时同步到编辑器
watch(
    () => content.value,
    (val) => {
        if (!editor.value) return;
        if (val !== editor.value.getHTML()) {
            editor.value.commands.setContent(val || "", false);
        }
    },
);

async function handlePickAndInsertImage() {
    if (!editor.value) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.gif,.webp";
    input.multiple = true;
    input.onchange = async () => {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const uploaded = await Promise.all(
            files.map(
                (file) =>
                    new Promise<{ url: string }>((resolve, reject) => {
                        apiUploadFile({ file, description: "editor" })
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    }),
            ),
        );
        uploaded.forEach(({ url }) => {
            editor.value!.chain().focus().setImage({ src: url }).run();
        });
    };
    input.click();
}

function toggleMark(mark: "bold" | "italic" | "strike" | "underline") {
    if (!editor.value) return;
    const chain = editor.value.chain().focus();
    if (mark === "bold") chain.toggleBold().run();
    if (mark === "italic") chain.toggleItalic().run();
    if (mark === "strike") chain.toggleStrike().run();
    if (mark === "underline") chain.toggleUnderline().run();
}

function setParagraph() {
    editor.value?.chain().focus().setParagraph().run();
}
function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
    editor.value?.chain().focus().toggleHeading({ level }).run();
}
function toggleBulletList() {
    editor.value?.chain().focus().toggleBulletList().run();
}
function toggleOrderedList() {
    editor.value?.chain().focus().toggleOrderedList().run();
}
function toggleBlockquote() {
    editor.value?.chain().focus().toggleBlockquote().run();
}
function toggleCodeBlock() {
    editor.value?.chain().focus().toggleCodeBlock().run();
}
function clearMarks() {
    editor.value?.chain().focus().unsetAllMarks().run();
}
function clearNodes() {
    editor.value?.chain().focus().clearNodes().run();
}
function insertHorizontalRule() {
    editor.value?.chain().focus().setHorizontalRule().run();
}
function insertHardBreak() {
    editor.value?.chain().focus().setHardBreak().run();
}
function toggleInlineCode() {
    editor.value?.chain().focus().toggleCode().run();
}
function setTextColor(color: string) {
    editor.value?.chain().focus().setColor(color).run();
}
function undo() {
    editor.value?.chain().focus().undo().run();
}
function redo() {
    editor.value?.chain().focus().redo().run();
}
</script>

<template>
    <div class="rounded-md border border-gray-200/60 dark:border-gray-700/60" :class="customClass">
        <!-- 工具栏 -->
        <div
            class="flex flex-wrap items-center gap-1 border-b border-gray-200/60 p-2 dark:border-gray-700/60"
        >
            <!-- 行内样式 -->
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleBold().run()"
                :color="editor?.isActive('bold') ? 'primary' : undefined"
                @click="toggleMark('bold')"
            >
                B
            </UButton>
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleItalic().run()"
                :color="editor?.isActive('italic') ? 'primary' : undefined"
                @click="toggleMark('italic')"
            >
                <i>I</i>
            </UButton>
            <UButton
                size="xs"
                variant="ghost"
                :color="editor?.isActive('underline') ? 'primary' : undefined"
                @click="toggleMark('underline')"
            >
                <u>U</u>
            </UButton>
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleStrike().run()"
                :color="editor?.isActive('strike') ? 'primary' : undefined"
                @click="toggleMark('strike')"
            >
                <s>S</s>
            </UButton>
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleCode().run()"
                :color="editor?.isActive('code') ? 'primary' : undefined"
                @click="toggleInlineCode"
            >
                { }
            </UButton>
            <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700"></span>

            <!-- 段落与标题 -->
            <UButton
                size="xs"
                variant="ghost"
                :color="editor?.isActive('paragraph') ? 'primary' : undefined"
                @click="setParagraph"
                >P</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 1 }).run()"
                :color="editor?.isActive('heading', { level: 1 }) ? 'primary' : undefined"
                @click="setHeading(1)"
                >H1</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 2 }).run()"
                :color="editor?.isActive('heading', { level: 2 }) ? 'primary' : undefined"
                @click="setHeading(2)"
                >H2</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 3 }).run()"
                :color="editor?.isActive('heading', { level: 3 }) ? 'primary' : undefined"
                @click="setHeading(3)"
                >H3</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 4 }).run()"
                :color="editor?.isActive('heading', { level: 4 }) ? 'primary' : undefined"
                @click="setHeading(4)"
                >H4</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 5 }).run()"
                :color="editor?.isActive('heading', { level: 5 }) ? 'primary' : undefined"
                @click="setHeading(5)"
                >H5</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleHeading({ level: 6 }).run()"
                :color="editor?.isActive('heading', { level: 6 }) ? 'primary' : undefined"
                @click="setHeading(6)"
                >H6</UButton
            >
            <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700"></span>

            <!-- 列表/引用/代码块 -->
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleBulletList().run()"
                :color="editor?.isActive('bulletList') ? 'primary' : undefined"
                @click="toggleBulletList"
                >• List</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleOrderedList().run()"
                :color="editor?.isActive('orderedList') ? 'primary' : undefined"
                @click="toggleOrderedList"
                >1. List</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleBlockquote().run()"
                :color="editor?.isActive('blockquote') ? 'primary' : undefined"
                @click="toggleBlockquote"
                >“”</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().toggleCodeBlock().run()"
                :color="editor?.isActive('codeBlock') ? 'primary' : undefined"
                @click="toggleCodeBlock"
                >{ }</UButton
            >
            <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700"></span>

            <!-- 图片与清理 -->
            <UButton size="xs" variant="soft" @click="handlePickAndInsertImage">Img</UButton>
            <UButton size="xs" variant="ghost" @click="clearMarks">Clear marks</UButton>
            <UButton size="xs" variant="ghost" @click="clearNodes">Clear nodes</UButton>
            <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700"></span>

            <!-- 撤销/重做 与 分隔 -->
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().undo().run()"
                @click="undo"
                >Undo</UButton
            >
            <UButton
                size="xs"
                variant="ghost"
                :disabled="!editor?.can().chain().focus().redo().run()"
                @click="redo"
                >Redo</UButton
            >
            <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700"></span>

            <!-- 水平线/硬回车/颜色示例 -->
            <UButton size="xs" variant="ghost" @click="insertHorizontalRule">HR</UButton>
            <UButton size="xs" variant="ghost" @click="insertHardBreak">BR</UButton>
            <UButton
                size="xs"
                variant="ghost"
                :color="editor?.isActive('textStyle', { color: '#958DF1' }) ? 'primary' : undefined"
                @click="setTextColor('#958DF1')"
                >Purple</UButton
            >
        </div>

        <!-- 编辑区域 -->
        <div class="min-h-48 p-3">
            <EditorContent v-if="editor" :editor="editor as any" />
        </div>
    </div>
</template>

<style lang="scss">
/* Basic editor styles */
.tiptap {
    :first-child {
        margin-top: 0;
    }

    /* List styles */
    ul,
    ol {
        padding: 0 1rem;
        margin: 1.25rem 1rem 1.25rem 0.4rem;

        li p {
            margin-top: 0.25em;
            margin-bottom: 0.25em;
        }
    }

    /* Heading styles */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        line-height: 1.1;
        margin-top: 2.5rem;
        text-wrap: pretty;
    }

    h1,
    h2 {
        margin-top: 3.5rem;
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.4rem;
    }

    h2 {
        font-size: 1.2rem;
    }

    h3 {
        font-size: 1.1rem;
    }

    h4,
    h5,
    h6 {
        font-size: 1rem;
    }

    /* Code and preformatted text styles */
    code {
        background-color: var(--purple-light);
        border-radius: 0.4rem;
        color: var(--black);
        font-size: 0.85rem;
        padding: 0.25em 0.3em;
    }

    pre {
        background: var(--black);
        border-radius: 0.5rem;
        color: var(--white);
        font-family: "JetBrainsMono", monospace;
        margin: 1.5rem 0;
        padding: 0.75rem 1rem;

        code {
            background: none;
            color: inherit;
            font-size: 0.8rem;
            padding: 0;
        }
    }

    blockquote {
        border-left: 3px solid var(--gray-3);
        margin: 1.5rem 0;
        padding-left: 1rem;
    }

    hr {
        border: none;
        border-top: 1px solid var(--gray-2);
        margin: 2rem 0;
    }
}
</style>
