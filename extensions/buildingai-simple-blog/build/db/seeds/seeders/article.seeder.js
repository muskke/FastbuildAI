import { User } from "@buildingai/db/entities/user.entity";
import { BaseSeeder } from "@buildingai/db/seeds/seeders/base.seeder";
import * as path from "path";
import { Article, ArticleStatus } from "../../entities/article.entity";
import { Category } from "../../entities/category.entity";
export class ArticleSeeder extends BaseSeeder {
    name = "ArticleSeeder";
    priority = 110;
    getConfigPath(fileName) {
        return path.join(__dirname, "../data", fileName);
    }
    async shouldRun(dataSource) {
        const repository = dataSource.getRepository(Article);
        const count = await repository.count();
        return count === 0;
    }
    async run(dataSource) {
        const articleRepository = dataSource.getRepository(Article);
        const categoryRepository = dataSource.getRepository(Category);
        const userRepository = dataSource.getRepository(User);
        const users = await userRepository.find({
            order: { createdAt: "ASC" },
            take: 1,
        });
        const firstUser = users[0];
        if (!firstUser) {
            this.logWarn("No user found, articles will be created without author (anonymous)");
        }
        const articles = await this.loadConfig("blog-articles.json");
        this.logInfo(`Preparing to insert ${articles.length} blog articles`);
        const categories = await categoryRepository.find();
        const categoryMap = new Map(categories.map((cat) => [cat.name, cat]));
        for (const articleData of articles) {
            let categoryId;
            if (articleData.categoryName) {
                const category = categoryMap.get(articleData.categoryName);
                if (category) {
                    categoryId = category.id;
                }
                else {
                    this.logWarn(`Category "${articleData.categoryName}" not found for article "${articleData.title}"`);
                }
            }
            const status = articleData.status === "published" ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
            const publishedAt = status === ArticleStatus.PUBLISHED ? new Date() : undefined;
            const article = articleRepository.create({
                title: articleData.title,
                summary: articleData.summary ?? undefined,
                content: articleData.content,
                cover: articleData.cover ?? undefined,
                status,
                categoryId,
                sort: articleData.sort ?? 0,
                viewCount: articleData.viewCount ?? 0,
                publishedAt,
                author: firstUser ?? undefined,
            });
            await articleRepository.save(article);
            this.logInfo(`Inserted article: ${article.title}`);
        }
        this.logSuccess(`Successfully inserted ${articles.length} blog articles`);
    }
}
//# sourceMappingURL=article.seeder.js.map