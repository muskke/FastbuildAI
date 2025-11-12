var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, IsOptional, IsString, Length, Min } from "class-validator";
export class CreateCategoryDto {
    name;
    description;
    sort;
}
__decorate([
    IsString({ message: "Category name must be a string" }),
    Length(1, 100, { message: "Category name length must be between 1 and 100 characters" }),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    IsString({ message: "Category description must be a string" }),
    IsOptional(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "description", void 0);
__decorate([
    IsInt({ message: "Sort order must be an integer" }),
    Min(0, { message: "Sort order must be greater than or equal to 0" }),
    IsOptional(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "sort", void 0);
//# sourceMappingURL=create-category.dto.js.map