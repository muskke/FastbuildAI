<script setup lang="ts">
import { LOGIN_TYPE } from "@fastbuildai/constants";
import { Motion } from "motion-v";
import { nextTick } from "vue";

import FooterCopyright from "@/common/components/layout/components/footer-copyright.vue";
import AccountLogin from "@/common/components/login/account/index.vue";
import LoginBind from "@/common/components/login/login-bind.vue";
// import PhoneLogin from "@/common/components/login/phone/index.vue";
import WechatLogin from "@/common/components/login/wechat/index.vue";
import { LOGIN_STATUS } from "@/common/constants/auth.constant";
import type { LoginResponse } from "@/models/user";
import type { WebsiteCopyright } from "@/models/website";
import LogoFull from "@/public/logo-full.svg";

definePageMeta({ layout: "full-screen", auth: false });

const appStore = useAppStore();
const userStore = useUserStore();

interface LoginComponentConfig {
    component: any;
    icon: string;
    label: string;
}

const LOGIN_COMPONENTS: Record<string | number, LoginComponentConfig> = {
    [LOGIN_TYPE.ACCOUNT]: {
        component: AccountLogin,
        icon: "tabler:lock",
        label: "账号密码登录",
    },
    // [LOGIN_TYPE.PHONE]: {
    //     component: PhoneLogin,
    //     icon: "tabler:phone",
    //     label: "手机号登录",
    // },
    [LOGIN_TYPE.WECHAT]: {
        component: WechatLogin,
        icon: "tabler:brand-wechat",
        label: "微信登录",
    },
    [LOGIN_STATUS.BIND]: {
        component: LoginBind,
        icon: "",
        label: "绑定手机号",
    },
};

const DEFAULT_LOGIN_METHOD = appStore?.loginWay?.defaultLoginWay || LOGIN_TYPE.ACCOUNT;
const currentLoginMethod = ref<string | number>(DEFAULT_LOGIN_METHOD);
const showLoginMethods = ref<boolean>(true);
const containerStyle = ref<{ width: string; height: string }>({
    width: "300px",
    height: "400px",
});

const loginMethods = computed(() =>
    Object.entries(LOGIN_COMPONENTS)
        .filter(([key]) => key !== LOGIN_STATUS.BIND && key !== LOGIN_STATUS.SUCCESS)
        .map(([key, config]) => ({ name: key, ...config })),
);
const currentComponent = computed(() => LOGIN_COMPONENTS[currentLoginMethod.value]?.component);
const currentComponentConfig = computed(() => LOGIN_COMPONENTS[currentLoginMethod.value]);

function switchLoginMethod(methodName: string | number): void {
    if (LOGIN_COMPONENTS[methodName]) {
        currentLoginMethod.value = methodName;
    }
}

function loginHandle(data: LoginResponse & { hasBind: boolean }): void {
    if (appStore.loginWay.coerceMobile * 1 && !data.hasBind && !data.mobile) {
        userStore.tempLogin(data.token);
        currentLoginMethod.value = LOGIN_STATUS.BIND;
        return;
    }
    userStore.login(data.token);
}

const contentRefs = useTemplateRef<InstanceType<any>>("contentRefs");
const containerRef = useTemplateRef<HTMLElement>("containerRef");

let resizeObserver: ResizeObserver | null = null;
async function updateContainerStyle(style: { width: string; height: string }) {
    resizeObserver?.disconnect();
    containerStyle.value = style;

    await nextTick();
    // 等待更长时间确保组件完全渲染
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (containerRef.value && currentLoginMethod.value !== LOGIN_STATUS.SUCCESS) {
        // 直接观察容器元素，而不是 Motion 组件内部
        resizeObserver = new ResizeObserver(updateContainerHeight);
        resizeObserver.observe(containerRef.value);
    }
}

const updateContainerHeight = useDebounceFn(() => {
    if (containerRef.value) {
        // 获取容器的实际高度
        const rect = containerRef.value.getBoundingClientRect();
        const computedHeight = rect.height;

        // 只有当高度发生明显变化时才更新
        const currentHeight = parseInt(containerStyle.value.height);
        if (Math.abs(computedHeight - currentHeight) > 10) {
            containerStyle.value.height = `${computedHeight}px`;
        }
    }
}, 100);

// 离开的时候重置参数等
onUnmounted(() => {
    resizeObserver?.disconnect();
    userStore.isAgreed = false;
});
</script>

