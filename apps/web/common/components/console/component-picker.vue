<script setup lang="ts">
import { ref } from "vue";

interface ComponentOptions {
    label: string;
    value: string;
}

const props = withDefaults(
    defineProps<{
        modelValue?: string;
        placeholder: string;
        type?: "system" | "plugin";
    }>(),
    {
        modelValue: "",
        placeholder: "请选择页面组件",
        type: "system",
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", v: string): void;
    (e: "update:key", v: string): void;
}>();

const allComponents = ref<ComponentOptions[]>([]);
const filteredComponents = ref<ComponentOptions[]>([]);
const isLoading = ref<boolean>(false);
const open = ref<boolean>(false);
const componentPath = ref<string>("");

// 动态加载路径
const modules =
    props.type === "system"
        ? import.meta.glob("@/app/console/**/*.vue")
        : import.meta.glob("@plugins/**/app/console/**/*.vue");

// 校验有效路径（必须包含 /console/ 且不含 _components）
function isValidConsolePath(path: string): boolean {
    const isValid = path.includes("/console/") && !path.includes("/_components/");
    return isValid;
}

// 提取相对路径
function formatPath(path: string): ComponentOptions | null {
    if (!isValidConsolePath(path)) return null;

    // 去除 .vue 后缀
    const cleaned = path.replace(/\.vue$/, "");

    if (props.type === "system") {
        const match = cleaned.match(/\/console\/.+$/);
        if (!match) return null;

        const relativePath = match[0];
        return {
            label: relativePath,
            value: relativePath,
        };
    } else {
        const match = cleaned.match(/\/plugins\/([^/]+)\/app(\/console\/.+)$/);
        if (!match) {
            console.log(`[PageComponentPicker] 插件路径格式不匹配: ${cleaned}`);
            return null;
        }

        const fullPath = `${match[1]}/app${match[2]}`;

        return {
            label: fullPath,
            value: fullPath,
        };
    }
}

async function loadAllComponents() {
    if (allComponents.value.length > 0) return;
    componentPath.value = ""; // 清空当前选择
    isLoading.value = true;

    const components = Object.keys(modules)
        .map(formatPath)
        .filter((c): c is ComponentOptions => !!c)
        .sort((a, b) => a.label.localeCompare(b.label));

    allComponents.value = components;
    filteredComponents.value = components;

    isLoading.value = false;
    await nextTick();
    componentPath.value = props.modelValue;
}

function handleSearch(query: string) {
    const keyword = query.trim().toLowerCase();
    filteredComponents.value = keyword
        ? allComponents.value.filter((c) => c.label.toLowerCase().includes(keyword))
        : [...allComponents.value];
}

function handleValueChange(value: string) {
    emit("update:modelValue", value);

    if (props.type === "plugin" && value) {
        emit("update:key", value.split("/")[0]);
    }
}

onMounted(() => loadAllComponents());
</script>

<template>
    <div class="page-component-picker" @click="open = true">
        <UInputMenu
            v-model="componentPath"
            v-model:open="open"
            :items="filteredComponents"
            :loading="isLoading"
            :placeholder="props.placeholder"
            value-key="value"
            searchable
            clearable
            icon="i-lucide-file-json"
            :ui="{ content: '!w-auto min-w-[224px]' }"
            @update:model-value="(value) => handleValueChange(value)"
            @search="handleSearch"
        />
    </div>
</template>
