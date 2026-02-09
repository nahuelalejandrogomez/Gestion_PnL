import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RecursosService } from './recursos.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { QueryRecursoDto } from './dto/query-recurso.dto';
import { UpsertRecursoCostosDto } from './dto/recurso-costo-mes.dto';

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

  // =====================
  // SALARY OVERRIDES
  // =====================

  /**
   * PUT /recursos/:id/costos?year=YYYY
   * Upsert salary overrides for a recurso in a given year
   */
  @Put(':id/costos')
  upsertCostos(
    @Param('id') id: string,
    @Query('year') year: string,
    @Body() dto: UpsertRecursoCostosDto,
  ) {
    return this.recursosService.upsertCostos(id, Number(year), dto);
  }

  /**
   * DELETE /recursos/:id/costos/:year/:month
   * Delete a specific salary override
   */
  @Delete(':id/costos/:year/:month')
  deleteCosto(
    @Param('id') id: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.recursosService.deleteCosto(id, Number(year), Number(month));
  }
}
