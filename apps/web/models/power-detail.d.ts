/**
 * 算力明细返回数据
 */
export interface PowerDetailData {
    items: PowerDetaiItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    userInfo: UserInfo;
}

export interface PowerDetaiItem {
    accountNo: string;
    accountType: number;
    /**
     * 变动说明
     */
    accountTypeDesc: string;
    /**
     * 变动类型：1-增加；0-减少
     */
    action: number;
    associationNo: string;
    associationUserId: null;
    /**
     * 变动数量
     */
    changeAmount: number;
    /**
     * 智能体/应用消耗说明
     */
    consumeSourceDesc: string;
    createdAt: string;
    id: string;
    leftAmount: number;
    remark: string;
    updatedAt: string;
    userId: string;
}

export interface UserInfo {
    /**
     * 剩余算力；赠送算力写死0
     */
    power: number;
}

/**
 * 算力明细查询参数
 */
export interface PowerDetailQueryParams {
    page?: number;
    pageSize?: number;
    action?: string;
}
