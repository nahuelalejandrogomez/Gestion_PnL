import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RecursosService } from './recursos.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { QueryRecursoDto } from './dto/query-recurso.dto';

@Controller('recursos')
export class RecursosController {
  constructor(private readonly recursosService: RecursosService) {}

  @Get()
  findAll(@Query() query: QueryRecursoDto) {
    return this.recursosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recursosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRecursoDto) {
    return this.recursosService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecursoDto) {
    return this.recursosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recursosService.remove(id);
  }
}
