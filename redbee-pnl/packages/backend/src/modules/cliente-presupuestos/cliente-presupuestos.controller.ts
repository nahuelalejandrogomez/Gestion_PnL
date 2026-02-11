import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClientePresupuestosService } from './cliente-presupuestos.service';

@Controller('clientes/:clienteId/presupuestos')
export class ClientePresupuestosController {
  constructor(
    private readonly clientePresupuestosService: ClientePresupuestosService,
  ) {}

  @Get()
  getPresupuestosCliente(
    @Param('clienteId') clienteId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? Number(year) : undefined;
    return this.clientePresupuestosService.getPresupuestosCliente(
      clienteId,
      yearNum,
    );
  }
}
