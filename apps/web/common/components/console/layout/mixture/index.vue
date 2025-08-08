<script setup lang="ts">
const ConsoleLayoutPageContent = defineAsyncComponent(
    () => import("@/common/components/console/layout/components/page-content.vue"),
);
const ConsoleLayoutMixtureHeader = defineAsyncComponent(
    () => import("@/common/components/console/layout/mixture/header.vue"),
);
const ConsoleLayoutMixtureSidebar = defineAsyncComponent(
    () => import("@/common/components/console/layout/mixture/sidebar.vue"),
);

const collapsed = ref<boolean>(false);

const toggleSidebar = () => {
    collapsed.value = !collapsed.value;
};
</script>

<template>
    <div class="flex h-screen w-full flex-col overflow-hidden">
        <div class="w-full flex-none">
            <ConsoleLayoutMixtureHeader :collapsed="collapsed" @toggle="toggleSidebar" />
        </div>

        <div class="flex w-full flex-1 overflow-hidden">
            <div class="flex-none">
                <ConsoleLayoutMixtureSidebar :collapsed="collapsed" />
            </div>

            <div class="flex min-h-0 w-full flex-1 flex-col items-center">
                <ConsoleLayoutPageContent layout="mixture" />
            </div>
        </div>
    </div>
</template>
