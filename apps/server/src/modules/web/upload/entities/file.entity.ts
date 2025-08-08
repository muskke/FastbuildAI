import { AppEntity } from "@common/decorators/app-entity.decorator";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * 文件类型枚举
 */
export enum FileType {
    /**
     * 图片
     */
    IMAGE = "image",

    /**
     * 文档
     */
    DOCUMENT = "document",

    /**
     * 视频
     */
    VIDEO = "video",

    /**
     * 音频
     */
    AUDIO = "audio",

    /**
     * 压缩包
     */
    ARCHIVE = "archive",

    /**
     * 其他
     */
    OTHER = "other",
}

/**
 * 文件实体
 *
 * 用于记录上传的文件信息
 */
@AppEntity({ name: "file", comment: "文件上传记录" })
export class File {
    /**
     * 文件ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 原始文件名
     */
    @Column()
    originalName: string;

    /**
     * 存储文件名
     *
     * 重命名后的文件名，用于在磁盘上存储
     */
    @Column()
    storageName: string;

    /**
     * 文件类型
     */
    @Column({
        type: "enum",
        enum: FileType,
        default: FileType.OTHER,
    })
    type: FileType;

    /**
     * 文件MIME类型
     */
    @Column()
    mimeType: string;

    /**
     * 文件大小（字节）
     */
    @Column()
    size: number;

    /**
     * 文件扩展名
     */
    @Column({ nullable: true })
    extension: string;

    /**
     * 文件存储路径
     *
     * 相对于存储根目录的路径
     */
    @Column()
    path: string;

    /**
     * 文件URL
     *
     * 可访问的完整URL
     */
    @Column({ nullable: true })
    url: string;

    /**
     * 文件描述
     */
    @Column({ nullable: true })
    description: string;

    /**
     * 上传者ID
     */
    @Column({ nullable: true })
    uploaderId: string;

    /**
     * 上传者
     */
    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "uploaderId" })
    uploader: User;

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
