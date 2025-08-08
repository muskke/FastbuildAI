<script setup lang="ts">
/**
 * ProModal 组件
 *
 * 基于 Nuxt UI 的 Modal 组件封装，提供更多便捷功能和自定义选项
 *
 * @example
 * <ProModal v-model="isOpen" title="我的标题">
 *   <template #trigger>
 *     <UButton>打开弹窗</UButton>
 *   </template>
 *   <div>弹窗内容</div>
 *   <template #footer>
 *     <div class="flex justify-end gap-2">
 *       <UButton @click="isOpen = false">取消</UButton>
 *       <UButton color="primary" @click="isOpen = false">确认</UButton>
 *     </div>
 *   </template>
 * </ProModal>
 */
const props = withDefaults(
    defineProps<{
        /** 弹窗标题 */
        title?: string;
        /** 弹窗描述文本 */
        description?: string;
        /** 是否启用过渡动画 */
        transition?: boolean;
        /** 是否全屏显示 */
        fullscreen?: boolean;
        /** 阻止点击外部关闭 */
        dismissible?: boolean;
        /** 是否显示遮罩层 */
        overlay?: boolean;
        /** 在门户中渲染模态。 */
        portal?: boolean;
        /** 弹窗显示状态，可通过 v-model 绑定 */
        modelValue?: boolean;
        /** 是否禁用关闭按钮 */
        disabledClose?: boolean;
        /** 内容区域的 ID，用于无障碍访问 */
        contentId?: string;
        /** 自定义关闭按钮图标 */
        closeIcon?: string;
        /** 是否在 ESC 键按下时关闭弹窗 */
        closeOnEsc?: boolean;
        /** 是否显示页脚区域 */
        showFooter?: boolean;
        /** 自定义 UI 类名 */
        ui?: Partial<{
            wrapper: string;
            container: string;
            content: string;
            header: string;
            body: string;
            footer: string;
            close: string;
        }>;
    }>(),
    {
        title: "标题",
        transition: true,
        fullscreen: false,
        dismissible: false,
        overlay: true,
        portal: true,
        disabledClose: false,
        modelValue: false,
        width: "sm",
        contentId: "",
        position: "center",
        closeIcon: "tabler:x",
        closeOnEsc: true,
        showFooter: false,
        ui: () => ({}),
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
    (e: "close", v: void): void;
    (e: "open", v: void): void;
    (e: "confirm", v: void): void;
}>();

const isOpen = useVModel(props, "modelValue", emit);

/** 关闭弹窗 */
function close() {
    if (props.disabledClose) return;
    isOpen.value = false;
    emit("close");
}

/** 确认按钮点击事件 */
function confirm() {
    isOpen.value = false;
    emit("confirm");
}

/** 打开弹窗 */
function open() {
    isOpen.value = true;
    emit("open");
}

/** 监听弹窗打开状态 */
watch(isOpen, (val: boolean) => {
    if (val) {
        emit("open");
    }
});

/** 快捷键支持 */
defineShortcuts({
    // 使用 Alt+O 切换弹窗状态
    "alt+o": () => {
        isOpen.value = !isOpen.value;
    },
    // 使用 ESC 关闭弹窗
    escape: () => {
        if (isOpen.value && props.closeOnEsc && !props.disabledClose) {
            close();
        }
    },
});

// 暴露组件方法
defineExpose({ close, open });
</script>

<template>
    <div>
        <!-- 触发器插槽 -->
        <div v-if="$slots.trigger" class="cursor-pointer" @click="open">
            <slot name="trigger" />
        </div>

        <!-- 弹窗组件 -->
        <UModal
            v-model:open="isOpen"
            :ui="ui"
            :portal="portal"
            :fullscreen="fullscreen"
            :overlay="overlay"
            :transition="transition"
            :dismissible="dismissible"
            @close="emit('close')"
        >
            <template #header />
            <!-- 弹窗内容 -->
            <template #content>
                <div :id="contentId" class="relative flex flex-col gap-4 p-4 sm:p-6">
                    <!-- 弹窗头部 -->
                    <div class="pr- flex items-center justify-between">
                        <slot name="title">
                            <div>
                                <h2 class="text-lg font-medium md:text-xl">
                                    {{ title }}
                                </h2>
                                <p v-if="description" class="text-muted-foreground mt-1 text-sm">
                                    {{ description }}
                                </p>
                            </div>
                        </slot>
                        <UButton
                            v-if="!disabledClose"
                            class="absolute top-4 right-4"
                            :icon="closeIcon"
                            color="neutral"
                            size="sm"
                            variant="ghost"
                            aria-label="关闭弹窗"
                            @click="close"
                        />
                    </div>
                    <div>
                        <slot />
                    </div>
                    <!-- 弹窗页脚 -->
                    <template v-if="showFooter || $slots.footer">
                        <slot name="footer">
                            <div class="flex justify-end gap-2">
                                <UButton color="neutral" variant="soft" size="lg" @click="close">
                                    {{ $t("console-common.cancel") }}
                                </UButton>
                                <UButton color="primary" size="lg" @click="confirm">
                                    {{ $t("console-common.confirm") }}
                                </UButton>
                            </div>
                        </slot>
                    </template>
                </div>
            </template>
        </UModal>
    </div>
</template>
