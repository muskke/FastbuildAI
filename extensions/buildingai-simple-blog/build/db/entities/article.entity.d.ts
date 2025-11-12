import { User } from "@buildingai/db/entities/user.entity";
import { Category } from "./category.entity";
export declare enum ArticleStatus {
    DRAFT = "draft",
    PUBLISHED = "published"
}
export declare class Article {
    id: string;
    title: string;
    summary?: string;
    content: string;
    cover?: string;
    status: ArticleStatus;
    viewCount: number;
    sort: number;
    categoryId?: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    category?: Category;
    author?: User;
    isPublished(): boolean;
    isDraft(): boolean;
    incrementViewCount(count?: number): void;
    publish(): void;
    unpublish(): void;
}
