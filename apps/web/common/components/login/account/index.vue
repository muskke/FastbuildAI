<script setup lang="ts">
import type { LoginResponse } from "@/models/user";

const Forget = defineAsyncComponent(() => import("./forget.vue"));
const Login = defineAsyncComponent(() => import("./login.vue"));
const Register = defineAsyncComponent(() => import("./register.vue"));

const emits = defineEmits<{
    (e: "success", v: LoginResponse): void;
    (e: "updateStyle", v: { width: string; height: string }): void;
    (e: "update:showLoginMethods", v: boolean): void;
}>();

// 当前显示的组件
const currentComponent = ref("account-login");

// 容器样式
const containerStyle = computed(() => {
    switch (currentComponent.value) {
        case "account-login":
            return { width: "410px", height: "400px" };
        case "account-register":
            return { width: "430px", height: "484px" };
        case "account-forget":
            return { width: "380px", height: "529px" };
        default:
            return { width: "480px", height: "500px" };
    }
});

// 组件映射表
const componentMap: Record<string, any> = {
    "account-login": Login,
    "account-register": Register,
    "account-forget": Forget,
} as const;

// 处理组件切换
function handleSwitchComponent(component: string) {
    currentComponent.value = component;
    emits("update:showLoginMethods", component === "account-login");
    emits("updateStyle", containerStyle.value);
}

// 处理登录成功
function handleLoginSuccess(v: LoginResponse) {
    emits("success", v);
}

onMounted(() => {
    emits("updateStyle", containerStyle.value);
    emits("update:showLoginMethods", true);
});
</script>

<template>
    <component
        :is="componentMap[currentComponent]"
        :key="currentComponent"
        @success="handleLoginSuccess"
        @switch-component="handleSwitchComponent"
    />
</template>
