var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { ArticleStatus } from "../../../db/entities/article.entity";
export class UpdateArticleDto {
    title;
    summary;
    content;
    cover;
    status;
    sort;
    categoryId;
}
__decorate([
    IsString({ message: "Article title must be a string" }),
    IsOptional(),
    Length(1, 200, { message: "Article title length must be between 1 and 200 characters" }),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "title", void 0);
__decorate([
    IsString({ message: "Article summary must be a string" }),
    IsOptional(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "summary", void 0);
__decorate([
    IsString({ message: "Article content must be a string" }),
    IsOptional(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "content", void 0);
__decorate([
    IsString({ message: "Cover image URL must be a string" }),
    IsOptional(),
    Length(0, 500, { message: "Cover image URL length must not exceed 500 characters" }),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "cover", void 0);
__decorate([
    IsEnum(ArticleStatus, { message: "Article status must be a valid enum value" }),
    IsOptional(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "status", void 0);
__decorate([
    IsInt({ message: "Sort order must be an integer" }),
    Min(0, { message: "Sort order must be greater than or equal to 0" }),
    IsOptional(),
    __metadata("design:type", Number)
], UpdateArticleDto.prototype, "sort", void 0);
__decorate([
    IsUUID("4", { message: "Category ID must be a valid UUID" }),
    IsOptional(),
    __metadata("design:type", String)
], UpdateArticleDto.prototype, "categoryId", void 0);
//# sourceMappingURL=update-article.dto.js.map