import { computed, reactive } from "vue";

interface ComponentConfigMap {
    [key: string]: ComponentMenuItem;
}

interface CategoryConfigMap {
    [key: string]: ComponentCategory;
}

interface ConfigModule {
    [key: string]: any;
}

/**
 * 组件配置映射（响应式）
 */
const componentConfigMap = reactive<ComponentConfigMap>({});
const categoryConfigMap = reactive<CategoryConfigMap>({});

/**
 * 动态导入组件配置
 * @param DEFAULT_DEVICE_TYPE - 设备类型（web/mobile）
 */
export async function importComponentConfigs(DEFAULT_DEVICE_TYPE: DecorateScene) {
    // 重置组件配置数据
    Object.keys(componentConfigMap).forEach((key) => delete componentConfigMap[key]);
    Object.keys(categoryConfigMap).forEach((key) => delete categoryConfigMap[key]);

    // 动态导入PC组件配置
    const webConfigs = import.meta.glob<ConfigModule>("../components/widgets/web/*/config.ts", {
        eager: false,
    });

    // 动态导入Mobile组件配置
    const mobileConfigs = import.meta.glob<ConfigModule>(
        "../components/widgets/mobile/*/config.ts",
        { eager: false },
    );

    // 根据设备类型选择要处理的配置
    const configsToProcess = DEFAULT_DEVICE_TYPE === "web" ? [webConfigs] : [mobileConfigs];

    // 处理每个配置集合
    for (const configs of configsToProcess) {
        for (const [path, loader] of Object.entries(configs)) {
            const match = path.match(/\/(web|mobile)\/([^/]+)\/config\.ts$/);
            if (!match) continue;

            const componentType = match[2];
            const mod = (await (loader as any)()) as ConfigModule;
            const config = Object.values(mod).find(
                (item) => item && typeof item === "object" && (item as any).type === componentType,
            ) as ComponentMenuItem | undefined;

            if (config) {
                componentConfigMap[componentType] = config;
                if (config.category) {
                    categoryConfigMap[config.category.id] = config.category;
                }
            }
        }
    }
}

/**
 * 获取有效的分类信息
 * 只返回包含可用组件的分类，并按指定顺序排序
 */
export const getCategories = computed(() => {
    // 获取所有已加载的组件的分类 ID
    const validCategoryIds = new Set(
        Object.values(componentConfigMap)
            .map((component) => component.category?.id)
            .filter(Boolean),
    );

    // 只返回包含可用组件的分类
    const validCategories = Object.values(categoryConfigMap).filter((category) =>
        validCategoryIds.has(category.id),
    );

    // 定义分类优先级顺序：基础组件优先，拓展组件其次，其他分类按原顺序
    const categoryOrder = ["basic", "extension"];

    return validCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.id);
        const indexB = categoryOrder.indexOf(b.id);

        // 如果都在优先级列表中，按优先级排序
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // 如果只有 a 在优先级列表中，a 排前面
        if (indexA !== -1 && indexB === -1) {
            return -1;
        }

        // 如果只有 b 在优先级列表中，b 排前面
        if (indexA === -1 && indexB !== -1) {
            return 1;
        }

        // 如果都不在优先级列表中，保持原顺序
        return 0;
    });
});

/**
 * 获取分类下的组件列表
 * 按组件的order字段排序，order值越小排序越靠前
 * 如果没有order字段，则默认排在最后
 */
export const getCategoryComponents = computed(
    () => (categoryId: string) =>
        Object.values(componentConfigMap)
            .filter(({ category }) => category?.id === categoryId)
            .sort((a, b) => {
                // 如果a没有order，则排在后面
                if (a.order === undefined && b.order !== undefined) return 1;
                // 如果b没有order，则排在后面
                if (a.order !== undefined && b.order === undefined) return -1;
                // 如果都有order，按order值升序排列
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                // 如果都没有order，保持原顺序
                return 0;
            }),
);
