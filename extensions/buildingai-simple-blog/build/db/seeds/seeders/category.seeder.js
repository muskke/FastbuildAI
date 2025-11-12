import { BaseSeeder } from "@buildingai/db/seeds/seeders/base.seeder";
import * as path from "path";
import { Category } from "../../entities/category.entity";
export class CategorySeeder extends BaseSeeder {
    name = "CategorySeeder";
    priority = 100;
    getConfigPath(fileName) {
        return path.join(__dirname, "../data", fileName);
    }
    async shouldRun(dataSource) {
        const repository = dataSource.getRepository(Category);
        const count = await repository.count();
        return count === 0;
    }
    async run(dataSource) {
        const repository = dataSource.getRepository(Category);
        const categories = await this.loadConfig("blog-categories.json");
        this.logInfo(`Preparing to insert ${categories.length} blog categories`);
        for (const categoryData of categories) {
            const category = repository.create({
                name: categoryData.name,
                description: categoryData.description ?? undefined,
                sort: categoryData.sort ?? 0,
                articleCount: categoryData.articleCount ?? 0,
            });
            await repository.save(category);
            this.logInfo(`Inserted category: ${category.name}`);
        }
        this.logSuccess(`Successfully inserted ${categories.length} blog categories`);
    }
}
//# sourceMappingURL=category.seeder.js.map