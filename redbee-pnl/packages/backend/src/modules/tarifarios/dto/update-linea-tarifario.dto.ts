import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Moneda } from '@prisma/client';

export class UpdateLineaTarifarioDto {
  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda | null;
}
