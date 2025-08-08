import { PluginWebController } from "@common/decorators";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateExampleDto } from "./dto/create-example.dto";
import { UpdateExampleDto } from "./dto/update-example.dto";
import { ExampleService } from "./example.service";

@PluginWebController("example-template")
export class ExampleController {
    constructor(private readonly exampleService: ExampleService) {}

    @Post()
    create(@Body() createExampleDto: CreateExampleDto) {
        return this.exampleService.create(createExampleDto);
    }

    @Get()
    findAll() {
        return this.exampleService.findAll();
    }

    @Get(":id")
    findOne(@Param("id", UUIDValidationPipe) id: string) {
        return this.exampleService.findOne(+id);
    }

    @Patch(":id")
    update(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() updateExampleDto: UpdateExampleDto,
    ) {
        return this.exampleService.update(+id, updateExampleDto);
    }

    @Delete(":id")
    remove(@Param("id", UUIDValidationPipe) id: string) {
        return this.exampleService.remove(+id);
    }
}
