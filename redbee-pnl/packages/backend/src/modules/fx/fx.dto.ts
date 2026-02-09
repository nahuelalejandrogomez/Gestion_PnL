import { IsArray, ValidateNested, IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FxRateItemDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => Number(value))
  month: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value === null || value === '' ? null : Number(value)))
  real?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value === null || value === '' ? null : Number(value)))
  plan?: number | null;
}

export class UpsertFxRatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FxRateItemDto)
  items: FxRateItemDto[];
}

// Response types
export interface FxRateMonthResponse {
  month: number;
  real: number | null;
  plan: number | null;
  effective: number | null; // The value to use (REAL > PLAN > fallback)
  isFallback: boolean;
}

export interface FxRatesResponse {
  year: number;
  rates: FxRateMonthResponse[];
}
