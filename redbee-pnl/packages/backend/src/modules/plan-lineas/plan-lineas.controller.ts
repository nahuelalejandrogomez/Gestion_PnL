import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { PlanLineasService } from './plan-lineas.service';
import { QueryPlanLineasDto } from './dto/query-plan-lineas.dto';
import { UpsertPlanLineasDto } from './dto/upsert-plan-lineas.dto';

@Controller('proyectos/:proyectoId/plan-lineas')
export class PlanLineasController {
  constructor(private readonly planLineasService: PlanLineasService) {}

  @Get()
  getPlanLineas(
    @Param('proyectoId') proyectoId: string,
    @Query() query: QueryPlanLineasDto,
  ) {
    return this.planLineasService.getPlanLineas(proyectoId, query.year);
  }

  @Put()
  upsertPlanLineas(
    @Param('proyectoId') proyectoId: string,
    @Body() dto: UpsertPlanLineasDto,
  ) {
    return this.planLineasService.upsertPlanLineas(proyectoId, dto);
  }
}
