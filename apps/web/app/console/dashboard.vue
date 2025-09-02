<script setup lang="ts">
import ProEcharts from "@fastbuildai/ui/components/pro-echarts.vue";
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";
import type { TableColumn } from "@nuxt/ui";
import { useColorMode } from "@vueuse/core";
import type { EChartsOption } from "echarts";

import { type ColorName, getColor } from "@/common/config/theme";

const appConfig = useAppConfig();
const colorMode = useColorMode();

const currentColor = computed(() => getColor(appConfig.ui.colors.primary as ColorName, 500));

// 项目类型定义
interface Project {
    id: number;
    name: string;
    status: "in-progress" | "completed" | "planning" | "delayed";
    progress: number;
    dueDate: string;
    members: Array<{ name: string; avatar: string }>;
}

// 项目列表
const projects: Project[] = [
    {
        id: 1,
        name: "AI助手开发",
        status: "in-progress",
        progress: 75,
        dueDate: "2023-12-15",
        members: [
            { name: "张三", avatar: "https://i.pravatar.cc/150?img=1" },
            { name: "李四", avatar: "https://i.pravatar.cc/150?img=2" },
            { name: "王五", avatar: "https://i.pravatar.cc/150?img=3" },
        ],
    },
    {
        id: 2,
        name: "数据分析平台",
        status: "completed",
        progress: 100,
        dueDate: "2023-11-20",
        members: [
            { name: "张三", avatar: "https://i.pravatar.cc/150?img=1" },
            { name: "王五", avatar: "https://i.pravatar.cc/150?img=3" },
        ],
    },
    {
        id: 3,
        name: "用户管理系统",
        status: "planning",
        progress: 20,
        dueDate: "2024-01-10",
        members: [
            { name: "李四", avatar: "https://i.pravatar.cc/150?img=2" },
            { name: "王五", avatar: "https://i.pravatar.cc/150?img=3" },
            { name: "赵六", avatar: "https://i.pravatar.cc/150?img=4" },
        ],
    },
    {
        id: 4,
        name: "移动应用重构",
        status: "delayed",
        progress: 40,
        dueDate: "2023-12-01",
        members: [
            { name: "赵六", avatar: "https://i.pravatar.cc/150?img=4" },
            { name: "孙七", avatar: "https://i.pravatar.cc/150?img=5" },
        ],
    },
    {
        id: 4,
        name: "移动应用重构",
        status: "delayed",
        progress: 40,
        dueDate: "2023-12-01",
        members: [
            { name: "赵六", avatar: "https://i.pravatar.cc/150?img=4" },
            { name: "孙七", avatar: "https://i.pravatar.cc/150?img=5" },
        ],
    },
    {
        id: 4,
        name: "移动应用重构",
        status: "delayed",
        progress: 40,
        dueDate: "2023-12-01",
        members: [
            { name: "赵六", avatar: "https://i.pravatar.cc/150?img=4" },
            { name: "孙七", avatar: "https://i.pravatar.cc/150?img=5" },
        ],
    },
    {
        id: 4,
        name: "移动应用重构",
        status: "delayed",
        progress: 40,
        dueDate: "2023-12-01",
        members: [
            { name: "赵六", avatar: "https://i.pravatar.cc/150?img=4" },
            { name: "孙七", avatar: "https://i.pravatar.cc/150?img=5" },
        ],
    },
];

const columns: TableColumn<Project>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "name",
        header: "名称",
    },
    {
        accessorKey: "status",
        header: "状态",
    },
    {
        accessorKey: "progress",
        header: "进度",
    },
    {
        accessorKey: "dueDate",
        header: "截止日期",
    },
    {
        accessorKey: "members",
        header: "成员",
    },
];

