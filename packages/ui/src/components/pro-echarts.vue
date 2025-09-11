<script setup lang="ts">
import { useElementSize, useResizeObserver, useThrottleFn } from "@vueuse/core";
import type { EChartsOption } from "echarts";
// 引入常用图表，图表后缀都为 Chart
import {
    BarChart,
    LineChart,
    MapChart,
    PictorialBarChart,
    PieChart,
    RadarChart,
    ScatterChart,
} from "echarts/charts";
// 引入提示框，标题，直角坐标系，数据集，内置数据转换器组件，组件后缀都为 Component
import {
    AriaComponent,
    CalendarComponent,
    DataZoomComponent,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    ParallelComponent,
    PolarComponent,
    RadarComponent,
    TimelineComponent,
    TitleComponent,
    ToolboxComponent,
    TooltipComponent,
    VisualMapComponent,
} from "echarts/components";
// 引入 echarts 核心模块，核心模块提供了 echarts 使用必须要的接口
const echarts = await import("echarts/core");
// 标签自动布局，全局过渡动画等特性
const { LabelLayout, UniversalTransition } = await import("echarts/features");
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
const { CanvasRenderer } = await import("echarts/renderers");
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

// 注册必须的组件
echarts.use([
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    PolarComponent,
    AriaComponent,
    ParallelComponent,
    BarChart,
    LineChart,
    PieChart,
    MapChart,
    RadarChart,
    PictorialBarChart,
    RadarComponent,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent,
    TimelineComponent,
    CalendarComponent,
    GraphicComponent,
    ScatterChart,
    CanvasRenderer,
    LabelLayout,
    UniversalTransition,
]);

/**
 * ProEcharts 组件属性定义
 */
interface ProEchartsProps {
    /** ECharts 配置选项 */
    options: EChartsOption;
    /** 主题，可选 */
    theme?: string;
    /** 图表高度，默认为 '100%' */
    height?: string;
    /** 是否自动调整大小，默认为 true */
    autoResize?: boolean;
    /** 是否启用动画，默认为 true */
    animation?: boolean;
    /** 渲染模式，可选 'canvas' 或 'svg'，默认为 'canvas' */
    renderer?: "canvas" | "svg";
    /** 加载状态，默认为 false */
    loading?: boolean;
    /** 加载文本，默认为 '加载中...' */
    loadingText?: string;
}

/**
 * 组件属性定义
 */
const props = withDefaults(defineProps<ProEchartsProps>(), {
    theme: "",
    height: "100%",
    autoResize: true,
    animation: true,
    renderer: "canvas",
    loading: false,
    loadingText: "加载中...",
});

// 图表容器引用
const chartRef = ref<HTMLElement | null>(null);
// ECharts 实例 (使用 shallowRef 避免不必要的深层响应式)
const chartInstance = shallowRef<echarts.ECharts | null>(null);
// 容器尺寸
const { width, height } = useElementSize(chartRef);

/**
 * 初始化图表
 */
const initChart = () => {
    if (!chartRef.value) return;

    // 销毁旧实例
    disposeChart();

    // 创建新实例
    chartInstance.value = echarts.init(chartRef.value, props.theme, {
        renderer: props.renderer,
    });

    // 设置配置项
    updateChart();

    // 设置加载状态
    if (props.loading) {
        chartInstance.value.showLoading("default", {
            text: props.loadingText,
            maskColor: "rgba(255, 255, 255, 0.8)",
            textColor: "#999",
            fontSize: 14,
        });
    }
};

/**
 * 更新图表配置
 */
const updateChart = () => {
    if (!chartInstance.value) return;

    // 设置配置项
    chartInstance.value.setOption(props.options, true);

    // 更新加载状态
    if (props.loading) {
        chartInstance.value.showLoading("default", {
            text: props.loadingText,
            maskColor: "rgba(255, 255, 255, 0.8)",
            textColor: "#999",
            fontSize: 14,
        });
    } else {
        chartInstance.value.hideLoading();
    }
};

/**
 * 调整图表大小
 */
const resizeChart = useThrottleFn(() => {
    if (chartInstance.value) {
        chartInstance.value.resize();
    }
}, 100);

/**
 * 销毁图表实例
 */
const disposeChart = () => {
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
};

// 监听配置项变化
watch(
    () => props.options,
    () => {
        nextTick(() => {
            if (chartInstance.value) {
                updateChart();
            } else {
                initChart();
            }
        });
    },
    { deep: true, immediate: true },
);

// 监听加载状态变化
watch(
    () => props.loading,
    (val) => {
        if (!chartInstance.value) return;

        if (val) {
            chartInstance.value.showLoading("default", {
                text: props.loadingText,
                maskColor: "rgba(255, 255, 255, 0.8)",
                textColor: "#999",
                fontSize: 14,
            });
        } else {
            chartInstance.value.hideLoading();
        }
    },
);

// 监听容器尺寸变化
if (props.autoResize) {
    watch([width, height], () => {
        resizeChart();
    });

    // 使用 ResizeObserver 监听容器尺寸变化
    useResizeObserver(chartRef, () => {
        resizeChart();
    });
}

// 组件挂载时初始化图表
onMounted(() => {
    nextTick(() => {
        initChart();
    });
});

// 组件卸载前销毁图表
onBeforeUnmount(() => {
    disposeChart();
});

// 暴露给父组件的方法
defineExpose({
    // 获取 ECharts 实例
    getChartInstance: () => chartInstance.value,
});
</script>

<template>
    <div ref="chartRef" class="pro-echarts" :style="{ height: props.height }"></div>
</template>

<style scoped>
.pro-echarts {
    width: 100%;
    min-height: 200px;
}
</style>
