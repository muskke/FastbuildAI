import { PartialType } from "@nestjs/mapped-types";

import { CreateArticleDto } from "./create-article.dto";

/**
 * 更新文章DTO
 */
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
