import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EstadoPotencial, Moneda } from '@prisma/client';

export class CreateClientePotencialLineaMesDto {
  @IsNumber()
  year: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(0)
  ftes: number;

  @IsNumber()
  @Min(0)
  revenueEstimado: number;
}

export class CreateClientePotencialLineaDto {
  @IsString()
  perfilId: string;

  @IsString()
  @IsOptional()
  nombreLinea?: string;

  @IsOptional()
  @Type(() => CreateClientePotencialLineaMesDto)
  meses?: CreateClientePotencialLineaMesDto[];
}

export class CreateClientePotencialDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  probabilidadCierre: number;

  @IsEnum(EstadoPotencial)
  @IsOptional()
  estado?: EstadoPotencial;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fechaEstimadaCierre?: Date;

  @IsEnum(Moneda)
  @IsOptional()
  moneda?: Moneda;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsOptional()
  @Type(() => CreateClientePotencialLineaDto)
  lineas?: CreateClientePotencialLineaDto[];
}
