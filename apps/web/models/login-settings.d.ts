export enum LoginMethod {
    ACCOUNT = 1,
    PHONE = 2,
    WEIXIN = 3,
}

export interface LoginSettings {
    allowedLoginMethods: LoginMethod[];
    allowedRegisterMethods: LoginMethod[];
    defaultLoginMethod: LoginMethod;
    allowMultipleLogin: boolean;
    showPolicyAgreement: boolean;
}
