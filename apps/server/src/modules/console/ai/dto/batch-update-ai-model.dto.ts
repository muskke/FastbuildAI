import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";

import { UpdateAiModelDto } from "./ai-model.dto";

/**
 * 批量更新AI模型项DTO
 */
export class BatchUpdateAiModelItemDto extends UpdateAiModelDto {
    /**
     * 模型ID
     */
    @IsString({ message: "模型ID必须是字符串" })
    id: string;
}

/**
 * 批量更新AI模型DTO
 */
export class BatchUpdateAiModelDto {
    /**
     * 模型列表
     *
     * 每个元素包含模型ID和需要更新的字段
     */
    @IsArray({ message: "模型列表必须是数组" })
    @ArrayMinSize(1, { message: "模型列表至少需要包含一个模型" })
    @ValidateNested({ each: true })
    @Type(() => BatchUpdateAiModelItemDto)
    models: BatchUpdateAiModelItemDto[];

    /**
     * 是否跳过错误继续执行
     *
     * 如果为true，则在处理某个模型出错时会继续处理其他模型
     * 如果为false，则在处理某个模型出错时会立即终止并返回错误
     */
    @IsOptional()
    @IsBoolean({ message: "skipErrors必须是布尔值" })
    skipErrors?: boolean = false;
}
