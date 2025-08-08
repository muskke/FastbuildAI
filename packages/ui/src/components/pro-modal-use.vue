<script setup lang="ts">
/**
 * ProModalUse 组件
 * 作用于动态调用 useModal 模块使用，请勿随意更改
 */
const props = defineProps<{
    color?: "error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral";
    title: string;
    description: string;
    content: string | any; // 可以是字符串或组件
    showConfirm?: boolean;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
    dismissible?: boolean;
    contentId?: string;
    ui?: Record<string, string>;

    confirm: () => void;
    cancel: () => void;
}>();

const emit = defineEmits<{ close: [boolean] }>();

function handleConfirm() {
    emit("close", true);
    props.confirm();
}

function handleCancel() {
    emit("close", true);
    props.cancel();
}
</script>

<template>
    <UModal :title="title" :description="description" :ui="ui" :dismissible="dismissible">
        <template #header />
        <template #content>
            <div :id="contentId" class="relative flex flex-col gap-4 p-4 sm:p-6">
                <!-- 弹窗头部 -->
                <div class="pr- flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-medium md:text-xl">
                            {{ title }}
                        </h2>
                        <p v-if="description" class="text-muted-foreground mt-1 text-sm">
                            {{ description }}
                        </p>
                    </div>
                    <UButton
                        class="absolute top-4 right-4"
                        icon="tabler:x"
                        color="neutral"
                        size="sm"
                        variant="ghost"
                        aria-label="关闭弹窗"
                        @click="emit('close', false)"
                    />
                </div>
                <div class="flex flex-col gap-5">
                    <!-- 内容 -->
                    <div v-if="typeof content === 'string'" class="text-base" v-html="content" />
                    <component :is="content" v-else />
                    <!-- 底部按钮 -->
                    <div v-if="showCancel || showConfirm" class="flex w-full justify-end gap-4">
                        <UButton
                            v-if="showCancel"
                            color="neutral"
                            variant="soft"
                            size="lg"
                            :label="cancelText || '取消'"
                            @click="handleCancel"
                        />
                        <UButton
                            v-if="showConfirm"
                            :color="color"
                            size="lg"
                            :label="confirmText || '确认'"
                            @click="handleConfirm"
                        />
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>
