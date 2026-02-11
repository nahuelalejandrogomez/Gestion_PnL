import { IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Moneda } from '@prisma/client';
import { UpdatePresupuestoMesDto } from './update-presupuesto-mes.dto';

export class UpdatePresupuestoDto {
  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePresupuestoMesDto)
  @IsOptional()
  months?: UpdatePresupuestoMesDto[];
}
