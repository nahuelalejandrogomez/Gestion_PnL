import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCliente } from '@prisma/client';

export class QueryClienteDto {
  @IsEnum(EstadoCliente)
  @IsOptional()
  estado?: EstadoCliente;

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
