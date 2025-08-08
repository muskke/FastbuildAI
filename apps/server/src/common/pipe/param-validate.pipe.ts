import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { validate as isUUID } from "uuid";

/**
 * UUID验证管道
 */
@Injectable()
export class UUIDValidationPipe implements PipeTransform {
    transform(value: any) {
        if (!isUUID(value)) {
            throw new BadRequestException("Invalid UUID format");
        }
        return value;
    }
}
