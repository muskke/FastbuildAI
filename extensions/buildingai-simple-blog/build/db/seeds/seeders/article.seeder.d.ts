import { BaseSeeder } from "@buildingai/db/seeds/seeders/base.seeder";
import { DataSource } from "@buildingai/db/typeorm";
export declare class ArticleSeeder extends BaseSeeder {
    readonly name = "ArticleSeeder";
    readonly priority = 110;
    protected getConfigPath(fileName: string): string;
    shouldRun(dataSource: DataSource): Promise<boolean>;
    run(dataSource: DataSource): Promise<void>;
}