<template>
    <ClientOnly>
        <div class="w-fll login-container flex h-screen flex-col">
            <div class="flex h-full w-full flex-col items-center justify-center">
                <div class="py-6">
                    <h1 class="flex items-center">
                        <template v-if="appStore.siteConfig?.webinfo.logo">
                            <img
                                :src="appStore.siteConfig?.webinfo.logo"
                                alt="Logo"
                                class="size-12"
                            />
                            <span class="ml-2 text-3xl font-bold">
                                {{ appStore.siteConfig?.webinfo.name }}
                            </span>
                        </template>
                        <!-- 没有logo的时候显示全称 -->
                        <LogoFull
                            v-else
                            class="text-foreground h-11"
                            filled
                            :fontControlled="false"
                        />
                    </h1>
                </div>
                <div class="relative flex">
                    <!-- 内容容器 -->
                    <Motion
                        :initial="{
                            opacity: 0,
                            scale: 0.95,
                            ...containerStyle,
                        }"
                        :animate="{
                            opacity: 1,
                            scale: 1,
                            ...containerStyle,
                        }"
                        :exit="{
                            opacity: 0,
                            scale: 0.95,
                        }"
                        :transition="{
                            type: 'tween',
                            stiffness: 300,
                            damping: 30,
                        }"
                        will-change-transform
                        class="bg-background border-secondary relative rounded-xl border"
                        style="
                            box-shadow:
                                0 0 1px rgba(0, 0, 0, 0.2),
                                0 0 4px rgba(0, 0, 0, 0.02),
                                0 12px 36px rgba(0, 0, 0, 0.06);
                        "
                    >
                        <!-- 内容区域 -->
                        <Motion
                            ref="contentRefs"
                            :initial="{ opacity: 0, y: 20 }"
                            :animate="{ opacity: 1, y: 0 }"
                            :exit="{ opacity: 0, y: -20 }"
                            :transition="{
                                type: 'tween',
                                stiffness: 300,
                                damping: 30,
                            }"
                            class="h-full"
                        >
                            <div ref="containerRef" class="w-full">
                                <component
                                    :is="currentComponent"
                                    v-if="currentComponent"
                                    v-bind="currentComponentConfig"
                                    @success="loginHandle"
                                    @switch-to="switchLoginMethod"
                                    @update-style="updateContainerStyle"
                                    @update:show-login-methods="showLoginMethods = $event"
                                />
                            </div>

                            <!-- 登录方式切换导航 -->
                            <Motion
                                v-if="
                                    loginMethods.length > 1 &&
                                    currentLoginMethod !== LOGIN_STATUS.SUCCESS &&
                                    showLoginMethods
                                "
                                :key="currentLoginMethod"
                                :initial="{ opacity: 0, y: 10 }"
                                :animate="{ opacity: 1, y: 0 }"
                                :transition="{
                                    type: 'tween',
                                    stiffness: 300,
                                    damping: 30,
                                    delay: 0.5,
                                }"
                                class="w-full px-8 pb-8"
                            >
                                <USeparator
                                    :label="$t('login.orLoginTo')"
                                    :ui="{
                                        root: 'py-5',
                                        label: 'text-xs text-foreground/60',
                                    }"
                                />
                                <div class="flex justify-center gap-4">
                                    <template
                                        v-for="(method, mIndex) in loginMethods"
                                        :key="mIndex"
                                    >
                                        <UTooltip
                                            v-if="method.name != currentLoginMethod"
                                            :text="method.label"
                                            color="primary"
                                            :delay-duration="0"
                                            :ui="{ content: 'z-50' }"
                                            :content="{
                                                align: 'center',
                                                side: 'bottom',
                                                sideOffset: 8,
                                            }"
                                        >
                                            <div
                                                class="bg-foreground/5 text-foreground/60 center hover:text-primary flex size-8 cursor-pointer items-center justify-center rounded-full p-1"
                                                @click="switchLoginMethod(method.name)"
                                            >
                                                <UIcon :name="method.icon" class="text-xl" />
                                            </div>
                                        </UTooltip>
                                    </template>
                                </div>
                            </Motion>
                        </Motion>
                    </Motion>
                </div>
            </div>
            <FooterCopyright
                :copyright="appStore.siteConfig?.copyright as unknown as WebsiteCopyright[]"
            />
        </div>
    </ClientOnly>
</template>

<style scoped>
.login-container {
    background:
        radial-gradient(800px circle at 20% 30%, rgba(173, 255, 189, 0.3), transparent 60%),
        radial-gradient(600px circle at 80% 20%, rgba(144, 202, 249, 0.3), transparent 70%),
        radial-gradient(700px circle at 50% 80%, rgba(255, 183, 255, 0.3), transparent 60%),
        var(--color-background);
}
</style>
