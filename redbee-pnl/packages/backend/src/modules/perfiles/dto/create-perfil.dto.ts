import { IsString, IsEnum, IsOptional } from 'class-validator';
import { NivelPerfil, EstadoPerfil } from '@prisma/client';

export class CreatePerfilDto {
  @IsString()
  nombre: string;

  @IsString()
  categoria: string;

  @IsEnum(NivelPerfil)
  @IsOptional()
  nivel?: NivelPerfil;

  @IsEnum(EstadoPerfil)
  @IsOptional()
  estado?: EstadoPerfil;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
