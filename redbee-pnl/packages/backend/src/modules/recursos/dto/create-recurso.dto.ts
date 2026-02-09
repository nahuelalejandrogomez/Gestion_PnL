import { IsString, IsEnum, IsOptional, IsDate, IsNumber, IsUUID, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoRecurso, Moneda } from '@prisma/client';

export class CreateRecursoDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsEmail()
  email: string;

  @IsUUID()
  perfilId: string;

  @IsEnum(EstadoRecurso)
  @IsOptional()
  estado?: EstadoRecurso;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fechaIngreso: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fechaEgreso?: Date;

  @IsNumber()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  costoMensual: number;

  @IsEnum(Moneda)
  @IsOptional()
  monedaCosto?: Moneda;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  utilizacionTarget?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
