import { User } from "@common/modules/auth/entities/user.entity";
import { forwardRef, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { QueueModule } from "@/core/queue/queue.module";
import { AiConsoleModule } from "@/modules/console/ai/ai.module";
import { UploadModule } from "@/modules/web/upload/upload.module";

import { DatasetsController } from "./controllers/datasets.controller";
import { DocumentsController } from "./controllers/documents.controller";
import { SegmentsController } from "./controllers/segments.controller";
import { TeamMemberController } from "./controllers/team-member.controller";
import { Datasets } from "./entities/datasets.entity";
import { DatasetsDocument } from "./entities/datasets-document.entity";
import { DatasetMember } from "./entities/datasets-member.entity";
import { DatasetsSegments } from "./entities/datasets-segments.entity";
import { DatasetPermissionGuard } from "./guards/datasets-permission.guard";
import { DatasetsService } from "./services/datasets.service";
import { DatasetMemberService } from "./services/datasets-member.service";
import { DatasetsRetrievalService } from "./services/datasets-retrieval.service";
import { DocumentsService } from "./services/documents.service";
import { FileParserService } from "./services/file-parser.service";
import { IndexingService } from "./services/indexing.service";
import { SegmentsService } from "./services/segments.service";
import { VectorizationQueueService } from "./services/vectorization-queue.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Datasets,
            DatasetsDocument,
            DatasetsSegments,
            DatasetMember,
            User,
        ]),
        AiConsoleModule,
        forwardRef(() => QueueModule),
        UploadModule,
    ],
    controllers: [
        DatasetsController,
        DocumentsController,
        SegmentsController,
        TeamMemberController,
    ],
    providers: [
        DatasetsService,
        DatasetsRetrievalService,
        DocumentsService,
        SegmentsService,
        DatasetMemberService,
        FileParserService,
        IndexingService,
        VectorizationQueueService,
        DatasetPermissionGuard,
        {
            provide: APP_GUARD,
            useClass: DatasetPermissionGuard,
        },
    ],
    exports: [
        DatasetsService,
        DatasetsRetrievalService,
        DocumentsService,
        SegmentsService,
        DatasetMemberService,
        IndexingService,
        VectorizationQueueService,
        DatasetPermissionGuard,
    ],
})
export class AiDatasetsModule {}
