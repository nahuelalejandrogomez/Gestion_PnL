import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AsignacionesService } from './asignaciones.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';
import { UpdateAsignacionDto } from './dto/update-asignacion.dto';
import { QueryAsignacionDto } from './dto/query-asignacion.dto';
import { UpsertMesBatchDto } from './dto/planner-mes.dto';

@Controller('asignaciones')
export class AsignacionesController {
  constructor(private readonly asignacionesService: AsignacionesService) {}

  @Get()
  findAll(@Query() query: QueryAsignacionDto) {
    return this.asignacionesService.findAll(query);
  }

  // Planner endpoints MUST be before :id to avoid route conflicts
  @Get('proyecto/:proyectoId/planner')
  findPlanner(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year: string,
  ) {
    return this.asignacionesService.findPlannerByProyecto(
      proyectoId,
      year ? Number(year) : new Date().getFullYear(),
    );
  }

  @Put('proyecto/:proyectoId/planner')
  upsertPlanner(@Body() dto: UpsertMesBatchDto) {
    return this.asignacionesService.upsertMesBatch(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asignacionesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAsignacionDto) {
    return this.asignacionesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAsignacionDto) {
    return this.asignacionesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.asignacionesService.remove(id);
  }
}
