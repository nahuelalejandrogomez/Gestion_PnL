import { Controller, Get, Put, Post, Param, Query, Body } from '@nestjs/common';
import { ProyectoTarifarioPlanService } from './proyecto-tarifario-plan.service';
import { UpdateProyectoTarifarioPlanDto, AplicarTarifarioDto } from './dto';

@Controller('proyectos/:proyectoId/tarifario-plan')
export class ProyectoTarifarioPlanController {
  constructor(
    private readonly proyectoTarifarioPlanService: ProyectoTarifarioPlanService,
  ) {}

  @Get()
  getPlan(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.proyectoTarifarioPlanService.getPlan(proyectoId, yearNum);
  }

  @Put()
  updatePlan(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year?: string,
    @Body() dto: UpdateProyectoTarifarioPlanDto = { tarifarioId: '', meses: [] },
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.proyectoTarifarioPlanService.updatePlan(proyectoId, yearNum, dto);
  }

  @Post('aplicar')
  aplicarTarifario(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year?: string,
    @Body() dto: AplicarTarifarioDto = { tarifarioId: '' },
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.proyectoTarifarioPlanService.aplicarTarifario(
      proyectoId,
      yearNum,
      dto,
    );
  }
}
