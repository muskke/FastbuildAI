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
import { User } from "@buildingai/db/entities/user.entity";
import { Column, CreateDateColumn, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from "typeorm";
import { Category } from "./category.entity";
export var ArticleStatus;
(function (ArticleStatus) {
    ArticleStatus["DRAFT"] = "draft";
    ArticleStatus["PUBLISHED"] = "published";
})(ArticleStatus || (ArticleStatus = {}));
let Article = class Article {
    id;
    title;
    summary;
    content;
    cover;
    status;
    viewCount;
    sort;
    categoryId;
    publishedAt;
    createdAt;
    updatedAt;
    category;
    author;
    isPublished() {
        return this.status === ArticleStatus.PUBLISHED;
    }
    isDraft() {
        return this.status === ArticleStatus.DRAFT;
    }
    incrementViewCount(count = 1) {
        this.viewCount += count;
    }
    publish() {
        this.status = ArticleStatus.PUBLISHED;
        if (!this.publishedAt) {
            this.publishedAt = new Date();
        }
    }
    unpublish() {
        this.status = ArticleStatus.DRAFT;
    }
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Article.prototype, "id", void 0);
__decorate([
    Column({ length: 200, comment: "Article title" }),
    __metadata("design:type", String)
], Article.prototype, "title", void 0);
__decorate([
    Column({ type: "text", nullable: true, comment: "Article summary" }),
    __metadata("design:type", String)
], Article.prototype, "summary", void 0);
__decorate([
    Column({ type: "text", comment: "Article content" }),
    __metadata("design:type", String)
], Article.prototype, "content", void 0);
__decorate([
    Column({ length: 500, nullable: true, comment: "Cover image URL" }),
    __metadata("design:type", String)
], Article.prototype, "cover", void 0);
__decorate([
    Column({
        type: "varchar",
        length: 20,
        default: ArticleStatus.DRAFT,
        comment: "Article status: draft, published",
    }),
    __metadata("design:type", String)
], Article.prototype, "status", void 0);
__decorate([
    Column({ type: "int", default: 0, comment: "View count" }),
    __metadata("design:type", Number)
], Article.prototype, "viewCount", void 0);
__decorate([
    Column({ type: "int", default: 0, comment: "Sort order, larger values appear first" }),
    __metadata("design:type", Number)
], Article.prototype, "sort", void 0);
__decorate([
    Column({ type: "uuid", nullable: true, comment: "Category ID" }),
    __metadata("design:type", String)
], Article.prototype, "categoryId", void 0);
__decorate([
    Column({ type: "timestamp", nullable: true, comment: "Published time" }),
    __metadata("design:type", Date)
], Article.prototype, "publishedAt", void 0);
__decorate([
    CreateDateColumn({ comment: "Created time" }),
    __metadata("design:type", Date)
], Article.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ comment: "Updated time" }),
    __metadata("design:type", Date)
], Article.prototype, "updatedAt", void 0);
__decorate([
    ManyToOne(() => Category, (category) => category.articles),
    JoinColumn({ name: "categoryId" }),
    __metadata("design:type", Category)
], Article.prototype, "category", void 0);
__decorate([
    ManyToOne(() => User, { nullable: true }),
    JoinColumn({ name: "authorId" }),
    __metadata("design:type", User)
], Article.prototype, "author", void 0);
Article = __decorate([
    ExtensionEntity()
], Article);
export { Article };
//# sourceMappingURL=article.entity.js.map