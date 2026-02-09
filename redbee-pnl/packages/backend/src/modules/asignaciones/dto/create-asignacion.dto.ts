import { IsUUID, IsNumber, IsEnum, IsOptional, IsDate, IsString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoTiempo } from '@prisma/client';

export class CreateAsignacionDto {
  @IsUUID()
  recursoId: string;

  @IsUUID()
  proyectoId: string;

  @IsNumber()
  @Min(0)
  @Max(200)
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  porcentajeAsignacion: number;

  @IsEnum(TipoTiempo)
  @IsOptional()
  tipoTiempo?: TipoTiempo;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fechaDesde: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fechaHasta?: Date;

  @IsString()
  @IsOptional()
  rolEnProyecto?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
