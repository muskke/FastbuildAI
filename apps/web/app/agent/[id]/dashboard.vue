<script setup lang="ts">
import ProDateRangePicker from "@fastbuildai/ui/components/pro-date-range-picker.vue";
import ProEcharts from "@fastbuildai/ui/components/pro-echarts.vue";
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";
import { useColorMode } from "@vueuse/core";
import type { EChartsOption } from "echarts";
import { computed, onMounted, reactive, ref } from "vue";

import { type ColorName, getColor } from "@/common/config/theme";
import type { AgentStatistics, QueryAgentStatisticsParams } from "@/models/agent";
import { apiGetAgentStatistics } from "@/services/web/agent";

// 路由和配置
const route = useRoute();
const agentId = computed(() => (route.params as any).id as string);
const appConfig = useAppConfig();
const colorMode = useColorMode();

// 状态管理
const statistics = ref<AgentStatistics | null>(null);
const loading = ref(true);
const state = reactive<QueryAgentStatisticsParams>({
    startDate: "",
    endDate: "",
});

// 主题色
const currentColor = computed(() => getColor(appConfig.ui.colors.primary as ColorName, 500));
const successColor = computed(() => getColor(appConfig.ui.colors.success as ColorName, 500));
const warningColor = computed(() => getColor(appConfig.ui.colors.warning as ColorName, 500));

// 获取统计数据
const fetchStatistics = async () => {
    try {
        loading.value = true;
        statistics.value = await apiGetAgentStatistics(agentId.value, state);
    } catch (error) {
        console.error("获取统计数据失败:", error);
        statistics.value = null;
    } finally {
        loading.value = false;
    }
};

// 时间范围变化处理
const handleDateChange = () => {
    // 确保日期格式为完整的ISO格式
    if (state.startDate) {
        const startDate = new Date(state.startDate);
        startDate.setHours(0, 0, 0, 0);
        state.startDate = startDate.toISOString();
    }

    if (state.endDate) {
        const endDate = new Date(state.endDate);
        endDate.setHours(23, 59, 59, 999);
        state.endDate = endDate.toISOString();
    }

    fetchStatistics();
};

// 通用图表配置
const getBaseChartConfig = () => ({
    tooltip: {
        trigger: "axis",
        backgroundColor: colorMode.value === "dark" ? "#1f2937" : "#ffffff",
        borderColor: colorMode.value === "dark" ? "#374151" : "#e5e7eb",
        textStyle: { color: colorMode.value === "dark" ? "#f9fafb" : "#111827" },
    },
    grid: { top: 30, left: 20, right: 20, bottom: 20, containLabel: true },
    xAxis: {
        type: "category",
        boundaryGap: false,
        axisLine: { lineStyle: { color: colorMode.value === "dark" ? "#374151" : "#d1d5db" } },
        axisLabel: { color: colorMode.value === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 },
        splitLine: { show: false },
    },
    yAxis: {
        type: "value",
        splitLine: {
            lineStyle: {
                color: colorMode.value === "dark" ? "#374151" : "#f3f4f6",
                type: "dashed",
            },
        },
        axisLine: { show: false },
        axisLabel: { show: false },
    },
});