// 图表配置
const chartOptions = reactive({
    tooltip: {
        trigger: "axis",
    },
    grid: {
        top: 10,
        left: 18,
        right: 18,
        bottom: 10,
        containLabel: true,
    },
    xAxis: [
        {
            type: "category",
            data: ["23-01", "23-02", "23-03", "23-04", "23-05", "23-06"],
            boundaryGap: false,
            axisLine: {
                lineStyle: {
                    color: "#999",
                },
            },
            axisLabel: {
                interval: 0,
                align: "center",
                formatter: function (value: string) {
                    return value;
                },
                boundaryGap: false,
            },
        },
    ],
    yAxis: [
        {
            type: "value",
            splitNumber: 4,
            splitLine: {
                lineStyle: {
                    color: computed(() => (colorMode.value === "dark" ? "#314158" : "#cad5e2")),
                },
            },
            axisLine: {
                show: false,
            },
            axisLabel: {
                show: false,
            },
            splitArea: {
                show: false,
            },
        },
    ],
    series: [
        {
            name: "价格",
            type: "line",
            data: [23, 60, 20, 36, 23, 85],
            emphasis: {
                itemStyle: { color: computed(() => currentColor.value) },
                lineStyle: { color: computed(() => currentColor.value) },
                areaStyle: { color: computed(() => currentColor.value) },
            },
            lineStyle: {
                width: 4,
                color: {
                    type: "linear",
                    colorStops: [
                        {
                            offset: 0,
                            color: computed(() => currentColor.value), // 0% 处的颜色
                        },
                        {
                            offset: 1,
                            color: computed(() => currentColor.value), // 100% 处的颜色
                        },
                    ],
                    globalCoord: true, // 缺省为 false
                },
            },
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
                color: computed(() => currentColor.value),
                borderWidth: 2,
                borderColor: "#fff",
            },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        {
                            offset: 0,
                            color: computed(() => currentColor.value),
                        },
                        {
                            offset: 1,
                            color: computed(() => currentColor.value),
                        },
                    ],
                },
                opacity: 0.1,
            },
            smooth: true,
        },
    ],
});

// 项目进度柱状图配置
const progressChartOptions = reactive({
    tooltip: {
        trigger: "axis",
        axisPointer: {
            type: "shadow",
        },
    },
    grid: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        containLabel: true,
    },
    xAxis: {
        type: "category",
        data: projects.map((p) => p.name),
    },
    yAxis: {
        type: "value",
        max: 100,
        name: "完成百分比",
        splitLine: {
            lineStyle: {
                color: computed(() => (colorMode.value === "dark" ? "#314158" : "#cad5e2")),
            },
        },
        axisLine: {
            show: false,
        },
        axisLabel: {
            show: false,
        },
        splitArea: {
            show: false,
        },
    },
    series: [
        {
            name: "项目进度",
            type: "bar",
            data: projects.map((p) => p.progress),
            showBackground: true,
            emphasis: { itemStyle: { color: computed(() => currentColor.value) } },
            backgroundStyle: {
                color: "rgba(180, 180, 180, 0.2)",
                borderRadius: [10, 10, 0, 0],
            },
            barWidth: "40%",
            itemStyle: {
                borderRadius: [10, 10, 0, 0],
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        {
                            offset: 0,
                            color: computed(() => currentColor.value),
                        },
                        {
                            offset: 1,
                            color: computed(() => currentColor.value),
                        },
                    ],
                },
            },
        },
    ],
});
</script>

