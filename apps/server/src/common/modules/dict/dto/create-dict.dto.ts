import {
    IsBoolean,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

/**
 * 创建字典配置DTO
 */
export class CreateDictDto {
    /**
     * 配置键
     * 用于标识配置项的唯一键名
     */
    @IsDefined({ message: "配置键参数必须传递" })
    @IsString({ message: "配置键必须是字符串" })
    @IsNotEmpty({ message: "配置键不能为空" })
    @MaxLength(100, { message: "配置键长度不能超过100个字符" })
    key: string;

    /**
     * 配置值
     * 存储配置项的值，使用JSON格式
     */
    @IsDefined({ message: "配置值参数必须传递" })
    @IsNotEmpty({ message: "配置值不能为空" })
    value: string;

    /**
     * 配置分组
     * 用于对配置进行分类管理
     */
    @IsDefined({ message: "配置分组参数必须传递" })
    @IsOptional()
    @MaxLength(50, { message: "配置分组长度不能超过50个字符" })
    group?: string;

    /**
     * 配置描述
     * 对配置项的说明
     */
    @IsString()
    @IsOptional()
    @MaxLength(255, { message: "配置描述长度不能超过255个字符" })
    description?: string;

    /**
     * 排序
     */
    @IsInt()
    @IsOptional()
    sort?: number;

    /**
     * 是否启用
     */
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;
}
