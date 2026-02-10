import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { QueryPerfilDto } from './dto/query-perfil.dto';

@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get()
  findAll(@Query() query: QueryPerfilDto) {
    return this.perfilesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePerfilDto) {
    return this.perfilesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePerfilDto) {
    return this.perfilesService.update(id, dto);
  }
}
