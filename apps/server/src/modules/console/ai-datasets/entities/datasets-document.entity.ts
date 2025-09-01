import { AppEntity } from "@common/decorators";
import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { PROCESSING_STATUS, type statusType } from "../constants/datasets.constants";
import { Datasets } from "../entities/datasets.entity";
import { DatasetsSegments } from "./datasets-segments.entity";

/**
 * 文档实体
 */
@AppEntity({ name: "datasets_documents", comment: "知识库文档" })
export class DatasetsDocument {
    /**
     * 文档主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 知识库ID
     */
    @Column({ type: "uuid", comment: "知识库ID" })
    datasetId: string;

    /**
     * 上传文件ID
     */
    @Column({ type: "uuid", comment: "上传文件ID" })
    fileId: string;

    /**
     * 文件名
     */
    @Column({ length: 255, comment: "文件名" })
    fileName: string;

    /**
     * 文件类型
     */
    @Column({ length: 100, comment: "文件类型" })
    fileType: string;

    /**
     * 文件大小（字节）
     */
    @Column({ type: "bigint", comment: "文件大小" })
    fileSize: number;

    /**
     * 分段数量
     */
    @Column({ type: "int", default: 0, comment: "分段数量" })
    chunkCount: number;

    /**
     * 字符数量（所有分段的字符总数）
     */
    @Column({ type: "bigint", default: 0, comment: "字符数量" })
    characterCount: number;

    /**
     * 文档状态
     */
    @Column({ type: "varchar", length: 20, default: "pending", comment: "文档状态" })
    status: string;

    /**
     * 文档进度
     */
    @Column({ type: "int", default: 0, comment: "文档进度(0-100)" })
    progress: number;

    /**
     * 向量化错误信息
     */
    @Column({ type: "text", nullable: true, comment: "向量化错误信息" })
    error: string | null;

    /**
     * Embedding 模型ID
     */
    @Column({ type: "uuid", nullable: true, comment: "Embedding模型ID" })
    embeddingModelId?: string;

    /**
     * 是否启用
     */
    @Column({ type: "boolean", default: true, comment: "是否启用" })
    enabled: boolean;

    /**
     * 创建者ID
     */
    @Column({ type: "uuid", comment: "创建者ID", name: "created_by" })
    createdBy: string;

    /**
     * 创建时间
     */
    @CreateDateColumn({ comment: "创建时间" })
    createdAt: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ comment: "更新时间" })
    updatedAt: Date;

    // 关联关系

    /**
     * 关联的知识库
     */
    @ManyToOne(() => Datasets, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "dataset_id" })
    dataset?: Awaited<Datasets>;

    /**
     * 文档下的分段列表
     */
    @OneToMany(() => DatasetsSegments, (segment) => segment.document)
    segments?: Awaited<DatasetsSegments[]>;
}
