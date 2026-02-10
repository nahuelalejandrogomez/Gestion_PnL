import { IsString, IsUrl, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { TipoContrato, EstadoContrato, Moneda } from '@prisma/client';

export class CreateContratoDto {
  @IsString()
  nombre: string;

  @IsEnum(TipoContrato)
  tipo: TipoContrato;

  @IsDateString()
  fechaFirma: string;

  @IsDateString()
  fechaInicioVigencia: string;

  @IsOptional()
  @IsDateString()
  fechaFinVigencia?: string;

  @IsOptional()
  @IsUrl()
  documentoDriveUrl?: string;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsNumber()
  montoTotal?: number;

  @IsOptional()
  @IsEnum(Moneda)
  moneda?: Moneda;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateContratoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoContrato)
  tipo?: TipoContrato;

  @IsOptional()
  @IsDateString()
  fechaFirma?: string;

  @IsOptional()
  @IsDateString()
  fechaInicioVigencia?: string;

  @IsOptional()
  @IsDateString()
  fechaFinVigencia?: string;

  @IsOptional()
  @IsUrl()
  documentoDriveUrl?: string;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsNumber()
  montoTotal?: number;

  @IsOptional()
  @IsEnum(Moneda)
  moneda?: Moneda;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class ContratoResponseDto {
  id: string;
  clienteId: string;
  nombre: string;
  tipo: TipoContrato;
  fechaFirma: Date;
  fechaInicioVigencia: Date;
  fechaFinVigencia: Date | null;
  documentoDriveUrl: string | null;
  estado: EstadoContrato;
  montoTotal: number | null;
  moneda: Moneda | null;
  notas: string | null;
  createdAt: Date;
  updatedAt: Date;
}
