import { Column, PrimaryGeneratedColumn } from "typeorm";

// @PluginEntity("example")
export class Example {
    /**
     * ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 名称
     */
    @Column()
    name: string;
}
