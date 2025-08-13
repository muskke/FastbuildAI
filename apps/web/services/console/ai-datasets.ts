import {
    useConsoleDelete,
    useConsoleGet,
    useConsolePatch,
    useConsolePost,
} from "@/common/composables/useRequest";
import type {
    AddTeamMemberParams,
    BatchTeamMemberOperationParams,
    CreateDatasetParams,
    CreateDocumentParams,
    CreateDocumentResponse,
    CreateSegmentParams,
    Dataset,
    DatasetChunk,
    DatasetDocument,
    DatasetSegment,
    IndexingSegmentsResponse,
    MembershipCheckResponse,
    QueryDatasetParams,
    QueryDocumentParams,
    QueryKnowledgeParams,
    QuerySegmentParams,
    QueryTeamMemberParams,
    RemoveTeamMemberParams,
    RetrievalConfig,
    TeamMember,
    TeamRole,
    TransferOwnershipParams,
    UpdateDatasetParams,
    UpdateSegmentParams,
    UpdateTeamMemberRoleParams,
    UserRoleResponse,
} from "@/models/ai-datasets";
import type { PaginationResult } from "@/models/global";

// ==================== 重新导出类型 ====================

export type {
    CreateDatasetParams,
    CreateDocumentParams,
    CreateDocumentResponse,
    Dataset,
    DatasetDocument,
    DatasetSegment,
    IndexingSegmentsResponse,
    QueryDatasetParams,
    QueryDocumentParams,
    QueryKnowledgeParams,
    QuerySegmentParams,
    UpdateSegmentParams,
};

// ==================== 知识库相关 API ====================

/**
 * 创建知识库
 * @param data 知识库创建数据
 * @returns 创建的知识库信息
 */
export function apiCreateDataset(data: CreateDatasetParams): Promise<Dataset> {
    return useConsolePost("/ai-datasets/create", data);
}

/**
 * 创建空知识库
 * @param data 只需 name 和 description
 * @returns 创建的知识库信息
 */
export function apiCreateEmptyDataset(data: {
    name: string;
    description?: string;
}): Promise<Dataset> {
    return useConsolePost("/ai-datasets/create-empty", data);
}

/**
 * 获取知识库列表
 * @param params 查询参数
 * @returns 知识库列表和分页信息
 */
export function apiGetDatasetList(params: QueryDatasetParams): Promise<PaginationResult<Dataset>> {
    return useConsoleGet("/ai-datasets", params, { requireAuth: true });
}

/**
 * 获取知识库详情
 * @param id 知识库ID
 * @returns 知识库详情
 */
export function apiGetDatasetDetail(id: string): Promise<Dataset> {
    return useConsoleGet(`/ai-datasets/${id}`);
}

/**
 * 更新知识库设置
 * @param id 知识库ID
 * @param data 更新数据
 * @returns 更新后的知识库信息
 */
export function apiUpdateDataset(id: string, data: UpdateDatasetParams): Promise<Dataset> {
    return useConsolePatch(`/ai-datasets/${id}/update`, data);
}

/**
 * 删除知识库
 * @param id 知识库ID
 * @returns 删除结果
 */
export function apiDeleteDataset(id: string): Promise<{ success: boolean }> {
    return useConsoleDelete(`/ai-datasets/${id}`);
}

/**
 * 重试知识库下所有失败文档的向量化
 * @param id 知识库ID
 * @returns 操作结果
 */
export function apiRetryDataset(id: string): Promise<{ success: boolean }> {
    return useConsolePost(`/ai-datasets/${id}/retry`);
}

/**
 * 知识库检索查询
 * @param id 知识库ID
 * @param data 查询参数
 * @returns 检索结果
 */
export function apiQueryDataset(id: string, data: QueryKnowledgeParams): Promise<any> {
    return useConsolePost(`/ai-datasets/${id}/query`, data);
}

/**
 * 召回测试
 * @param id 知识库ID
 * @param data 召回测试参数
 * @returns 召回测试结果
 */
export function apiRetrievalTest(
    id: string,
    data: { query: string; retrievalConfig?: RetrievalConfig },
): Promise<{ chunks: DatasetChunk[]; totalTime: number }> {
    return useConsolePost(`/ai-datasets/${id}/retrieval-test`, data, { requireAuth: true });
}

