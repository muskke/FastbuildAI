import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsUUID } from "class-validator";

/**
 * 用户添加MCP服务的DTO
 */
export class AddUserMcpServerDto {
    /**
     * MCP服务ID
     */
    @IsNotEmpty({ message: "MCP服务ID不能为空" })
    @IsUUID(undefined, { message: "MCP服务ID必须是有效的UUID" })
    mcpServerId: string;

    /**
     * 超时时间（秒）
     */
    @IsOptional()
    @IsNumber({}, { message: "超时时间必须是数字" })
    timeout?: number;

    /**
     * 是否显示该服务
     */
    @IsOptional()
    @IsBoolean({ message: "是否显示必须是布尔值" })
    isShow?: boolean;
}

/**
 * 更新用户MCP服务的DTO
 */
export class UpdateUserMcpServerDto extends PartialType(AddUserMcpServerDto) {}
