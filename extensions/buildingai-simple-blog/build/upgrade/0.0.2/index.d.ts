import { DataSource } from "@buildingai/db/typeorm";
export declare class Upgrade {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    execute(): Promise<void>;
    private queryUserData;
}
