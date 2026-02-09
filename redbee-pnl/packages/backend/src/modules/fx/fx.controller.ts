import { Controller, Get, Put, Query, Body, BadRequestException } from '@nestjs/common';
import { FxService } from './fx.service';
import { UpsertFxRatesDto } from './fx.dto';

@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  /**
   * GET /fx?year=YYYY
   * Get all FX rates for a year with effective values
   */
  @Get()
  getByYear(@Query('year') year: string) {
    const yearNum = Number(year);
    if (!year || isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestException('Query param "year" is required and must be between 2020-2100');
    }
    return this.fxService.getByYear(yearNum);
  }

  /**
   * PUT /fx?year=YYYY
   * Upsert FX rates for a year
   */
  @Put()
  upsertRates(@Query('year') year: string, @Body() dto: UpsertFxRatesDto) {
    const yearNum = Number(year);
    if (!year || isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestException('Query param "year" is required and must be between 2020-2100');
    }
    return this.fxService.upsertRates(yearNum, dto);
  }
}
