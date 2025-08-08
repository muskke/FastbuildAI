import { PartialType } from "@nestjs/mapped-types";

import { CreateMicropageDto } from "./create-micropage.dto";

/**
 *
 * 继承自分页DTO，自动包含分页参数
 */
export class UpdateMicropageDto extends PartialType(CreateMicropageDto) {}