/**
 * 数据集分段和清洗
 * @param data 分段参数
 * @returns 分段处理结果
 */
export function apiIndexingSegments(data: any): Promise<IndexingSegmentsResponse> {
    return useConsolePost("/ai-datasets/indexing-segments", data);
}

// ==================== 文档相关 API ====================

/**
 * 创建文档
 * @param data 文档创建数据
 * @returns 创建的文档信息
 */
export function apiCreateDocument(data: CreateDocumentParams): Promise<CreateDocumentResponse> {
    return useConsolePost("/ai-datasets-documents/create", data);
}

/**
 * 获取文档列表
 * @param params 查询参数
 * @returns 文档列表和分页信息
 */
export function apiGetDocumentList(
    params: QueryDocumentParams,
): Promise<PaginationResult<DatasetDocument[]>> {
    return useConsoleGet("/ai-datasets-documents", params, { requireAuth: true });
}

/**
 * 获取全部文档列表
 * @param datasets 知识库 Id
 * @returns 文档列表
 */
export function apiGetAllDocumentList(datasetsId: string): Promise<DatasetDocument[]> {
    return useConsoleGet("/ai-datasets-documents/all", { datasetsId }, { requireAuth: true });
}

/**
 * 重试文档下所有失败分段的向量化
 * @param id 文档ID
 * @returns 操作结果
 */
export function apiRetryDocument(id: string): Promise<{ success: boolean }> {
    return useConsolePost(`/ai-datasets-documents/${id}/retry`);
}

/**
 * 获取文档详情
 * @param id 文档ID
 * @returns 文档详情
 */
export function apiGetDocumentDetail(id: string): Promise<DatasetDocument> {
    return useConsoleGet(`/ai-datasets-documents/${id}`);
}

/**
 * 重命名文档
 * @param id 文档ID
 * @param data 重命名数据
 * @returns 更新后的文档
 */
export function apiRenameDocument(
    id: string,
    data: { fileName: string; datasetId: string },
): Promise<DatasetDocument> {
    return useConsolePatch(`/ai-datasets-documents/${id}/rename`, data, { requireAuth: true });
}

/**
 * 删除文档
 * @param id 文档ID
 * @returns 删除结果
 */
export function apiDeleteDocument(id: string, datasetId: string): Promise<{ success: boolean }> {
    return useConsoleDelete(`/ai-datasets-documents/${id}`, { datasetId });
}

/**
 * 设置文档启用/禁用状态
 * @param id 文档ID
 * @param enabled 是否启用
 * @param datasetId 知识库ID
 * @returns 操作结果
 */
export function apiSetDocumentEnabled(
    id: string,
    enabled: boolean,
    datasetId: string,
): Promise<{ success: boolean }> {
    return useConsolePatch(`/ai-datasets-documents/${id}/enabled`, { enabled, datasetId });
}

// ==================== 分段相关 API ====================

/**
 * 创建分段
 * @param data 分段创建数据
 * @returns 创建的分段信息
 */
export function apiCreateSegment(data: CreateSegmentParams): Promise<DatasetSegment> {
    return useConsolePost("/ai-datasets-segments", data);
}

/**
 * 获取分段列表
 * @param params 查询参数
 * @returns 分段列表和分页信息
 */
export function apiGetSegmentList(
    params: QuerySegmentParams,
): Promise<PaginationResult<DatasetSegment[]>> {
    return useConsoleGet("/ai-datasets-segments", params, { requireAuth: true });
}

/**
 * 获取分段详情
 * @param id 分段ID
 * @returns 分段详情
 */
export function apiGetSegmentDetail(id: string): Promise<DatasetSegment> {
    return useConsoleGet(`/ai-datasets-segments/${id}`);
}

/**
 * 编辑分段
 * @param id 分段ID
 * @param data 编辑数据
 * @returns 更新后的分段
 */
export function apiUpdateSegment(id: string, data: UpdateSegmentParams): Promise<DatasetSegment> {
    return useConsolePatch(`/ai-datasets-segments/${id}`, data);
}

/**
 * 删除分段
 * @param id 分段ID
 * @returns 删除结果
 */
export function apiDeleteSegment(id: string, datasetId: string): Promise<{ success: boolean }> {
    return useConsoleDelete(`/ai-datasets-segments/${id}`, { datasetId });
}

