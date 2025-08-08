import { PaginationDto } from "@common/dto/pagination.dto";
import { IsOptional } from "class-validator";

export class AccountLogDto extends PaginationDto {
    @IsOptional()
    action: string;
}
