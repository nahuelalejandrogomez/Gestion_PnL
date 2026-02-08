import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EstadoCliente } from '@prisma/client';

export class CreateClienteDto {
  @IsString()
  nombre: string;

  @IsString()
  razonSocial: string;

  @IsString()
  cuilCuit: string;

  @IsEnum(EstadoCliente)
  @IsOptional()
  estado?: EstadoCliente;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
