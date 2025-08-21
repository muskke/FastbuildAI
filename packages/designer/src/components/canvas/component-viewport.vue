<script lang="ts" setup>
import { type Component, defineAsyncComponent } from "vue";

// 避免一次性注册全部组件，按需加载 content 组件
const contentModules = import.meta.glob("../../components/widgets/**/content.vue", {
    eager: false,
});
const componentCache: Record<string, Component | null> = {};

const props = defineProps<{
    component: ComponentConfig;
    isActive: boolean;
    isDragging: boolean;
    hasCollision: boolean;
}>();

const emit = defineEmits<{
    (e: "mousedown", event: MouseEvent): void;
    (e: "resizeStart", direction: string, event: MouseEvent): void;
}>();

const designStore = useDesignStore();

function resolveComponent(type: string) {
    if (componentCache[type] !== undefined) return componentCache[type];
    const matcher = new RegExp(`/(?:web|mobile)/${type}/content\\.vue$`);
    const entry = Object.entries(contentModules).find(([path]) => matcher.test(path));
    if (!entry) {
        componentCache[type] = null;
        return null;
    }
    const loader = entry[1] as any;
    const comp = defineAsyncComponent(loader);
    componentCache[type] = comp as unknown as Component;
    return comp as unknown as Component;
}

// 处理右键菜单命令
function handleCommand(command: string) {
    const { component } = props;
    switch (command) {
        case "delete":
            designStore.removeComponent(component.id);
            break;
        case "toggle":
            designStore.updateVisible(component.id, !component.isHidden);
            break;
    }
}

// 处理调整大小开始事件
function handleResizeStart(direction: string, event: MouseEvent) {
    event.stopPropagation();
    emit("resizeStart", direction, event);
}
</script>

<template>
    <div
        class="component-wrapper"
        :class="{
            'is-active': isActive,
            'is-dragging': isDragging,
            'has-collision': hasCollision,
        }"
        :style="{
            left: `${component.position.x}px`,
            top: `${component.position.y}px`,
            width: `${component.size.width}px`,
            height: `${component.size.height}px`,
            opacity: component.isHidden ? 0.5 : 1,
            zIndex: isDragging
                ? 999
                : isActive
                  ? (component.zIndex || 0) + 100
                  : component.zIndex || 0,
        }"
        @mousedown.stop="emit('mousedown', $event)"
    >
        <!-- 尺寸显示 -->
        <div
            v-if="isActive || isDragging"
            class="size-indicator"
            :class="{ 'has-collision': hasCollision }"
        >
            {{ component.size.width }} x {{ component.size.height }}
        </div>

        <!-- 操作菜单 -->
        <div v-if="isActive" class="action-menu">
            <div>
                <UButton
                    color="primary"
                    :icon="component.isHidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    size="md"
                    @click.stop="handleCommand('toggle')"
                />
            </div>
            <div>
                <UButton
                    color="error"
                    icon="i-lucide-trash-2"
                    size="md"
                    @click.stop="handleCommand('delete')"
                />
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="component-content-wrapper">
            <component
                :is="resolveComponent(component.type)"
                v-bind="component.props"
                :size="component.size"
                class="pointer-events-none select-none"
            />
        </div>

        <!-- 调整大小的手柄 -->
        <template v-if="isActive">
            <div
                v-for="direction in ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']"
                :key="direction"
                class="resize-handle"
                :class="`resize-${direction}`"
                @mousedown.stop="handleResizeStart(direction, $event)"
            />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.component-wrapper {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid transparent;
    transition: border-color 0.2s;
    overflow: visible;

    &:hover {
        border: 1px dashed var(--primary-500);
    }

    &.is-active {
        border-color: var(--primary-500);
    }

    &.is-dragging {
        opacity: 0.8;
    }

    &.has-collision {
        border-color: #f56c6c;
    }
}

.size-indicator {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-500);
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;

    &.has-collision {
        background-color: #f56c6c;
    }
}

.action-menu {
    position: absolute;
    right: -90px;
    top: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 82px;
}

.resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: var(--primary-500);
    border: 2px solid #fff;
    border-radius: 50%;
    z-index: 20;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

$handle-positions: (
    "n": (
        top: -5px,
        left: 50%,
        transform: translateX(-50%),
        cursor: ns-resize,
    ),
    "s": (
        bottom: -5px,
        left: 50%,
        transform: translateX(-50%),
        cursor: ns-resize,
    ),
    "e": (
        top: 50%,
        right: -5px,
        transform: translateY(-50%),
        cursor: ew-resize,
    ),
    "w": (
        top: 50%,
        left: -5px,
        transform: translateY(-50%),
        cursor: ew-resize,
    ),
    "nw": (
        top: -5px,
        left: -5px,
        cursor: nwse-resize,
    ),
    "ne": (
        top: -5px,
        right: -5px,
        cursor: nesw-resize,
    ),
    "sw": (
        bottom: -5px,
        left: -5px,
        cursor: nesw-resize,
    ),
    "se": (
        bottom: -5px,
        right: -5px,
        cursor: nwse-resize,
    ),
);

@each $direction, $props in $handle-positions {
    .resize-#{$direction} {
        @each $prop, $value in $props {
            #{$prop}: $value;
        }
    }
}

.component-content-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}
</style>
