import { BooleanNumberType, UserTerminalType } from "@common/constants/status-codes.constant";

import { Role } from "../modules/auth/entities/role.entity";

export interface LoginUserPlayground {
    id: string;
    username: string;
    isRoot: BooleanNumberType;
    iat?: number;
    exp?: number;
    terminal?: UserTerminalType;
}

export interface UserPlayground extends LoginUserPlayground {
    permissions: string[];
    role: Role;
}
