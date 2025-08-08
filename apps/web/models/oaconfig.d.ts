export interface WxOaConfig {
    appId: string;
    appSecret: string;
    url: string;
    token: string;
    encodingAESKey: string;
    messageEncryptType: string;
    domain: string;
    jsApiDomain: string;
    webAuthDomain: string;
}
export interface UpdateWxOaConfigDto {
    appId: string;
    appSecret: string;
    token: string;
    encodingAESKey: string;
    messageEncryptType: string;
}
