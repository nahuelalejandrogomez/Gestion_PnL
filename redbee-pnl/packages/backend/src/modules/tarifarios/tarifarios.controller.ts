import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TarifariosService } from './tarifarios.service';
import { CreateTarifarioDto } from './dto/create-tarifario.dto';
import { UpdateTarifarioDto } from './dto/update-tarifario.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { UpdateLineaTarifarioDto } from './dto/update-linea-tarifario.dto';

@Controller('tarifarios')
export class TarifariosController {
  constructor(private readonly tarifariosService: TarifariosService) {}

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clienteId') clienteId?: string,
    @Query('estado') estado?: string,
    @Query('esTemplate') esTemplate?: string,
  ) {
    return this.tarifariosService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      clienteId,
      estado,
      esTemplate: esTemplate === 'true' ? true : esTemplate === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tarifariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTarifarioDto) {
    return this.tarifariosService.create(dto);
  }

  @Post('from-template')
  createFromTemplate(@Body() dto: CreateFromTemplateDto) {
    return this.tarifariosService.createFromTemplate(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarifarioDto) {
    return this.tarifariosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tarifariosService.remove(id);
  }

  @Put('lineas/:lineaId')
  updateLinea(@Param('lineaId') lineaId: string, @Body() dto: UpdateLineaTarifarioDto) {
    return this.tarifariosService.updateLinea(lineaId, dto);
  }

  @Delete('lineas/:lineaId')
  deleteLinea(@Param('lineaId') lineaId: string) {
    return this.tarifariosService.deleteLinea(lineaId);
  }
}
