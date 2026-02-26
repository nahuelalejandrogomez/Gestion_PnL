import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoPotencial } from '@prisma/client';

export class CambiarEstadoDto {
  @IsEnum(EstadoPotencial)
  estado: EstadoPotencial;

  @IsString()
  @IsOptional()
  proyectoId?: string;
}
