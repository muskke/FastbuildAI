import { PaginationDto } from "@common/dto/pagination.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { MenuSourceType, MenuType } from "../entities/menu.entity";

/**
 * 查询菜单DTO
 */
export class QueryMenuDto extends PaginationDto {
    /**
     * 菜单名称
     */
    @IsString()
    @IsOptional()
    name?: string;

    /**
     * 菜单类型
     */
    @IsEnum(MenuType)
    @IsOptional()
    type?: MenuType;

    /**
     * 父级菜单ID
     */
    @IsString()
    @IsOptional()
    parentId?: string;

    /**
     * 菜单来源类型
     */
    @IsEnum(MenuSourceType)
    @IsOptional()
    sourceType?: MenuSourceType;

    /**
     * 插件标识
     */
    @IsString()
    @IsOptional()
    pluginPackName?: string;
}
