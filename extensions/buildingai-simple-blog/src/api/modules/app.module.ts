import { Module } from "@nestjs/common";

import { ArticleModule } from "./article/article.module";
import { CategoryModule } from "./category/category.module";
import { ExampleModule } from "./example/example.module";

@Module({
    imports: [ExampleModule, CategoryModule, ArticleModule],
    exports: [ExampleModule, CategoryModule, ArticleModule],
})
export class AppModule {}
