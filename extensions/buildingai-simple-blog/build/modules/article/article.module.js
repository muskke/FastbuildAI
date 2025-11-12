var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { User } from "@buildingai/db/entities/user.entity";
import { PublicUserService } from "@buildingai/extension-sdk/services/user.service";
import { Module } from "@nestjs/common";
import { Article } from "../../db/entities/article.entity";
import { CategoryModule } from "../category/category.module";
import { ArticleController } from "./controllers/console/article.controller";
import { ArticleWebController } from "./controllers/web/article.web.controller";
import { ArticleService } from "./services/article.service";
let ArticleModule = class ArticleModule {
};
ArticleModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Article, User]), CategoryModule],
        controllers: [ArticleController, ArticleWebController],
        providers: [ArticleService, PublicUserService],
        exports: [ArticleService],
    })
], ArticleModule);
export { ArticleModule };
//# sourceMappingURL=article.module.js.map