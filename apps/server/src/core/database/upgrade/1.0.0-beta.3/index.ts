import { Injectable } from "@nestjs/common";

/**
 * 版本 1.0.0-beta.3 升级逻辑
 */
@Injectable()
export class Upgrade {
    /**
     * 执行升级逻辑
     */
    async execute(): Promise<void> {
        // TODO: 在这里添加具体的升级逻辑
        console.log("执行 1.0.0-beta.3 版本升级逻辑");
    }
}
