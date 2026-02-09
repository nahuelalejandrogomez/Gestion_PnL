import {
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoProyecto, EstadoProyecto } from '@prisma/client';

export class CreateProyectoDto {
  @IsUUID()
  clienteId: string;

  @IsString()
  nombre: string;

  @IsString()
  codigo: string;

  @IsEnum(TipoProyecto)
  @IsOptional()
  tipo?: TipoProyecto;

  @IsEnum(EstadoProyecto)
  @IsOptional()
  estado?: EstadoProyecto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  probabilidadCierre?: number;

  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  @IsDate()
  fechaInicio: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  @IsDate()
  fechaFinEstimada?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  @IsDate()
  fechaFinReal?: Date;

  @IsUUID()
  @IsOptional()
  tarifarioId?: string;

  @IsUUID()
  @IsOptional()
  contratoId?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
