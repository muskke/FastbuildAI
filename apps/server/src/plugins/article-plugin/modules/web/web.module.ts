import { Module } from "@nestjs/common";

import { ArticleModule } from "./article/article.module";
import { ColumnModule } from "./column/column.module";

@Module({
    imports: [ArticleModule, ColumnModule],
    exports: [ArticleModule, ColumnModule],
})
export class PluginsWebModule {}
