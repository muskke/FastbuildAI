import { PluginEntity } from "@common/decorators/plugin-entity.decorator";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * 栏目实体
 */
@PluginEntity({ name: "article_column", comment: "文章栏目" })
export class ArticleColumn {
    /**
     * 栏目ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 栏目名称
     */
    @Column()
    name: string;

    /**
     * 栏目别名/标识
     */
    @Column({ nullable: true })
    slug: string;

    /**
     * 栏目描述
     */
    @Column({ nullable: true })
    description: string;

    /**
     * 父级栏目ID
     */
    @Column({ nullable: true })
    parentId: string;

    /**
     * 栏目图标
     */
    @Column({ nullable: true })
    icon: string;

    /**
     * 栏目封面图
     */
    @Column({ nullable: true })
    coverImage: string;

    /**
     * 栏目状态：0-禁用，1-启用
     */
    @Column({ default: 1 })
    status: number;

    /**
     * 排序权重
     */
    @Column({ default: 0 })
    sort: number;

    /**
     * 是否显示在导航：0-否，1-是
     */
    @Column({ default: 1 })
    showInNav: number;

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
     * 栏目层级
     */
    @Column({ default: 1 })
    level: number;

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
