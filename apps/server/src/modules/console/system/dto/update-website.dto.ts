import { Type } from "class-transformer";
import { IsNotEmpty, IsObject, IsOptional, ValidateNested } from "class-validator";

class WebInfoDto {
    @IsNotEmpty({ message: "网站名称不能为空" })
    name: string;

    @IsOptional()
    description?: string;

    @IsNotEmpty({ message: "网站图标不能为空" })
    icon: string;

    @IsNotEmpty({ message: "网站logo不能为空" })
    logo: string;
}

class AgreementDto {
    @IsNotEmpty({ message: "服务条款标题不能为空" })
    serviceTitle: string;

    @IsNotEmpty({ message: "服务条款内容不能为空" })
    serviceContent: string;

    @IsNotEmpty({ message: "隐私政策标题不能为空" })
    privacyTitle: string;

    @IsNotEmpty({ message: "隐私政策内容不能为空" })
    privacyContent: string;

    @IsNotEmpty({ message: "支付协议标题不能为空" })
    paymentTitle: string;

    @IsNotEmpty({ message: "支付协议内容不能为空" })
    paymentContent: string;

    @IsOptional()
    updateAt?: string;
}

class CopyrightDto {
    @IsNotEmpty({ message: "版权名称不能为空" })
    displayName: string;

    @IsNotEmpty({ message: "图标URL不能为空" })
    iconUrl: string;

    @IsNotEmpty({ message: "链接URL不能为空" })
    url: string;
}

class StatisticsDto {
    @IsNotEmpty({ message: "统计AppID不能为空" })
    appid: string;
}

export class UpdateWebsiteDto {
    /**
     * 网站信息
     */
    @IsOptional()
    @IsObject({ message: "网站信息必须是对象格式" })
    @ValidateNested()
    @Type(() => WebInfoDto)
    webinfo?: WebInfoDto;

    /**
     * 隐私协议
     */
    @IsOptional()
    @IsObject({ message: "隐私协议必须是对象格式" })
    @ValidateNested()
    @Type(() => AgreementDto)
    agreement?: AgreementDto;

    /**
     * 版权信息
     */
    @IsOptional()
    @IsObject({ message: "版权信息必须是对象格式" })
    @ValidateNested()
    @Type(() => CopyrightDto)
    copyright?: CopyrightDto;

    /**
     * 站点统计
     */
    @IsOptional()
    @IsObject({ message: "站点统计必须是对象格式" })
    @ValidateNested()
    @Type(() => StatisticsDto)
    statistics?: StatisticsDto;
}
