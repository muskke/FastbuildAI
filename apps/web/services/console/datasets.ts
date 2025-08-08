import type {
    Dataset,
    DatasetDocument,
    DatasetSegment,
    QueryDatasetParams,
    QueryDocumentParams,
    QuerySegmentParams,
} from "@/models/datasets";
import type { PaginationResult } from "@/models/global";

// ==================== 知识库相关 API ====================

/**
 * 获取知识库列表
 * @description 分页获取知识库列表
 * @param {QueryDatasetParams} params 查询参数
 * @returns {Promise<PaginationResult<Dataset[]>>} 知识库列表分页结果
 */
export function apiGetDatasetList(
    params?: QueryDatasetParams,
): Promise<PaginationResult<Dataset[]>> {
    return useConsoleGet("/datasets", params);
}

/**
 * 获取知识库详情
 * @description 根据知识库ID获取知识库详细信息
 * @param {string} id 知识库ID
 * @returns {Promise<Dataset>} 知识库详情
 */
export function apiGetDatasetDetail(id: string): Promise<Dataset> {
    return useConsoleGet(`/datasets/${id}`);
}

/**
 * 删除知识库
 * @description 删除指定的知识库及其所有数据
 * @param {string} id 知识库ID
 * @returns {Promise<{ success: boolean; message: string }>} 删除结果
 */
export function apiDeleteDataset(id: string): Promise<{ success: boolean; message: string }> {
    return useConsoleDelete(`/datasets/${id}`);
}

/**
 * 转移知识库所有权
 * @description 将知识库所有权转移给其他用户
 * @param {Object} params 转移参数
 * @param {string} params.datasetId 知识库ID
 * @param {string} params.newOwnerId 新所有者用户ID
 * @returns {Promise<{ success: boolean; message: string }>} 转移结果
 */
export function apiTransferOwnership(params: {
    datasetId: string;
    newOwnerId: string;
}): Promise<{ success: boolean; message: string }> {
    return useConsolePatch("/datasets/transfer-ownership", params);
}

// ==================== 文档相关 API ====================

/**
 * 获取知识库文档列表
 * @description 分页获取指定知识库的文档列表
 * @param {string} datasetId 知识库ID
 * @param {QueryDocumentParams} params 查询参数
 * @returns {Promise<PaginationResult<DatasetDocument[]>>} 文档列表分页结果
 */
export function apiGetDocumentList(
    datasetId: string,
    params?: QueryDocumentParams,
): Promise<PaginationResult<DatasetDocument[]>> {
    return useConsoleGet(`/datasets/${datasetId}/documents`, params);
}

/**
 * 获取文档详情
 * @description 根据文档ID获取文档详细信息
 * @param {string} documentId 文档ID
 * @returns {Promise<DatasetDocument>} 文档详情
 */
export function apiGetDocumentDetail(documentId: string): Promise<DatasetDocument> {
    return useConsoleGet(`/datasets/documents/${documentId}`);
}

/**
 * 删除文档
 * @description 删除指定的知识库文档
 * @param {string} documentId 文档ID
 * @returns {Promise<{ success: boolean; message: string }>} 删除结果
 */
export function apiDeleteDocument(
    documentId: string,
): Promise<{ success: boolean; message: string }> {
    return useConsoleDelete(`/datasets/documents/${documentId}`);
}

// ==================== 分段相关 API ====================

/**
 * 获取文档分段列表
 * @description 分页获取指定文档的分段列表
 * @param {string} documentId 文档ID
 * @param {QuerySegmentParams} params 查询参数
 * @returns {Promise<PaginationResult<DatasetSegment[]>>} 分段列表分页结果
 */
export function apiGetSegmentList(
    documentId: string,
    params?: QuerySegmentParams,
): Promise<PaginationResult<DatasetSegment[]>> {
    return useConsoleGet(`/datasets/documents/${documentId}/segments`, params);
}

/**
 * 获取分段详情
 * @description 根据分段ID获取分段详细信息
 * @param {string} segmentId 分段ID
 * @returns {Promise<DatasetSegment>} 分段详情
 */
export function apiGetSegmentDetail(segmentId: string): Promise<DatasetSegment> {
    return useConsoleGet(`/datasets/documents/segments/${segmentId}`);
}

/**
 * 删除分段
 * @description 删除指定的知识库分段
 * @param {string} segmentId 分段ID
 * @returns {Promise<{ success: boolean; message: string }>} 删除结果
 */
export function apiDeleteSegment(
    segmentId: string,
): Promise<{ success: boolean; message: string }> {
    return useConsoleDelete(`/datasets/documents/segments/${segmentId}`);
}

/**
 * 批量删除分段
 * @description 批量删除指定的知识库分段
 * @param {string[]} ids 分段ID列表
 * @returns {Promise<{ success: boolean; message: string }>} 删除结果
 */
export function apiBatchDeleteSegments(
    ids: string[],
): Promise<{ success: boolean; message: string }> {
    return useConsoleDelete("/datasets/documents/segments", { ids });
}

/**
 * 设置单个分段的启用/禁用状态
 * @param {string} id 分段ID
 * @param {number} enabled 1-启用，0-禁用
 * @returns {Promise<{ success: boolean }>} 操作结果
 */
export function apiSetSegmentEnabled(id: string, enabled: number): Promise<{ success: boolean }> {
    return useConsolePatch(`/datasets/documents/segments/${id}/enabled`, { enabled });
}

/**
 * 批量设置分段的启用/禁用状态
 * @param {string[]} ids 分段ID数组
 * @param {number} enabled 1-启用，0-禁用
 * @returns {Promise<{ success: boolean }>} 操作结果
 */
export function apiBatchSetSegmentEnabled(
    ids: string[],
    enabled: number,
): Promise<{ success: boolean }> {
    return useConsolePost(`/datasets/documents/segments/batch-enabled`, { ids, enabled });
}

// ==================== 数据记录相关 API ====================

/**
 * 获取全部数据记录列表
 * @description 查看系统中所有知识库的数据记录
 * @param {QuerySegmentParams} params 查询参数
 * @returns {Promise<PaginationResult<DatasetDocument[]>>} 数据记录列表分页结果
 */
export function apiGetAllDataRecords(
    params?: QuerySegmentParams,
): Promise<PaginationResult<DatasetDocument[]>> {
    return useConsoleGet("/datasets/data-records/all", params);
}
