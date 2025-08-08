import colors from "tailwindcss/colors";

/** 颜色名称类型 */
export type ColorName =
    | "red"
    | "orange"
    | "yellow"
    | "lime"
    | "green"
    | "teal"
    | "cyan"
    | "blue"
    | "indigo"
    | "violet"
    | "purple"
    | "fuchsia"
    | "pink"
    | "black";

/** 中性颜色名称类型 */
export type NeutralColorName = "slate" | "gray" | "zinc" | "neutral" | "stone";

/** 可用的颜色列表 */
export const colorList: ColorName[] = [
    "red",
    "orange",
    "yellow",
    "lime",
    "green",
    "teal",
    "cyan",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "black",
];

/** 可用的中性颜色列表 */
export const neutralColorList: NeutralColorName[] = ["slate", "gray", "zinc", "neutral", "stone"];

/** 颜色中文名称映射 */
export const colorListMap: Record<ColorName, string> = {
    red: "console-common.theme.red",
    orange: "console-common.theme.orange",
    yellow: "console-common.theme.yellow",
    lime: "console-common.theme.lime",
    green: "console-common.theme.green",
    teal: "console-common.theme.teal",
    cyan: "console-common.theme.cyan",
    blue: "console-common.theme.blue",
    indigo: "console-common.theme.indigo",
    violet: "console-common.theme.violet",
    purple: "console-common.theme.purple",
    fuchsia: "console-common.theme.fuchsia",
    pink: "console-common.theme.pink",
    black: "console-common.theme.black",
};

/** 中性颜色中文名称映射 */
export const neutralColorMap: Record<NeutralColorName, string> = {
    slate: "console-common.theme.slate",
    gray: "console-common.theme.gray",
    zinc: "console-common.theme.zinc",
    neutral: "console-common.theme.neutral",
    stone: "console-common.theme.stone",
};

/** 可用的色调数组 */
export const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * 从tailwind颜色中获取指定颜色和色调的值
 * @param color 颜色名称
 * @param shade 色调值
 * @returns 颜色值
 */
export function getColor(color: keyof typeof colors, shade: (typeof shades)[number]): string {
    return (colors[color] as Record<number, string> | undefined)?.[shade] ?? "#181818";
}
