import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Post, Put, Query } from "@nestjs/common";

import {
    AddTeamMemberDto,
    BatchAddTeamMemberDto,
    BatchTeamMemberOperationDto,
    QueryTeamMemberDto,
    RemoveTeamMemberDto,
    TeamMemberDetailDto,
    TransferOwnershipDto,
    UpdateTeamMemberRoleDto,
} from "../dto/team-members.dto";
import { DatasetMember } from "../entities/datasets-member.entity";
import { DatasetMemberService } from "../services/datasets-member.service";

/**
 * 知识库团队成员管理控制器
 */
@ConsoleController("ai-datasets-team-members", "数据集团队成员")
export class TeamMemberController {
    constructor(private readonly datasetMemberService: DatasetMemberService) {}

    /**
     * 添加团队成员
     */
    @Post("")
    @Permissions({
        code: "add-member",
        name: "添加团队成员",
    })
    async addMember(
        @Body() addMemberDto: AddTeamMemberDto,
        @Playground() user: UserPlayground,
    ): Promise<DatasetMember> {
        return this.datasetMemberService.addMember(addMemberDto, user.id);
    }

    /**
     * 批量添加团队成员
     */
    @Post("batch")
    @Permissions({
        code: "batch-add-members",
        name: "批量添加团队成员",
    })
    async batchAddMembers(
        @Body() batchAddDto: BatchAddTeamMemberDto,
        @Playground() user: UserPlayground,
    ): Promise<DatasetMember[]> {
        return this.datasetMemberService.batchAddMembers(batchAddDto, user.id);
    }

    /**
     * 更新团队成员角色
     */
    @Put("role")
    @Permissions({
        code: "update-member-role",
        name: "更新成员角色",
    })
    async updateMemberRole(
        @Body() updateRoleDto: UpdateTeamMemberRoleDto,
        @Playground() user: UserPlayground,
    ): Promise<DatasetMember> {
        return this.datasetMemberService.updateMemberRole(updateRoleDto, user.id);
    }

    /**
     * 移除团队成员
     */
    @Delete("")
    @Permissions({
        code: "remove-member",
        name: "移除团队成员",
    })
    async removeMember(
        @Body() removeMemberDto: RemoveTeamMemberDto,
        @Playground() user: UserPlayground,
    ): Promise<{ message: string }> {
        await this.datasetMemberService.removeMember(removeMemberDto, user.id);
        return { message: "团队成员已成功移除" };
    }

    /**
     * 查询团队成员列表
     *
     * 返回团队成员列表，并标记当前用户是否可以操作每个成员
     */
    @Get("")
    @BuildFileUrl(["**.avatar"])
    @Permissions({
        code: "list",
        name: "查询团队成员列表",
    })
    async getMembers(@Query() queryDto: QueryTeamMemberDto, @Playground() user: UserPlayground) {
        return this.datasetMemberService.getMembers(queryDto, user.id);
    }

    /**
     * 获取团队成员详情
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看成员详情",
    })
    async getMemberDetail(@Query("id") memberId: string): Promise<TeamMemberDetailDto> {
        return this.datasetMemberService.getMemberDetail(memberId);
    }

    /**
     * 转移知识库所有权
     */
    @Put("ownership/transfer")
    @Permissions({
        code: "transfer-ownership",
        name: "转移所有权",
    })
    async transferOwnership(
        @Body() transferDto: TransferOwnershipDto,
        @Playground() user: UserPlayground,
    ): Promise<{ message: string }> {
        await this.datasetMemberService.transferOwnership(transferDto, user.id);
        return { message: "所有权转移成功" };
    }

    /**
     * 批量操作团队成员
     */
    @Put("batch")
    @Permissions({
        code: "batch-operation",
        name: "批量操作成员",
    })
    async batchOperation(
        @Body() batchDto: BatchTeamMemberOperationDto,
        @Playground() user: UserPlayground,
    ): Promise<{ message: string }> {
        await this.datasetMemberService.batchOperation(batchDto, user.id);
        return { message: "批量操作完成" };
    }

    /**
     * 获取用户在知识库中的角色
     */
    @Get("role/:datasetId")
    @Permissions({
        code: "get-user-role",
        name: "查询用户角色",
    })
    async getUserRole(
        @Query("datasetId") datasetId: string,
        @Playground() user: UserPlayground,
    ): Promise<{ role: string | null; isActive: boolean }> {
        const member = await this.datasetMemberService.getUserMemberInDataset(datasetId, user.id);
        return {
            role: member?.role || null,
            isActive: !!member?.isActive,
        };
    }

    /**
     * 检查用户是否为知识库成员
     */
    @Get("check/:datasetId")
    @Permissions({
        code: "check-membership",
        name: "检查成员身份",
    })
    async checkMembership(
        @Query("datasetId") datasetId: string,
        @Playground() user: UserPlayground,
    ): Promise<{ isMember: boolean; role?: string }> {
        const isMember = await this.datasetMemberService.isDatasetMember(datasetId, user.id);
        let role: string | undefined;

        if (isMember) {
            role = await this.datasetMemberService.getUserRoleInDataset(datasetId, user.id);
        }

        return {
            isMember,
            role,
        };
    }
}
