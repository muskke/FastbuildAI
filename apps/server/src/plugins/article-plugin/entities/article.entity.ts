import { PluginEntity } from "@common/decorators/plugin-entity.decorator";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * 文章实体
 */
@PluginEntity({ name: "article", comment: "文章内容" })
export class Article {
    /**
     * 文章ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 文章标题
     */
    @Column()
    title: string;

    /**
     * 文章内容
     */
    @Column("text")
    content: string;

    /**
     * 文章摘要
     */
    @Column({ nullable: true })
    summary: string;

    /**
     * 文章封面图
     */
    @Column({ nullable: true })
    coverImage: string;

    /**
     * 文章作者
     */
    @Column()
    author: string;

    /**
     * 文章栏目ID
     */
    @Column({ nullable: true })
    columnId: string;

    /**
     * 文章标签，数组格式
     */
    @Column({ type: "json", nullable: true })
    tags: string[];

    /**
     * 文章状态：0-草稿，1-已发布
     */
    @Column({ default: 0 })
    status: number;

    /**
     * 阅读量
     */
    @Column({ default: 0 })
    views: number;

    /**
     * 点赞数
     */
    @Column({ default: 0 })
    likeCount: number;

    /**
     * 是否置顶：0-否，1-是
     */
    @Column({ default: 0 })
    isTop: number;

    /**
     * 排序值，值越大越靠前
     */
    @Column({ default: 0 })
    sort: number;

    /**
     * SEO关键词
     */
    @Column({ nullable: true })
    seoKeywords: string;

    /**
     * SEO描述
     */
    @Column({ nullable: true })
    seoDescription: string;

    /**
     * 发布时间
     */
    @Column({ nullable: true })
    publishedAt: Date;

    /**
     * 创建时间
     */
    @CreateDateColumn()
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn()
    updatedAt: Date;
}