/**
 * 批量删除分段
 * @param ids 分段ID列表
 * @returns 删除结果
 */
export function apiBatchDeleteSegments(
    ids: string[],
    datasetId: string,
): Promise<{ success: boolean }> {
    return useConsolePost("/ai-datasets-segments/batch-delete", { ids, datasetId });
}

/**
 * 设置单个分段的启用/禁用状态
 * @param id 分段ID
 * @param enabled 1-启用，0-禁用
 * @returns 操作结果
 */
export function apiSetSegmentEnabled(id: string, enabled: number): Promise<{ success: boolean }> {
    return useConsolePatch(`/ai-datasets-segments/${id}/enabled`, { enabled });
}

/**
 * 批量设置分段的启用/禁用状态
 * @param ids 分段ID数组
 * @param enabled 1-启用，0-禁用
 * @returns 操作结果
 */
export function apiBatchSetSegmentEnabled(
    ids: string[],
    enabled: number,
): Promise<{ success: boolean }> {
    return useConsolePost(`/ai-datasets-segments/batch-enabled`, { ids, enabled });
}

// ==================== 团队成员相关 API ====================

/**
 * 添加团队成员
 * @param data 添加成员参数
 * @returns 添加的成员信息
 */
export function apiAddTeamMember(data: AddTeamMemberParams): Promise<TeamMember> {
    return useConsolePost("/ai-datasets-team-members", data);
}

/**
 * 更新团队成员角色
 * @param data 更新角色参数
 * @returns 更新后的成员信息
 */
export function apiUpdateTeamMemberRole(data: UpdateTeamMemberRoleParams): Promise<TeamMember> {
    return useConsolePut("/ai-datasets-team-members/role", data);
}

/**
 * 移除团队成员
 * @param data 移除成员参数
 * @returns 操作结果
 */
export function apiRemoveTeamMember(data: RemoveTeamMemberParams): Promise<{ message: string }> {
    return useConsoleDelete("/ai-datasets-team-members", data);
}

/**
 * 获取团队成员列表
 * @param params 查询参数
 * @returns 成员列表和分页信息
 */
export function apiGetTeamMembers(
    params: QueryTeamMemberParams,
): Promise<PaginationResult<TeamMember[]>> {
    return useConsoleGet("/ai-datasets-team-members", params, { requireAuth: true });
}

/**
 * 获取团队成员详情
 * @param memberId 成员ID
 * @returns 成员详情
 */
export function apiGetTeamMemberDetail(memberId: string): Promise<TeamMember> {
    return useConsoleGet(`/ai-datasets-team-members/${memberId}`);
}

/**
 * 转移知识库所有权
 * @param data 转移所有权参数
 * @returns 操作结果
 */
export function apiTransferOwnership(data: TransferOwnershipParams): Promise<{ message: string }> {
    return useConsolePut("/ai-datasets-team-members/ownership/transfer", data);
}

/**
 * 批量操作团队成员
 * @param data 批量操作参数
 * @returns 操作结果
 */
export function apiBatchTeamMemberOperation(
    data: BatchTeamMemberOperationParams,
): Promise<{ message: string }> {
    return useConsolePut("/ai-datasets-team-members/batch", data);
}

/**
 * 获取用户在知识库中的角色
 * @param datasetId 知识库ID
 * @returns 用户角色信息
 */
export function apiGetUserRole(datasetId: string): Promise<UserRoleResponse> {
    return useConsoleGet(`/ai-datasets-team-members/role/${datasetId}`);
}

/**
 * 检查用户是否为知识库成员
 * @param datasetId 知识库ID
 * @returns 成员检查结果
 */
export function apiCheckMembership(datasetId: string): Promise<MembershipCheckResponse> {
    return useConsoleGet(`/ai-datasets-team-members/check/${datasetId}`);
}

/**
 * 批量添加团队成员
 * @param data 批量添加成员参数
 * @returns 添加的成员信息列表
 */
export function apiBatchAddTeamMembers(data: {
    datasetId: string;
    members: Array<{
        userId: string;
        role: TeamRole;
        note?: string;
    }>;
}): Promise<TeamMember[]> {
    return useConsolePost("/ai-datasets-team-members/batch", data);
}
