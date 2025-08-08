import { IsDefined, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * 管理员修改密码DTO
 */
export class ChangePasswordDto {
    /**
     * 旧密码
     */
    @IsDefined({ message: "旧密码参数必须传递" })
    @IsNotEmpty({ message: "旧密码不能为空" })
    @IsString({ message: "旧密码必须是字符串" })
    oldPassword: string;

    /**
     * 新密码
     */
    @IsDefined({ message: "新密码参数必须传递" })
    @IsNotEmpty({ message: "新密码不能为空" })
    @IsString({ message: "新密码必须是字符串" })
    @MinLength(6, { message: "新密码长度不能少于6个字符" })
    newPassword: string;

    /**
     * 确认密码
     */
    @IsDefined({ message: "确认密码参数必须传递" })
    @IsNotEmpty({ message: "确认密码不能为空" })
    @IsString({ message: "确认密码必须是字符串" })
    @MinLength(6, { message: "确认密码长度不能少于6个字符" })
    confirmPassword: string;
}
