import { IsString, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Moneda, EstadoTarifario, UnidadTarifaria } from '@prisma/client';

export class CreateLineaTarifarioDto {
  @IsUUID()
  perfilId: string;

  @IsNumber()
  rate: number;

  @IsEnum(UnidadTarifaria)
  @IsOptional()
  unidad?: UnidadTarifaria;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;
}

export class CreateTarifarioDto {
  @IsUUID()
  clienteId: string;

  @IsUUID()
  @IsOptional()
  contratoId?: string;

  @IsString()
  nombre: string;

  @IsDateString()
  fechaVigenciaDesde: string;

  @IsDateString()
  @IsOptional()
  fechaVigenciaHasta?: string;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsEnum(EstadoTarifario)
  @IsOptional()
  estado?: EstadoTarifario;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineaTarifarioDto)
  @IsOptional()
  lineas?: CreateLineaTarifarioDto[];
}
