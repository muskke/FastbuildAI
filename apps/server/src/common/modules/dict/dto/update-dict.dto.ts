import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * 更新字典配置DTO
 */
export class UpdateDictDto {
    /**
     * 配置键
     * 用于标识配置项的唯一键名
     */
    @IsString()
    @IsOptional()
    @MaxLength(100, { message: "配置键长度不能超过100个字符" })
    key?: string;

    /**
     * 配置值
     * 存储配置项的值，使用JSON格式
     */
    @IsString()
    @IsOptional()
    value?: string;

    /**
     * 配置分组
     * 用于对配置进行分类管理
     */
    @IsString()
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
