import { PaginationDto } from "@common/dto/pagination.dto";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import { TEAM_ROLE, type TeamRoleType } from "../constants/team-role.constants";

/**
 * 添加团队成员DTO
 */
export class AddTeamMemberDto {
    /**
     * 知识库ID
     */
    @IsUUID(4, { message: "知识库ID必须是有效的UUID格式" })
    datasetId: string;

    /**
     * 用户ID
     */
    @IsUUID(4, { message: "用户ID必须是有效的UUID格式" })
    userId: string;

    /**
     * 团队角色
     */
    @IsEnum(TEAM_ROLE, { message: "角色必须是有效的团队角色" })
    role: TeamRoleType;

    /**
     * 备注信息
     */
    @IsOptional()
    @IsString({ message: "备注信息必须是字符串" })
    note?: string;
}

/**
 * 更新团队成员角色DTO
 */
export class UpdateTeamMemberRoleDto {
    /**
     * 成员ID
     */
    @IsUUID(4, { message: "成员ID必须是有效的UUID格式" })
    memberId: string;

    /**
     * 新的团队角色
     */
    @IsEnum(TEAM_ROLE, { message: "角色必须是有效的团队角色" })
    role: TeamRoleType;

    /**
     * 备注信息
     */
    @IsOptional()
    @IsString({ message: "备注信息必须是字符串" })
    note?: string;
}

/**
 * 移除团队成员DTO
 */
export class RemoveTeamMemberDto {
    /**
     * 成员ID
     */
    @IsUUID(4, { message: "成员ID必须是有效的UUID格式" })
    memberId: string;
}

/**
 * 查询团队成员DTO
 */
export class QueryTeamMemberDto extends PaginationDto {
    /**
     * 知识库ID
     */
    @IsUUID(4, { message: "知识库ID必须是有效的UUID格式" })
    datasetId: string;

    /**
     * 角色筛选
     */
    @IsOptional()
    @IsEnum(TEAM_ROLE, { message: "角色必须是有效的团队角色" })
    role?: TeamRoleType;

    /**
     * 用户名搜索
     */
    @IsOptional()
    @IsString({ message: "用户名必须是字符串" })
    username?: string;

    /**
     * 是否启用筛选
     */
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean({ message: "启用状态必须是布尔值" })
    isActive?: boolean;
}

/**
 * 团队成员详情DTO
 */
export class TeamMemberDetailDto {
    /**
     * 成员ID
     */
    id: string;

    /**
     * 知识库ID
     */
    datasetId: string;

    /**
     * 用户ID
     */
    userId: string;

    /**
     * 团队角色
     */
    role: TeamRoleType;

    /**
     * 加入时间
     */
    joinedAt: Date;

    /**
     * 邀请者ID
     */
    invitedBy?: string;

    /**
     * 最后活跃时间
     */
    lastActiveAt?: Date;

    /**
     * 是否启用
     */
    isActive: boolean;

    /**
     * 备注信息
     */
    note?: string;

    /**
     * 更新时间
     */
    updatedAt: Date;

    // 关联信息

    /**
     * 用户信息
     */
    user?: {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        nickname?: string;
    };

    /**
     * 邀请者信息
     */
    inviter?: {
        id: string;
        username: string;
        nickname?: string;
    };
}

/**
 * 转移所有权DTO
 */
export class TransferOwnershipDto {
    /**
     * 知识库ID
     */
    @IsUUID(4, { message: "知识库ID必须是有效的UUID格式" })
    datasetId: string;

    /**
     * 新所有者用户ID
     */
    @IsUUID(4, { message: "新所有者ID必须是有效的UUID格式" })
    newOwnerId: string;
}

/**
 * 批量操作团队成员DTO
 */
export class BatchTeamMemberOperationDto {
    /**
     * 成员ID列表
     */
    @IsUUID(4, { each: true, message: "每个成员ID必须是有效的UUID格式" })
    memberIds: string[];

    /**
     * 操作类型：remove-移除, update_role-更新角色, toggle_active-切换启用状态
     */
    @IsEnum(["remove", "update_role", "toggle_active"], { message: "操作类型无效" })
    operation: "remove" | "update_role" | "toggle_active";

    /**
     * 新角色（仅当操作类型为update_role时需要）
     */
    @IsOptional()
    @IsEnum(TEAM_ROLE, { message: "角色必须是有效的团队角色" })
    newRole?: TeamRoleType;
}

/**
 * 批量添加团队成员DTO
 */
export class BatchAddTeamMemberDto {
    /**
     * 知识库ID
     */
    @IsUUID(4, { message: "知识库ID必须是有效的UUID格式" })
    datasetId: string;

    /**
     * 成员列表
     */
    @IsArray({ message: "成员列表必须是数组" })
    @Type(() => BatchAddTeamMemberItemDto)
    members: BatchAddTeamMemberItemDto[];
}

/**
 * 批量添加团队成员项DTO
 */
export class BatchAddTeamMemberItemDto {
    /**
     * 用户ID
     */
    @IsUUID(4, { message: "用户ID必须是有效的UUID格式" })
    userId: string;

    /**
     * 团队角色
     */
    @IsEnum(TEAM_ROLE, { message: "角色必须是有效的团队角色" })
    role: TeamRoleType;

    /**
     * 备注信息
     */
    @IsOptional()
    @IsString({ message: "备注信息必须是字符串" })
    note?: string;
}