// 生成单一图表配置
const createChartConfig = (
    name: string,
    data: Array<{ date: string; count: number }>,
    color: string,
    type: "line" | "bar" = "line",
) => {
    const baseConfig = getBaseChartConfig();
    const dates = data.map((item) => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
        ...baseConfig,
        xAxis: { ...baseConfig.xAxis, data: dates, boundaryGap: type === "bar" },
        yAxis: type === "bar" ? { ...baseConfig.yAxis, name: "用户数" } : baseConfig.yAxis,
        series: [
            {
                name,
                type,
                data: data.map((item) => item.count),
                ...(type === "line"
                    ? {
                          smooth: true,
                          symbol: "circle",
                          symbolSize: 8,
                          lineStyle: { width: 4, color },
                          itemStyle: { color, borderWidth: 2, borderColor: "#fff" },
                          areaStyle: {
                              color: {
                                  type: "linear",
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                      { offset: 0, color },
                                      { offset: 1, color },
                                  ],
                              },
                              opacity: 0.1,
                          },
                          emphasis: {
                              itemStyle: { color },
                              lineStyle: { color },
                              areaStyle: { color },
                          },
                      }
                    : {
                          barWidth: "50%",
                          showBackground: true,
                          backgroundStyle: {
                              color: "rgba(180, 180, 180, 0.2)",
                              borderRadius: [4, 4, 0, 0],
                          },
                          itemStyle: {
                              borderRadius: [4, 4, 0, 0],
                              color: {
                                  type: "linear",
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                      { offset: 0, color },
                                      { offset: 1, color },
                                  ],
                              },
                          },
                          emphasis: { itemStyle: { color: currentColor.value } },
                      }),
            },
        ],
    } as EChartsOption;
};

// 图表配置
const chartOptions = computed(() => {
    if (!statistics.value?.trends) return {};

    return {
        conversations: createChartConfig(
            "对话数",
            statistics.value.trends.conversations,
            currentColor.value,
        ),
        messages: createChartConfig("消息数", statistics.value.trends.messages, successColor.value),
        tokens: createChartConfig("Token消耗", statistics.value.trends.tokens, warningColor.value),
        activeUsers: createChartConfig(
            "活跃用户",
            statistics.value.trends.activeUsers,
            currentColor.value,
            "bar",
        ),
    };
});

// 初始化时间范围并获取数据
onMounted(() => {
    const today = new Date();

    // 开始时间：7天前 00:00:00.000Z
    const startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // 结束时间：当天 23:59:59.999Z
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // 使用完整的ISO格式
    state.startDate = startDate.toISOString();
    state.endDate = endDate.toISOString();

    fetchStatistics();
});
</script>

