import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';

@Controller('proyectos/:proyectoId/presupuesto')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  @Get()
  getPresupuesto(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.presupuestoService.getPresupuesto(proyectoId, yearNum);
  }

  @Put()
  updatePresupuesto(
    @Param('proyectoId') proyectoId: string,
    @Query('year') year?: string,
    @Body() dto?: UpdatePresupuestoDto,
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.presupuestoService.updatePresupuesto(proyectoId, yearNum, dto || {});
  }
}
