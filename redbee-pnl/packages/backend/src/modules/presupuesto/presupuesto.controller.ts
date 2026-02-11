import { Controller, Get, Put, Post, Param, Query, Body } from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { AplicarClientePresupuestoDto } from './dto/aplicar-cliente-presupuesto.dto';

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

  @Post('aplicar')
  aplicarClientePresupuesto(
    @Param('proyectoId') proyectoId: string,
    @Body() dto: AplicarClientePresupuestoDto,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? Number(year) : new Date().getFullYear();
    return this.presupuestoService.aplicarClientePresupuesto(proyectoId, yearNum, dto);
  }
}
