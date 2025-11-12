import { ArticleSeeder } from "./seeders/article.seeder";
import { CategorySeeder } from "./seeders/category.seeder";
export async function getSeeders() {
    return [new CategorySeeder(), new ArticleSeeder()];
}
//# sourceMappingURL=index.js.map