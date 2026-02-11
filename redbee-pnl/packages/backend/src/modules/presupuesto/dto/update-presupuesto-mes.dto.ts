import { IsInt, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdatePresupuestoMesDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsBoolean()
  @IsOptional()
  isOverride?: boolean;
}
