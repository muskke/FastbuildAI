<script setup lang="ts">
const LayoutPageContent = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/page-content.vue"),
);
const LayoutSidebar = defineAsyncComponent(
    () => import("@/common/components/console/layout/sidebar/main-sidebar.vue"),
);
const LayoutSidebarNavbar = defineAsyncComponent(
    () => import("@/common/components/console/layout/sidebar/navbar.vue"),
);

const collapsed = ref<boolean>(false);
const mobileMenu = ref<boolean>(false);

/** 切换侧边栏折叠状态 */
const toggleSidebar = () => {
    collapsed.value = !collapsed.value;
};

/** 打开移动端菜单 */
const openMobileMenu = () => {
    mobileMenu.value = true;
};
</script>

<template>
    <div class="bg-sidebar flex h-screen w-full overflow-hidden">
        <div class="app-sidebar">
            <LayoutSidebar :collapsed="collapsed" v-model:mobile-menu="mobileMenu" />
        </div>
        <div
            class="bg-background m-0 flex min-w-0 flex-1 flex-col items-center shadow-lg md:m-2 md:ml-0 md:rounded-xl"
        >
            <LayoutSidebarNavbar
                :collapsed="collapsed"
                :mobile-menu="mobileMenu"
                @toggle="toggleSidebar"
                @open-mobile-menu="openMobileMenu"
            />
            <LayoutPageContent layout="sidebar" />
        </div>
    </div>
</template>
