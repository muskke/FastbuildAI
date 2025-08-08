import { IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

/**
 * 打包插件DTO
 */
export class PackagePluginDto {
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
    @IsOptional()
    @IsString({ message: "插件版本必须是字符串" })
    @Length(5, 50, { message: "插件版本长度必须在4-50个字符之间" })
    @Matches(/^[0-9]+\.[0-9]+\.[0-9]+$/)
    version: string;
}
