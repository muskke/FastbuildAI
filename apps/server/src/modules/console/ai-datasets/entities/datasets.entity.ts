import { AppEntity } from "@common/decorators";
import {
    Column,
    CreateDateColumn,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import {
    type DocumentModeType,
    type ParentContextModeType,
    RETRIEVAL_MODE,
    type RetrievalModeType,
} from "../constants/datasets.constants";
import {
    SegmentationDto,
    SubSegmentationDto,
    TextPreprocessingRulesDto,
} from "../dto/indexing-segments.dto";
import { RetrievalConfig } from "../interfaces/retrieval-config.interface";
import { DatasetsDocument } from "./datasets-document.entity";
import { DatasetMember } from "./datasets-member.entity";
import { DatasetsSegments } from "./datasets-segments.entity";

/**
 * 知识库实体
 */
@AppEntity({ name: "datasets", comment: "知识库管理" })
export class Datasets {
    /**
     * 知识库主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 知识库名称
     */
    @Column({ length: 255, comment: "知识库名称" })
    name: string;

    /**
     * 知识库描述
     */
    @Column({ type: "text", nullable: true, comment: "知识库描述" })
    description?: string;

    /**
     * 分段配置
     */
    @Column({ type: "json", comment: "分段配置" })
    indexingConfig: {
        documentMode: DocumentModeType;
        parentContextMode?: ParentContextModeType;
        segmentation: SegmentationDto;
        subSegmentation?: SubSegmentationDto;
        preprocessingRules: TextPreprocessingRulesDto;
        fileIds: string[];
    };

    /**
     * Embedding 模型ID
     */
    @Column({ type: "uuid", comment: "Embedding模型ID", nullable: true })
    embeddingModelId?: string;

    /**
     * 检索模式
     */
    @Column({
        type: "enum",
        enum: Object.values(RETRIEVAL_MODE),
        default: RETRIEVAL_MODE.VECTOR,
        comment: "检索模式",
    })
    retrievalMode: RetrievalModeType;

    /**
     * 检索配置 JSON
     */
    @Column({ type: "json", comment: "检索配置" })
    retrievalConfig: RetrievalConfig;

    /**
     * 创建者ID
     */
    @Column({ type: "uuid", comment: "创建者ID" })
    createdBy: string;

    /**
     * 文档数量
     */
    @Column({ type: "int", default: 0, comment: "文档数量" })
    documentCount: number;

    /**
     * 总分段数量
     */
    @Column({ type: "int", default: 0, comment: "总分段数量" })
    chunkCount: number;

    /**
     * 存储空间大小（字节）
     */
    @Column({ type: "bigint", default: 0, comment: "存储空间大小（字节）" })
    storageSize: number;

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

    /**
     * 知识库下的文档列表
     */
    @OneToMany(() => DatasetsDocument, (document) => document.dataset)
    documents?: Relation<DatasetsDocument[]>;

    /**
     * 知识库下的分段列表
     */
    @OneToMany(() => DatasetsSegments, (segment) => segment.dataset)
    segments?: Relation<DatasetsSegments[]>;

    /**
     * 知识库团队成员列表
     */
    @OneToMany(() => DatasetMember, (member) => member.dataset)
    members?: Relation<DatasetMember[]>;

    /**
     * 关联应用（智能体）数量
     * 非持久化字段，仅用于接口返回展示
     */
    relatedAgentCount?: number;
}