<template>
    <div class="flex h-full w-full flex-col">
        <!-- 标题和时间选择器 -->
        <div class="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 class="text-foreground text-2xl font-bold">数据看板</h1>
                <p class="text-muted-foreground mt-1">智能体使用情况统计与分析</p>
            </div>
            <ProDateRangePicker
                v-model:start="state.startDate"
                v-model:end="state.endDate"
                :show-time="false"
                :ui="{ root: 'w-auto sm:w-xs' }"
                @change="handleDateChange"
            />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex h-full flex-col items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="text-primary h-6 w-6 animate-spin" />
            <span class="text-muted-foreground ml-2">加载统计数据中...</span>
        </div>

        <!-- 统计数据展示 -->
        <div v-else-if="statistics" class="m-px flex h-full flex-col space-y-6 overflow-y-auto">
            <ProScrollArea class="table h-full px-4" :shadow="false">
                <div class="p-px pb-4">
                    <!-- 总览卡片 -->
                    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <UCard>
                            <template #header>
                                <div class="mb-1 flex items-center font-medium">对话统计</div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="new Date().toISOString()"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">
                                                {{
                                                    formatCompactNumber(
                                                        statistics.overview.totalConversations,
                                                    )
                                                }}
                                            </span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >次</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">总对话数</div>
                                    </div>
                                    <USeparator orientation="vertical" class="h-6" />
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">
                                                {{
                                                    formatCompactNumber(
                                                        statistics.overview.totalMessages,
                                                    )
                                                }}
                                            </span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >条</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">总消息数</div>
                                    </div>
                                </div>
                                <div
                                    class="text-muted-foreground flex flex-col items-center justify-center"
                                >
                                    <UIcon
                                        name="i-lucide-message-circle"
                                        class="text-primary size-7"
                                    />
                                    <span class="text-xs">对话数据</span>
                                </div>
                            </div>
                        </UCard>

                        <UCard>
                            <template #header>
                                <div class="mb-1 flex items-center font-medium">Token消耗</div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="new Date().toISOString()"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">
                                                {{
                                                    formatCompactNumber(
                                                        statistics.overview.totalTokens,
                                                    )
                                                }}
                                            </span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >个</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">总Token消耗</div>
                                    </div>
                                    <USeparator orientation="vertical" class="h-6" />
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">
                                                {{
                                                    formatCompactNumber(
                                                        statistics.overview.annotationHitCount,
                                                    )
                                                }}
                                            </span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >次</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">标注命中</div>
                                    </div>
                                </div>
                                <div
                                    class="text-muted-foreground flex flex-col items-center justify-center"
                                >
                                    <UIcon name="i-lucide-zap" class="text-primary size-7" />
                                    <span class="text-xs">消耗统计</span>
                                </div>
                            </div>
                        </UCard>

                        <UCard>
                            <template #header>
                                <div class="mb-1 flex items-center font-medium">标注管理</div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="new Date().toISOString()"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">{{
                                                statistics.overview.totalAnnotations
                                            }}</span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >个</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">总标注数</div>
                                    </div>
                                    <USeparator orientation="vertical" class="h-6" />
                                    <div>
                                        <div>
                                            <span class="text-2xl font-bold">{{
                                                statistics.overview.activeAnnotations
                                            }}</span>
                                            <span class="text-muted-foreground ml-1 text-xs"
                                                >个</span
                                            >
                                        </div>
                                        <div class="text-muted-foreground text-xs">活跃标注</div>
                                    </div>
                                </div>
                                <div
                                    class="text-muted-foreground flex flex-col items-center justify-center"
                                >
                                    <UIcon name="i-lucide-bookmark" class="text-primary size-7" />
                                    <span class="text-xs">标注数据</span>
                                </div>
                            </div>
                        </UCard>
                    </div>

                    <!-- 图表区域 -->
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <UCard>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium">对话趋势</h3>
                                </div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="state.startDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                    <span>~</span>
                                    <TimeDisplay
                                        :datetime="state.endDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="h-80">
                                <ProEcharts
                                    v-if="statistics?.trends?.conversations"
                                    :options="chartOptions.conversations as EChartsOption"
                                    height="100%"
                                />
                            </div>
                        </UCard>

                        <UCard>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium">消息趋势</h3>
                                </div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="state.startDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                    <span>~</span>
                                    <TimeDisplay
                                        :datetime="state.endDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="h-80">
                                <ProEcharts
                                    v-if="statistics?.trends?.messages"
                                    :options="chartOptions.messages as EChartsOption"
                                    height="100%"
                                />
                            </div>
                        </UCard>

                        <UCard>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium">Token输出数</h3>
                                </div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="state.startDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                    <span>~</span>
                                    <TimeDisplay
                                        :datetime="state.endDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="h-80">
                                <ProEcharts
                                    v-if="statistics?.trends?.tokens"
                                    :options="chartOptions.tokens as EChartsOption"
                                    height="100%"
                                />
                            </div>
                        </UCard>

                        <UCard>
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-medium">活跃用户数</h3>
                                </div>
                                <div class="text-muted-foreground mb-1 flex items-center gap-1">
                                    <UIcon name="i-lucide-info" class="size-3" />
                                    <TimeDisplay
                                        :datetime="state.startDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                    <span>~</span>
                                    <TimeDisplay
                                        :datetime="state.endDate as string"
                                        mode="datetime"
                                        class="text-xs"
                                    />
                                </div>
                            </template>
                            <div class="h-80">
                                <ProEcharts
                                    v-if="statistics?.trends?.activeUsers"
                                    :options="chartOptions.activeUsers as EChartsOption"
                                    height="100%"
                                />
                            </div>
                        </UCard>
                    </div>
                </div>
            </ProScrollArea>
        </div>

        <!-- 错误状态 -->
        <div v-else class="py-12 text-center">
            <UIcon name="i-lucide-alert-circle" class="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p class="text-muted-foreground">加载统计数据失败</p>
            <UButton @click="fetchStatistics" class="mt-4" variant="outline">重新加载</UButton>
        </div>
    </div>
</template>
