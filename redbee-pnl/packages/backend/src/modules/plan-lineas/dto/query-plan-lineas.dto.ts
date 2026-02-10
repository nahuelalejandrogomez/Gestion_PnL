import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPlanLineasDto {
  @IsInt()
  @Min(2020)
  @Max(2050)
  @Type(() => Number)
  year: number;
}
