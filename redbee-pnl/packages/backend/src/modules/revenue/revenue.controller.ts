import { Controller, Get, Param, Query } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('cliente/:id')
  async getClienteRevenue(
    @Param('id') clienteId: string,
    @Query() query: RevenueQueryDto,
  ) {
    return this.revenueService.calculateClienteRevenue(clienteId, query.year);
  }
}
