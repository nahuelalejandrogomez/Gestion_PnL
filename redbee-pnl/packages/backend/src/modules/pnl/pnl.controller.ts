import { Controller, Get, Param, Query } from '@nestjs/common';
import { PnlService } from './pnl.service';

@Controller('pnl')
export class PnlController {
  constructor(private readonly pnlService: PnlService) {}

  @Get('proyecto/:id')
  calculateByProyecto(
    @Param('id') id: string,
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    const now = new Date();
    const anioNum = anio ? parseInt(anio, 10) : now.getFullYear();
    const mesNum = mes ? parseInt(mes, 10) : now.getMonth() + 1;

    return this.pnlService.calculateByProyecto(id, anioNum, mesNum);
  }
}
