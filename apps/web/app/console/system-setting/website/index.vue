<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const tabs = computed<{ name: string; label: string }[]>(() => [
    { name: "information", label: t("console-system.website.tabs.information") },
    { name: "copyright", label: t("console-system.website.tabs.copyright") },
    { name: "statistics", label: t("console-system.website.tabs.statistics") },
]);

const activeTab = computed({
    get: () => {
        const index = tabs.value.findIndex((t) => t.name === route.query.tab);
        return index >= 0 ? index.toString() : "0";
    },
    set: (v: string) => {
        const index = parseInt(v, 10);
        const validIndex = Math.max(0, Math.min(index, tabs.value.length - 1));
        const tabName = tabs.value[validIndex]?.name || tabs.value[0]?.name || "information";
        router.replace({
            query: { tab: tabName },
        });
    },
});

const currentComponent = computed(() => {
    const index = parseInt(activeTab.value, 10);
    const tab = tabs.value[index];
    if (!tab) {
        return defineAsyncComponent(() => import("./_components/information.vue"));
    }
    return defineAsyncComponent(() => import(`./_components/${tab.name}.vue`));
});
</script>

<template>
    <div class="system-website mt-8">
        <div class="inline-block w-auto">
            <UTabs
                v-model="activeTab"
                size="md"
                :content="false"
                :items="tabs.map((tab) => ({ label: tab.label }))"
            />
        </div>

        <component :is="currentComponent" class="lg:max-w-2xl xl:max-w-4xl" />
    </div>
</template>
