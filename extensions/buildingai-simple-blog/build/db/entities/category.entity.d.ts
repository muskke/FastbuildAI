import { Article } from "./article.entity";
export declare class Category {
    id: string;
    name: string;
    description?: string;
    sort: number;
    articleCount: number;
    createdAt: Date;
    updatedAt: Date;
    articles?: Article[];
    incrementArticleCount(count?: number): void;
    decrementArticleCount(count?: number): void;
    hasArticles(): boolean;
}
