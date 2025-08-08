/**
 * 图标类型定义
 * @description 支持字符串图标名称和SVG内容
 */

export type IconType =
    | string
    | {
          type: "svg";
          content: string;
      };
