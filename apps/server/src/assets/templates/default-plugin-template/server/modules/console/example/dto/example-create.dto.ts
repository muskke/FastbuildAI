import { IsDefined, IsNotEmpty, IsString } from "class-validator";

/**
 * 创建示例DTO
 */
export class ExampleCreateDto {
    /**
     * 名称
     */
    @IsDefined({ message: "名称参数必须传递" })
    @IsNotEmpty({ message: "名称不能为空" })
    @IsString({ message: "名称必须是字符串" })
    name: string;
}
