import {
    IsBoolean,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Length,
    Matches,
    MaxLength,
} from "class-validator";

/**
 * 创建插件DTO
 */
export class CreatePlugDto {
    /**
     * 插件名称
     */
    @IsNotEmpty({ message: "插件名称不能为空" })
    @IsString({ message: "插件名称必须是字符串" })
    @MaxLength(50, { message: "插件名称长度不能超过50" })
    name: string;

    /**
     * 插件图标
     */
    @IsOptional()
    @IsString({ message: "插件图标必须是字符串" })
    @MaxLength(255, { message: "插件图标长度不能超过255" })
    icon?: string;

    /**
     * 插件唯一标识符
     */
    @IsNotEmpty({ message: "插件标识符不能为空" })
    @IsString({ message: "插件标识符必须是字符串" })
    @Length(4, 50, { message: "插件包名长度必须在4-50个字符之间" })
    packName: string;

    /**
     * 插件版本
     */
    @IsString({ message: "插件版本必须是字符串" })
    @Length(5, 50, { message: "插件版本长度必须在4-50个字符之间" })
    @Matches(/^[0-9]+\.[0-9]+\.[0-9]+$/, { message: "插件版本格式不正确，必须符合 x.x.x 格式" })
    version: string;

    /**
     * 插件描述
     */
    @IsOptional()
    @IsString({ message: "插件描述必须是字符串" })
    @MaxLength(500, { message: "插件描述长度不能超过500" })
    description?: string;
}
