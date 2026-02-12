import { Controller, Get, Param, Query } from '@nestjs/common';
import { PnlService } from './pnl.service';

@Controller('pnl')
export class PnlController {
  constructor(private readonly pnlService: PnlService) {}

  @Get('proyecto/:id')
  calculateByProyecto(
    @Param('id') id: string,
    @Query('year') year: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.pnlService.calculatePnlYear(id, yearNum);
  }
}
