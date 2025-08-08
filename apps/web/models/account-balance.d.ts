/**
 * 账户余额
 */
export interface AccountBalance {
    accountTypeLists: AccountType;
    items: AccountBalanceListItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/**
 * 变动类型
 */
export interface AccountType {
    "100": string;
    "101": string;
    "102": string;
}

/**
 * 账户余额列表项
 */
export interface AccountBalanceListItem {
    accountNo?: string;
    accountType?: number;
    /**
     * 变动类型描述
     */
    accountTypeDesc?: string;
    /**
     * 动作：1-增加；0-减少
     */
    action?: number;
    /**
     * 操作管理员
     */
    associationUser: string;
    associationUserId?: string;
    /**
     * 变动数量
     */
    changeAmount?: number;
    /**
     * 变动时间
     */
    createdAt?: string;
    /**
     * 记录id
     */
    id?: string;
    /**
     * 剩余数量
     */
    leftAmount?: number;
    /**
     * 变动编号
     */
    no?: string;
    /**
     * 变动的用户信息
     */
    user?: User;
}

/**
 * 变动的用户信息
 */
export interface User {
    /**
     * 头像
     */
    avatar: string;
    /**
     * 用户昵称
     */
    username: string;
    /**
     * 用户编号
     */
    userNo: string;
}