<template>
    <ProScrollArea :shadow="false" class="h-[calc(100svh-5rem)]">
        <div class="space-y-4 pb-6">
            <!-- 项目概览卡片 -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <UCard>
                    <template #header>
                        <div class="mb-1 flex items-center font-medium">今日访问数据</div>
                        <div class="mb-1 flex items-center gap-1 text-gray-400">
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
                                <div class="">
                                    <span class="text-2xl font-bold">8</span>
                                    <span class="ml-1 text-xs text-gray-400">次</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                            <USeparator orientation="vertical" class="h-6" />
                            <div>
                                <div class="">
                                    <span class="text-2xl font-bold">8</span>
                                    <span class="ml-1 text-xs text-gray-400">次</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                        </div>
                        <div class="flex flex-col items-center justify-center text-gray-400">
                            <UIcon
                                name="i-heroicons-arrow-trending-up"
                                class="text-primary size-7"
                            />
                            <span class="text-xs">
                                同比昨天增长
                                <span class="text-primary text-base font-medium">8</span> 次
                            </span>
                        </div>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="mb-1 flex items-center font-medium">近15天访问数据</div>
                        <div class="mb-1 flex items-center gap-1 text-gray-400">
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
                                <div class="">
                                    <span class="text-2xl font-bold">468</span>
                                    <span class="ml-1 text-xs text-gray-400">次</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                            <USeparator orientation="vertical" class="h-6" />
                            <div>
                                <div class="">
                                    <span class="text-2xl font-bold">359</span>
                                    <span class="ml-1 text-xs text-gray-400">次</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                        </div>
                        <div class="text-primary flex flex-col items-center justify-center">
                            <UIcon name="i-heroicons-arrow-trending-up" class="size-7" />
                            <span class="text-xs text-gray-400">
                                同比上月增
                                <span class="text-primary text-base font-medium">418</span> 次
                            </span>
                        </div>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="mb-1 flex items-center font-medium">项目完成率</div>
                        <div class="mb-1 flex items-center gap-1 text-gray-400">
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
                                <div class="">
                                    <span class="text-2xl font-bold">
                                        {{
                                            Math.round(
                                                projects.reduce((acc, p) => acc + p.progress, 0) /
                                                    projects.length,
                                            )
                                        }}
                                    </span>
                                    <span class="ml-1 text-xs text-gray-400">%</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                            <USeparator orientation="vertical" class="h-6" />
                            <div>
                                <div class="">
                                    <span class="text-2xl font-bold">
                                        {{
                                            Math.round(
                                                projects.reduce((acc, p) => acc + p.progress, 0) /
                                                    projects.length,
                                            )
                                        }}
                                    </span>
                                    <span class="ml-1 text-xs text-gray-400">%</span>
                                </div>
                                <div class="text-xs text-gray-400">页面访问量</div>
                            </div>
                        </div>
                        <div class="text-primary flex flex-col items-center justify-center">
                            <UIcon name="i-heroicons-arrow-trending-up" class="size-7" />
                            <span class="mt-1 text-xs text-gray-400">
                                同比上月增
                                <span class="text-primary text-base font-medium">5</span> %
                            </span>
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- 图表展示区域 -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <UCard class="lg:col-span-2">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium">项目状态分布</h3>
                        </div>
                        <div class="mb-1 flex items-center gap-1 text-gray-400">
                            <UIcon name="i-lucide-info" class="size-3" />
                            <TimeDisplay
                                :datetime="new Date().toISOString()"
                                mode="datetime"
                                class="text-xs"
                            />
                        </div>
                    </template>
                    <div class="h-80">
                        <ProEcharts :options="chartOptions as EChartsOption" height="100%" />
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium">项目进度概览</h3>
                        </div>
                        <div class="mb-1 flex items-center gap-1 text-gray-400">
                            <UIcon name="i-lucide-info" class="size-3" />
                            <TimeDisplay
                                :datetime="new Date().toISOString()"
                                mode="datetime"
                                class="text-xs"
                            />
                        </div>
                    </template>
                    <div class="h-80">
                        <ProEcharts
                            :options="progressChartOptions as EChartsOption"
                            height="100%"
                        />
                    </div>
                </UCard>
            </div>

            <!-- 项目列表 -->
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium">项目列表</h3>
                            <div class="mb-1 flex items-center gap-1 text-gray-400">
                                <UIcon name="i-lucide-info" class="size-3" />
                                <TimeDisplay
                                    :datetime="new Date().toISOString()"
                                    mode="datetime"
                                    class="text-xs"
                                />
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <UInput
                                placeholder="搜索项目..."
                                icon="i-heroicons-magnifying-glass"
                                size="sm"
                            />
                            <USelect
                                size="sm"
                                placeholder="状态"
                                :items="[
                                    { label: '全部', value: 'all' },
                                    { label: '进行中', value: 'in-progress' },
                                    { label: '已完成', value: 'completed' },
                                    { label: '规划中', value: 'planning' },
                                    { label: '已延期', value: 'delayed' },
                                ]"
                            />
                        </div>
                    </div>
                </template>

                <UTable :data="projects" :columns="columns">
                    <template #members-cell="{ row }">
                        <div class="flex items-center space-x-2">
                            <UAvatarGroup>
                                <UAvatar
                                    v-for="member in row.original.members"
                                    :key="member.name"
                                    :src="member.avatar"
                                />
                            </UAvatarGroup>
                        </div>
                    </template>
                </UTable>
            </UCard>
        </div>
    </ProScrollArea>
</template>
