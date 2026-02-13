import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { RecursosService } from '../recursos/recursos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectoDto } from './dto/query-proyecto.dto';
import { UpsertCostosManualesDto } from './dto/costos-manuales.dto';

@Controller('proyectos')
export class ProyectosController {
  private readonly logger = new Logger(ProyectosController.name);

  constructor(
    private readonly proyectosService: ProyectosService,
    private readonly recursosService: RecursosService,
  ) {}

  @Get()
  findAll(@Query() query: QueryProyectoDto) {
    return this.proyectosService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`[findOne] Fetching proyecto with ID: ${id}`);
      const result = await this.proyectosService.findOne(id);
      this.logger.log(`[findOne] Successfully fetched proyecto: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[findOne] Error fetching proyecto ID ${id}: ${error.message}`,
        error.stack,
      );
      this.logger.error(`[findOne] Error details: ${JSON.stringify({
        proyectoId: id,
        errorName: error.name,
        errorCode: error.code,
        prismaCode: error?.code,
        meta: error?.meta,
      })}`);
      throw error;
    }
  }

  @Post()
  async create(@Body() createProyectoDto: CreateProyectoDto) {
    this.logger.log(`Creating proyecto: ${JSON.stringify(createProyectoDto)}`);
    try {
      return await this.proyectosService.create(createProyectoDto);
    } catch (error) {
      this.logger.error(`Error creating proyecto: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProyectoDto: UpdateProyectoDto) {
    try {
      this.logger.log(`[update] Updating proyecto ID: ${id}`);
      return await this.proyectosService.update(id, updateProyectoDto);
    } catch (error) {
      this.logger.error(`[update] Error updating proyecto ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`[remove] Deleting proyecto ID: ${id}`);
      return await this.proyectosService.remove(id);
    } catch (error) {
      this.logger.error(`[remove] Error deleting proyecto ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =====================
  // RECURSOS SALARY OVERRIDES (by proyecto)
  // =====================

  /**
   * GET /proyectos/:id/recursos-costos?year=YYYY
   * Get salary overrides for all recursos assigned to this proyecto in the given year
   * Returns: { overrides: { [recursoId]: { [month]: costoMensual } } }
   */
  @Get(':id/recursos-costos')
  getRecursosCostos(
    @Param('id') id: string,
    @Query('year') year: string,
  ) {
    return this.recursosService.getCostosByProyecto(id, Number(year) || new Date().getFullYear());
  }

  // =====================
  // COSTOS MANUALES (otros costos, guardias + hs extras)
  // =====================

  @Get(':id/costos-manuales')
  getCostosManuales(
    @Param('id') id: string,
    @Query('year') year: string,
  ) {
    return this.proyectosService.getCostosManuales(id, Number(year) || new Date().getFullYear());
  }

  @Put(':id/costos-manuales')
  upsertCostosManuales(
    @Param('id') id: string,
    @Query('year') year: string,
    @Body() dto: UpsertCostosManualesDto,
  ) {
    return this.proyectosService.upsertCostosManuales(
      id,
      Number(year) || new Date().getFullYear(),
      dto,
    );
  }

  // =====================
  // TARIFARIO MANAGEMENT
  // =====================

  /**
   * DELETE /proyectos/:id/tarifario
   * Removes tarifario assignment from proyecto and cascade deletes all related data:
   * - Plan lineas (ProyectoPlanLinea + ProyectoPlanLineaMes)
   * - Forecast/Revenue plan (ProyectoTarifarioPlan + lineas + meses)
   * Sets proyecto.tarifarioRevenuePlanId = null
   */
  @Delete(':id/tarifario')
  async removeTarifario(@Param('id') id: string) {
    this.logger.log(`[removeTarifario] Removing tarifario from proyecto ID: ${id}`);
    try {
      return await this.proyectosService.removeTarifario(id);
    } catch (error) {
      this.logger.error(
        `[removeTarifario] Error removing tarifario from proyecto ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
