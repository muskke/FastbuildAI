import { ExtensionEntity } from "@buildingai/core/decorators/extension-entity.decorator";
import { Column, PrimaryGeneratedColumn } from "typeorm";

@ExtensionEntity()
export class Example {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;
}
