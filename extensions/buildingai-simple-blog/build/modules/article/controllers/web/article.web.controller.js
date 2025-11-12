var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BaseController } from "@buildingai/base";
import { ExtensionWebController } from "@buildingai/core/decorators/extension-controller.decorator";
import { UUIDValidationPipe } from "@buildingai/pipe/param-validate.pipe";
import { Get, Param, Query } from "@nestjs/common";
import { QueryArticleDto } from "../../dto";
import { ArticleService } from "../../services/article.service";
let ArticleWebController = class ArticleWebController extends BaseController {
    articleService;
    constructor(articleService) {
        super();
        this.articleService = articleService;
    }
    async findAll(queryArticleDto) {
        return this.articleService.list(queryArticleDto);
    }
    async getPublished(categoryId) {
        return this.articleService.getPublishedArticles(categoryId);
    }
    async findOne(id) {
        const article = await this.articleService.findOneById(id, {
            relations: ["category", "author"],
            select: {
                author: {
                    id: true,
                    avatar: true,
                    nickname: true,
                },
            },
        });
        if (article) {
            await this.articleService.incrementViewCount(id);
        }
        return article;
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryArticleDto]),
    __metadata("design:returntype", Promise)
], ArticleWebController.prototype, "findAll", null);
__decorate([
    Get("published"),
    __param(0, Query("categoryId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleWebController.prototype, "getPublished", null);
__decorate([
    Get(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleWebController.prototype, "findOne", null);
ArticleWebController = __decorate([
    ExtensionWebController("article"),
    __metadata("design:paramtypes", [ArticleService])
], ArticleWebController);
export { ArticleWebController };
//# sourceMappingURL=article.web.controller.js.map