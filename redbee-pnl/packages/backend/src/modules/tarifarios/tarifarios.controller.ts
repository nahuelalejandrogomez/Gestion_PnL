import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TarifariosService } from './tarifarios.service';
import { CreateTarifarioDto } from './dto/create-tarifario.dto';
import { UpdateTarifarioDto } from './dto/update-tarifario.dto';

@Controller('tarifarios')
export class TarifariosController {
  constructor(private readonly tarifariosService: TarifariosService) {}

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clienteId') clienteId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.tarifariosService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      clienteId,
      estado,
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

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarifarioDto) {
    return this.tarifariosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tarifariosService.remove(id);
  }
}
