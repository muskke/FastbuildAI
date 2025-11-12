var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ExtensionEntity } from "@buildingai/core/decorators/extension-entity.decorator";
import { Column, CreateDateColumn, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from "typeorm";
import { Article } from "./article.entity";
let Category = class Category {
    id;
    name;
    description;
    sort;
    articleCount;
    createdAt;
    updatedAt;
    articles;
    incrementArticleCount(count = 1) {
        this.articleCount += count;
    }
    decrementArticleCount(count = 1) {
        this.articleCount = Math.max(0, this.articleCount - count);
    }
    hasArticles() {
        return this.articleCount > 0;
    }
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    Column({ length: 100, comment: "Category name" }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    Column({ type: "text", nullable: true, comment: "Category description" }),
    __metadata("design:type", String)
], Category.prototype, "description", void 0);
__decorate([
    Column({ type: "int", default: 0, comment: "Sort order, larger values appear first" }),
    __metadata("design:type", Number)
], Category.prototype, "sort", void 0);
__decorate([
    Column({ type: "int", default: 0, comment: "Number of articles in this category" }),
    __metadata("design:type", Number)
], Category.prototype, "articleCount", void 0);
__decorate([
    CreateDateColumn({ comment: "Created time" }),
    __metadata("design:type", Date)
], Category.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ comment: "Updated time" }),
    __metadata("design:type", Date)
], Category.prototype, "updatedAt", void 0);
__decorate([
    OneToMany(() => Article, (article) => article.category),
    __metadata("design:type", Array)
], Category.prototype, "articles", void 0);
Category = __decorate([
    ExtensionEntity()
], Category);
export { Category };
//# sourceMappingURL=category.entity.js.map