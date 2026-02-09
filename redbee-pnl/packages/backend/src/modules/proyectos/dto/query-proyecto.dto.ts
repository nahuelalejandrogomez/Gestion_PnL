import { IsEnum, IsOptional, IsString, IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoProyecto, TipoProyecto } from '@prisma/client';

export class QueryProyectoDto {
  @IsUUID()
  @IsOptional()
  clienteId?: string;

  @IsEnum(EstadoProyecto)
  @IsOptional()
  estado?: EstadoProyecto;

  @IsEnum(TipoProyecto)
  @IsOptional()
  tipo?: TipoProyecto;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
