import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EstadoCliente, PaisCliente, TipoComercialCliente } from '@prisma/client';

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

  @IsEnum(PaisCliente)
  @IsOptional()
  pais?: PaisCliente;

  @IsEnum(TipoComercialCliente)
  @IsOptional()
  tipoComercial?: TipoComercialCliente;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    // Convert "YYYY-MM-DD" or ISO string to Date
    return new Date(value);
  })
  @IsDate()
  fechaInicio?: Date;

  @IsString()
  @IsOptional()
  notas?: string;
}
