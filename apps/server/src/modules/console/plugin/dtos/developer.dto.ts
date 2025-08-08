import { IsDefined, IsNotEmpty, IsString } from "class-validator";

export class DeveloperSecretDto {
    @IsDefined({ message: "密钥不能为空" })
    @IsNotEmpty({ message: "密钥不能为空" })
    @IsString({ message: "密钥必须是字符串" })
    secretKey: string;
}
