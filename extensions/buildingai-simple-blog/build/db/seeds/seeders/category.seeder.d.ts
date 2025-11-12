import { BaseSeeder } from "@buildingai/db/seeds/seeders/base.seeder";
import { DataSource } from "@buildingai/db/typeorm";
export declare class CategorySeeder extends BaseSeeder {
    readonly name = "CategorySeeder";
    readonly priority = 100;
    protected getConfigPath(fileName: string): string;
    shouldRun(dataSource: DataSource): Promise<boolean>;
    run(dataSource: DataSource): Promise<void>;
}
